import { act, render, screen, within } from '@testing-library/react'
import type { ConclusionItem, OpenActionItem } from './open-actions'

const concludeAction = vi.fn()
const undoConclusion = vi.fn()
vi.mock('../today.actions', () => ({ concludeAction, undoConclusion }))

const saveFeedback = vi.fn()
vi.mock('@/features/feedback/feedback.actions', () => ({ saveFeedback }))

const { OpenActions } = await import('./open-actions')

const ID_A = '33333333-3333-4333-8333-333333333333'
const ID_B = '44444444-4444-4444-8444-444444444444'

const workoutAction: OpenActionItem = { id: ID_A, kind: 'move', title: 'Morgens mobil', href: '/bewegung/morgen_mobil_5/los' }
const mealAction: OpenActionItem = { id: ID_B, kind: 'eat', title: 'Brot mit Hummus', href: '/essen/hummus_brot' }

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  concludeAction.mockResolvedValue({ ok: true, changed: true, status: 'done', feedback: null })
  undoConclusion.mockResolvedValue({ ok: true, status: 'started' })
})

describe('OpenActions', () => {
  it('zeigt nichts ohne offene Aktion und ohne Markierung', () => {
    const { container } = render(<OpenActions openActions={[]} lastConclusion={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('zeigt jede offene Aktion mit Titel, „Weitermachen“, „Geschafft“ und „Heute nicht“ (AC-13)', () => {
    render(<OpenActions openActions={[workoutAction, mealAction]} lastConclusion={null} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)

    const first = within(items[0])
    expect(first.getByText('Morgens mobil')).toBeInTheDocument()
    expect(first.getByRole('link', { name: 'Weitermachen' })).toHaveAttribute('href', '/bewegung/morgen_mobil_5/los')
    expect(first.getByRole('button', { name: 'Geschafft' })).toBeInTheDocument()
    expect(first.getByRole('button', { name: 'Heute nicht' })).toBeInTheDocument()
    expect(within(items[1]).getByRole('link', { name: 'Weitermachen' })).toHaveAttribute('href', '/essen/hummus_brot')
  })

  it('„Weitermachen“ beginnt nichts erneut', () => {
    render(<OpenActions openActions={[workoutAction]} lastConclusion={null} />)
    screen.getByRole('link', { name: 'Weitermachen' }).click()
    expect(concludeAction).not.toHaveBeenCalled()
  })

  it('nennt einen Inhalt ohne Titel neutral', () => {
    render(<OpenActions openActions={[{ ...workoutAction, title: null }]} lastConclusion={null} />)
    expect(screen.getByText('Dein Workout')).toBeInTheDocument()
  })

  it('markiert mit „Geschafft“ bzw. „Heute nicht“ genau diese Aktion (AC-14)', async () => {
    render(<OpenActions openActions={[workoutAction, mealAction]} lastConclusion={null} />)
    await click(within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'Geschafft' }))
    expect(concludeAction).toHaveBeenCalledWith({ actionId: ID_A, status: 'done' })

    await click(within(screen.getAllByRole('listitem')[1]).getByRole('button', { name: 'Heute nicht' }))
    expect(concludeAction).toHaveBeenCalledWith({ actionId: ID_B, status: 'skipped' })
  })

  it('zeigt die Markierung ruhig und ohne Zähler oder Vorwurf, mit „Rückgängig“ (AC-14, AC-15)', () => {
    const done: ConclusionItem = { id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'done', feedback: null }
    const { rerender } = render(<OpenActions openActions={[]} lastConclusion={done} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Geschafft. Gut gemacht.')
    expect(status).toHaveTextContent('Morgens mobil')
    expect(within(status).getByRole('button', { name: 'Rückgängig' })).toBeInTheDocument()
    expect(status.textContent).not.toMatch(/\d|Streak|Punkte|leider/)

    rerender(<OpenActions openActions={[]} lastConclusion={{ ...done, status: 'skipped' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Okay. Vielleicht ein andermal.')
  })

  it('zeigt nach „Geschafft“ die Rückmeldungsfragen in der Karte, außerhalb der Ansage (PROJ-7 AC-1)', () => {
    render(<OpenActions openActions={[]} lastConclusion={{ id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'done', feedback: null }} />)
    const aufwand = screen.getByRole('group', { name: 'Wie war der Aufwand?' })
    expect(screen.getByRole('group', { name: 'Wieder vorschlagen?' })).toBeInTheDocument()
    expect(aufwand.closest('[aria-live]')).toHaveAttribute('aria-live', 'off')
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })

  it('wählt eine gespeicherte Rückmeldung vor (PROJ-7 AC-5)', () => {
    render(
      <OpenActions
        openActions={[]}
        lastConclusion={{ id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'done', feedback: { effort: 'too_much', suggestAgain: null } }}
      />
    )
    expect(within(screen.getByRole('group', { name: 'Wie war der Aufwand?' })).getByRole('button', { name: 'Zu viel' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('fragt nach „Heute nicht“ nichts (PROJ-7 AC-2)', () => {
    render(<OpenActions openActions={[]} lastConclusion={{ id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'skipped', feedback: null }} />)
    expect(screen.queryByRole('group')).toBeNull()
    expect(screen.queryByText('Wie war der Aufwand?')).toBeNull()
  })

  it('nimmt die Markierung mit „Rückgängig“ zurück (AC-15)', async () => {
    render(<OpenActions openActions={[]} lastConclusion={{ id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'done', feedback: null }} />)
    await click(screen.getByRole('button', { name: 'Rückgängig' }))
    expect(undoConclusion).toHaveBeenCalledWith({ actionId: ID_A })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('zeigt keinen Fehler, wenn „Rückgängig“ nicht mehr möglich ist — die Seite zeigt den Zustand', async () => {
    undoConclusion.mockResolvedValue({ ok: false, reason: 'not_possible', status: 'done', feedback: null })
    render(<OpenActions openActions={[]} lastConclusion={{ id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'done', feedback: null }} />)
    await click(screen.getByRole('button', { name: 'Rückgängig' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('zeigt den tatsächlichen Zustand ohne Fehler, wenn ein anderes Gerät zuerst markiert hat (EC-5)', async () => {
    concludeAction.mockResolvedValue({ ok: true, changed: false, status: 'done', feedback: null })
    const { rerender } = render(<OpenActions openActions={[workoutAction]} lastConclusion={null} />)
    await click(screen.getByRole('button', { name: 'Heute nicht' }))
    expect(screen.queryByRole('alert')).toBeNull()

    // The action refreshes "Heute"; the page then passes the actual state.
    rerender(<OpenActions openActions={[]} lastConclusion={{ id: ID_A, kind: 'move', title: 'Morgens mobil', status: 'done', feedback: null }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Geschafft. Gut gemacht.')
  })

  it('zeigt bei einem Fehler die Meldung mit „Nochmal versuchen“ an der Aktion (EC-9)', async () => {
    concludeAction.mockResolvedValueOnce({ ok: false, reason: 'failed' })
    render(<OpenActions openActions={[workoutAction, mealAction]} lastConclusion={null} />)
    const first = screen.getAllByRole('listitem')[0]
    await click(within(first).getByRole('button', { name: 'Geschafft' }))

    const alert = within(first).getByRole('alert')
    expect(alert).toHaveTextContent('Das hat gerade nicht geklappt. Bitte versuch es noch einmal.')
    expect(within(screen.getAllByRole('listitem')[1]).queryByRole('alert')).toBeNull()

    await click(within(alert).getByRole('button', { name: 'Nochmal versuchen' }))
    expect(concludeAction).toHaveBeenCalledTimes(2)
    expect(concludeAction).toHaveBeenLastCalledWith({ actionId: ID_A, status: 'done' })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('sperrt alle Knöpfe, solange eine Markierung läuft — Doppeltipps ändern nur einmal (EC-4)', async () => {
    let finish: (value: unknown) => void = () => {}
    concludeAction.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    render(<OpenActions openActions={[workoutAction]} lastConclusion={null} />)

    const done = screen.getByRole('button', { name: 'Geschafft' })
    await click(done)
    await click(done)
    await click(screen.getByRole('button', { name: 'Heute nicht' }))

    expect(concludeAction).toHaveBeenCalledTimes(1)
    expect(done).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Heute nicht' })).toBeDisabled()

    await act(async () => finish({ ok: true, changed: true, status: 'done', feedback: null }))
    expect(done).toBeEnabled()
  })
})
