import { act, render, screen, within } from '@testing-library/react'
import type { Place } from '@/features/profile/profile.schema'
import type { SuggestionItem } from '../today.actions'
import type { EatAnswers, MoveAnswers } from '../today.rules'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const requestSuggestion = vi.fn()
const startAction = vi.fn()
vi.mock('../today.actions', () => ({ requestSuggestion, startAction }))

const { TodayFlow } = await import('./today-flow')

const CHECK_IN_ID = '11111111-1111-4111-8111-111111111111'

const item = (id: string, overrides: Partial<SuggestionItem> = {}): SuggestionItem => ({
  id,
  title: `Titel ${id}`,
  detail: '10 Min',
  reviewStatus: 'reviewed',
  href: `/bewegung/${id}`,
  ...overrides,
})

const suggested = (kind: 'move' | 'eat', items: SuggestionItem[], fitsLine = 'Passt zu: 10 Min · wenig Energie · Zuhause') => ({
  ok: true,
  checkInId: CHECK_IN_ID,
  kind,
  fitsLine,
  items,
})

/** Counts every tap, so the AC-6 limits can be checked end to end. */
let taps = 0
async function tap(element: HTMLElement) {
  taps += 1
  await act(async () => {
    element.click()
  })
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })

function show({
  places = ['home', 'outdoors'] as Place[],
  move = null as MoveAnswers | null,
  eat = null as EatAnswers | null,
} = {}) {
  return render(<TodayFlow places={places} lastAnswers={{ move, eat }} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  taps = 0
  requestSuggestion.mockResolvedValue(suggested('move', [item('w_one'), item('w_two'), item('w_three')]))
  startAction.mockResolvedValue({ ok: true, href: '/bewegung/w_one/los' })
})

describe('Einstieg (AC-1)', () => {
  it('fragt „Was brauchst du gerade?“ mit „Bewegen“ und „Essen“', () => {
    show()
    expect(screen.getByRole('heading', { name: 'Was brauchst du gerade?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Was brauchst du gerade?' })).not.toHaveFocus()
    expect(button('Bewegen')).toBeInTheDocument()
    expect(button('Essen')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('Check-in (AC-2 bis AC-5)', () => {
  it('fragt bei „Bewegen“ nacheinander Zeit, Energie und Ort — je eine Frage pro Bildschirm (AC-2, AC-4)', async () => {
    show({ places: ['home', 'gym'] })
    await tap(button('Bewegen'))
    expect(screen.getByRole('heading', { name: 'Wie viel Zeit hast du?' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: false }).map((b) => b.textContent)).toEqual(['5 Min', '10 Min', '15 Min'])

    await tap(button('10 Min'))
    expect(screen.getByRole('heading', { name: 'Wie viel Energie hast du?' })).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Wie viel Zeit hast du?' })).toBeNull()
    await tap(button('wenig'))

    expect(screen.getByRole('heading', { name: 'Wo bist du?' })).toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Wo bist du?' })
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['Zuhause', 'Fitnessstudio'])
    expect(requestSuggestion).not.toHaveBeenCalled()

    await tap(button('Fitnessstudio'))
    expect(requestSuggestion).toHaveBeenCalledWith({ kind: 'move', minutes: 10, energy: 'low', place: 'gym' })
  })

  it('lässt die Ortsfrage bei nur einem Profil-Ort weg (AC-2)', async () => {
    show({ places: ['outdoors'] })
    await tap(button('Bewegen'))
    await tap(button('5 Min'))
    await tap(button('viel'))
    expect(requestSuggestion).toHaveBeenCalledWith({ kind: 'move', minutes: 5, energy: 'high', place: 'outdoors' })
  })

  it('fragt bei „Essen“ genau „Wie viel geht gerade?“ (AC-3)', async () => {
    requestSuggestion.mockResolvedValue(suggested('eat', [item('m_one')], 'Passt zu: Kurz kochen'))
    show()
    await tap(button('Essen'))
    expect(screen.getByRole('heading', { name: 'Wie viel geht gerade?' })).toBeInTheDocument()
    const group = screen.getByRole('group', { name: 'Wie viel geht gerade?' })
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['Gar nicht kochen', 'Kurz kochen', 'Bis 20 Min'])
    await tap(button('Kurz kochen'))
    expect(requestSuggestion).toHaveBeenCalledWith({ kind: 'eat', effort: 'quick' })
  })

  it('geht mit „Zurück“ zur vorigen Frage, ohne Antworten zu verlieren (AC-4)', async () => {
    show()
    await tap(button('Bewegen'))
    await tap(button('15 Min'))
    await tap(button('mittel'))
    await tap(button('Zurück'))
    expect(button('mittel')).toHaveAttribute('aria-pressed', 'true')
    await tap(button('Zurück'))
    expect(button('15 Min')).toHaveAttribute('aria-pressed', 'true')
    await tap(button('Zurück'))
    expect(screen.getByRole('heading', { name: 'Was brauchst du gerade?' })).toHaveFocus()
    await tap(button('Bewegen'))
    expect(button('15 Min')).toHaveAttribute('aria-pressed', 'true')
  })

  it('wählt die letzten Antworten sichtbar vor und bietet „Wie letztes Mal“ an (AC-5)', async () => {
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    expect(button('10 Min')).toHaveAttribute('aria-pressed', 'true')
    expect(button('5 Min')).toHaveAttribute('aria-pressed', 'false')

    const repeat = button(/Wie letztes Mal/)
    expect(repeat).toHaveTextContent('10 Min · wenig Energie · Zuhause')
    await tap(repeat)
    expect(requestSuggestion).toHaveBeenCalledWith({ kind: 'move', minutes: 10, energy: 'low', place: 'home' })
    expect(screen.getByRole('heading', { name: 'Dein Vorschlag' })).toBeInTheDocument()
  })

  it('bietet „Wie letztes Mal“ ohne bisherigen Check-in nicht an', async () => {
    show()
    await tap(button('Bewegen'))
    expect(screen.queryByRole('button', { name: /Wie letztes Mal/ })).toBeNull()
  })

  it('wählt einen nicht mehr möglichen Ort nicht vor und bietet „Wie letztes Mal“ nicht an (EC-7)', async () => {
    show({ places: ['home', 'outdoors'], move: { kind: 'move', minutes: 10, energy: 'low', place: 'gym' } })
    await tap(button('Bewegen'))
    expect(screen.queryByRole('button', { name: /Wie letztes Mal/ })).toBeNull()
    await tap(button('10 Min'))
    await tap(button('wenig'))
    const group = screen.getByRole('group', { name: 'Wo bist du?' })
    for (const option of within(group).getAllByRole('button')) expect(option).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('Vorschlag (AC-9, AC-10, EC-1, EC-2)', () => {
  async function toSuggestion() {
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))
  }

  it('zeigt den Hauptvorschlag mit Titel, Dauer, „Passt zu“, Hinweis und „Los geht\'s“ und zwei Alternativen', async () => {
    requestSuggestion.mockResolvedValue(
      suggested('move', [item('w_one', { reviewStatus: 'unreviewed' }), item('w_two', { detail: '5 Min' }), item('w_three')])
    )
    await toSuggestion()

    expect(screen.getByRole('heading', { name: 'Dein Vorschlag' })).toHaveFocus()
    expect(screen.getByRole('heading', { level: 3, name: 'Titel w_one' })).toBeInTheDocument()
    expect(screen.getByText('Passt zu: 10 Min · wenig Energie · Zuhause')).toBeInTheDocument()
    expect(screen.getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: "Los geht's" })).toHaveLength(1)

    const alternatives = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(alternatives).toHaveLength(2)
    expect(alternatives[0]).toHaveTextContent('Titel w_two')
    expect(alternatives[0]).toHaveTextContent('5 Min')
    expect(within(alternatives[0]).getByRole('button', { name: /Stattdessen das/ })).toBeInTheDocument()
  })

  it('verlinkt die Titel nur auf das Detail, ohne etwas zu beginnen (AC-10)', async () => {
    await toSuggestion()
    expect(screen.getByRole('link', { name: 'Titel w_one' })).toHaveAttribute('href', '/bewegung/w_one')
    expect(screen.getByRole('link', { name: 'Titel w_two' })).toHaveAttribute('href', '/bewegung/w_two')
    expect(startAction).not.toHaveBeenCalled()
  })

  it('zeigt nur so viele Alternativen wie vorhanden (EC-2)', async () => {
    requestSuggestion.mockResolvedValue(suggested('move', [item('w_one')]))
    await toSuggestion()
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryByRole('button', { name: /Stattdessen das/ })).toBeNull()
  })

  it('zeigt ohne Treffer einen ruhigen Hinweis mit „Andere Angaben wählen“ und dem Weg zum Bereich (EC-1)', async () => {
    requestSuggestion.mockResolvedValue(suggested('move', []))
    await toSuggestion()
    expect(screen.getByRole('heading', { name: 'Gerade passt nichts genau.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zu Bewegung' })).toHaveAttribute('href', '/bewegung')
    await tap(button('Andere Angaben wählen'))
    expect(screen.getByRole('heading', { name: 'Wo bist du?' })).toBeInTheDocument()
  })

  it('führt bei „Essen“ ohne Treffer zu „Essen“', async () => {
    requestSuggestion.mockResolvedValue(suggested('eat', [], 'Passt zu: Kurz kochen'))
    show()
    await tap(button('Essen'))
    await tap(button('Kurz kochen'))
    expect(screen.getByRole('link', { name: 'Zu Essen' })).toHaveAttribute('href', '/essen')
  })

  it('kehrt mit „Andere Angaben wählen“ zur letzten Frage zurück, die Antworten bleiben', async () => {
    await toSuggestion()
    await tap(button('Andere Angaben wählen'))
    expect(button('Zuhause')).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Aktion beginnen (AC-6, AC-12, EC-4, EC-6, EC-9)', () => {
  it('beginnt mit „Los geht\'s“ den Hauptvorschlag und öffnet die Durchführung (AC-12)', async () => {
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))
    await tap(button("Los geht's"))
    expect(startAction).toHaveBeenCalledWith({ checkInId: CHECK_IN_ID, itemId: 'w_one' })
    expect(push).toHaveBeenCalledWith('/bewegung/w_one/los')
  })

  it('beginnt mit „Stattdessen das“ genau diese Alternative (AC-12)', async () => {
    startAction.mockResolvedValue({ ok: true, href: '/bewegung/w_three/los' })
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))
    await tap(button('Stattdessen das: Titel w_three'))
    expect(startAction).toHaveBeenCalledWith({ checkInId: CHECK_IN_ID, itemId: 'w_three' })
    expect(push).toHaveBeenCalledWith('/bewegung/w_three/los')
  })

  it('braucht höchstens 5 Tipps bis zum Workout-Start (AC-6)', async () => {
    show()
    await tap(button('Bewegen'))
    await tap(button('10 Min'))
    await tap(button('wenig'))
    await tap(button('Zuhause'))
    await tap(button("Los geht's"))
    expect(push).toHaveBeenCalledTimes(1)
    expect(taps).toBeLessThanOrEqual(5)
  })

  it('braucht mit „Wie letztes Mal“ höchstens 3 Tipps bis zum Workout-Start (AC-6)', async () => {
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))
    await tap(button("Los geht's"))
    expect(push).toHaveBeenCalledTimes(1)
    expect(taps).toBeLessThanOrEqual(3)
  })

  it('braucht höchstens 3 Tipps bis zum Start einer Mahlzeit (AC-6)', async () => {
    requestSuggestion.mockResolvedValue(suggested('eat', [item('m_one', { href: '/essen/m_one' })], 'Passt zu: Kurz kochen'))
    startAction.mockResolvedValue({ ok: true, href: '/essen/m_one' })
    show()
    await tap(button('Essen'))
    await tap(button('Kurz kochen'))
    await tap(button('Das mach ich'))
    expect(push).toHaveBeenCalledWith('/essen/m_one')
    expect(taps).toBeLessThanOrEqual(3)
  })

  it('sperrt die Knöpfe, solange der Start läuft und danach bis zum Seitenwechsel (EC-4)', async () => {
    let finish: (value: unknown) => void = () => {}
    startAction.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))

    await tap(button("Los geht's"))
    await tap(button("Los geht's"))
    await tap(button('Stattdessen das: Titel w_two'))
    expect(startAction).toHaveBeenCalledTimes(1)
    expect(button("Los geht's")).toBeDisabled()

    await act(async () => finish({ ok: true, href: '/bewegung/w_one/los' }))
    expect(button("Los geht's")).toBeDisabled()
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('sperrt die Antworten, solange der Vorschlag angefordert wird (EC-4)', async () => {
    let finish: (value: unknown) => void = () => {}
    requestSuggestion.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    show({ places: ['home'] })
    await tap(button('Bewegen'))
    await tap(button('10 Min'))
    await tap(button('wenig'))
    await tap(button('wenig'))
    expect(requestSuggestion).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Einen Moment')
    await act(async () => finish(suggested('move', [item('w_one')])))
    expect(screen.getByRole('heading', { name: 'Dein Vorschlag' })).toBeInTheDocument()
  })

  it('zeigt „Das gibt es leider nicht mehr.“ und holt mit denselben Angaben einen neuen Vorschlag (EC-6)', async () => {
    startAction.mockResolvedValueOnce({ ok: false, reason: 'gone' })
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))
    await tap(button("Los geht's"))

    expect(screen.getByRole('alert')).toHaveTextContent('Das gibt es leider nicht mehr.')
    expect(push).not.toHaveBeenCalled()
    await tap(button('Neuer Vorschlag'))
    expect(requestSuggestion).toHaveBeenCalledTimes(2)
    expect(requestSuggestion).toHaveBeenLastCalledWith({ kind: 'move', minutes: 10, energy: 'low', place: 'home' })
  })

  it('zeigt beim Fehlschlag des Vorschlags die Meldung mit „Nochmal versuchen“, die Antworten bleiben (EC-9)', async () => {
    requestSuggestion.mockResolvedValueOnce({ ok: false, reason: 'failed' })
    show()
    await tap(button('Bewegen'))
    await tap(button('15 Min'))
    await tap(button('mittel'))
    await tap(button('Zuhause'))

    expect(screen.getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt. Bitte versuch es noch einmal.')
    expect(button('Zuhause')).toHaveAttribute('aria-pressed', 'true')
    await tap(button('Nochmal versuchen'))
    expect(requestSuggestion).toHaveBeenCalledTimes(2)
    expect(requestSuggestion).toHaveBeenLastCalledWith({ kind: 'move', minutes: 15, energy: 'medium', place: 'home' })
    expect(screen.getByRole('heading', { name: 'Dein Vorschlag' })).toBeInTheDocument()
  })

  it('zeigt beim Fehlschlag des Starts die Meldung und versucht denselben Inhalt erneut (EC-9)', async () => {
    startAction.mockResolvedValueOnce({ ok: false, reason: 'failed' })
    show({ move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } })
    await tap(button('Bewegen'))
    await tap(button(/Wie letztes Mal/))
    await tap(button('Stattdessen das: Titel w_two'))

    expect(screen.getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt.')
    await tap(button('Nochmal versuchen'))
    expect(startAction).toHaveBeenLastCalledWith({ checkInId: CHECK_IN_ID, itemId: 'w_two' })
  })
})
