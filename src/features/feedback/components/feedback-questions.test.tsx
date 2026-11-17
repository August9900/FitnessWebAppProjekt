import { act, render, screen, within } from '@testing-library/react'
import { NO_FEEDBACK } from '../feedback.rules'

const saveFeedback = vi.fn()
vi.mock('../feedback.actions', () => ({ saveFeedback }))

const { FeedbackQuestions } = await import('./feedback-questions')

const ACTION_ID = '33333333-3333-4333-8333-333333333333'

async function tap(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

const group = (name: string) => screen.getByRole('group', { name })
const answer = (groupName: string, name: string) => within(group(groupName)).getByRole('button', { name })

beforeEach(() => {
  vi.clearAllMocks()
  saveFeedback.mockResolvedValue({ ok: true })
})

describe('FeedbackQuestions', () => {
  it('zeigt die zwei Fragen mit ihren Antworten, ohne Vorauswahl und ohne Absenden-Knopf (AC-1)', () => {
    render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)
    expect(within(group('Wie war der Aufwand?')).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Zu wenig',
      'Passte',
      'Zu viel',
    ])
    expect(within(group('Wieder vorschlagen?')).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Gern wieder',
      'Lieber nicht',
    ])
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Senden|Speichern|Fertig/ })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('speichert einen Tipp sofort und markiert die Antwort — die Fragen unabhängig voneinander (AC-3)', async () => {
    render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)
    await tap(answer('Wie war der Aufwand?', 'Zu viel'))
    expect(saveFeedback).toHaveBeenCalledWith({ actionId: ACTION_ID, question: 'effort', value: 'too_much' })
    expect(answer('Wie war der Aufwand?', 'Zu viel')).toHaveAttribute('aria-pressed', 'true')
    expect(within(group('Wieder vorschlagen?')).queryAllByRole('button', { pressed: true })).toHaveLength(0)

    await tap(answer('Wieder vorschlagen?', 'Lieber nicht'))
    expect(saveFeedback).toHaveBeenLastCalledWith({ actionId: ACTION_ID, question: 'suggestAgain', value: 'no' })
    expect(answer('Wie war der Aufwand?', 'Zu viel')).toHaveAttribute('aria-pressed', 'true')
    expect(answer('Wieder vorschlagen?', 'Lieber nicht')).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt gespeicherte Antworten als Vorauswahl (AC-5) und ersetzt sie mit einem neuen Tipp (AC-6)', async () => {
    render(<FeedbackQuestions actionId={ACTION_ID} initial={{ effort: 'just_right', suggestAgain: 'yes' }} />)
    expect(answer('Wie war der Aufwand?', 'Passte')).toHaveAttribute('aria-pressed', 'true')
    expect(answer('Wieder vorschlagen?', 'Gern wieder')).toHaveAttribute('aria-pressed', 'true')

    await tap(answer('Wie war der Aufwand?', 'Zu wenig'))
    expect(saveFeedback).toHaveBeenCalledWith({ actionId: ACTION_ID, question: 'effort', value: 'too_little' })
    expect(answer('Wie war der Aufwand?', 'Zu wenig')).toHaveAttribute('aria-pressed', 'true')
    expect(answer('Wie war der Aufwand?', 'Passte')).toHaveAttribute('aria-pressed', 'false')
  })

  it('sendet bei schnellen Tipps nacheinander und lässt den zuletzt getippten gelten (EC-1)', async () => {
    const pending: ((value: unknown) => void)[] = []
    saveFeedback.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))
    render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)

    await tap(answer('Wie war der Aufwand?', 'Zu viel'))
    await tap(answer('Wie war der Aufwand?', 'Passte'))
    await tap(answer('Wie war der Aufwand?', 'Zu wenig'))
    expect(saveFeedback).toHaveBeenCalledTimes(1)
    expect(answer('Wie war der Aufwand?', 'Zu wenig')).toHaveAttribute('aria-pressed', 'true')

    await act(async () => pending[0]({ ok: true }))
    expect(saveFeedback).toHaveBeenCalledTimes(2)
    expect(saveFeedback).toHaveBeenLastCalledWith({ actionId: ACTION_ID, question: 'effort', value: 'too_little' })

    await act(async () => pending[1]({ ok: true }))
    expect(saveFeedback).toHaveBeenCalledTimes(2)
    expect(answer('Wie war der Aufwand?', 'Zu wenig')).toHaveAttribute('aria-pressed', 'true')
  })

  it('fällt nach einem Fehler des letzten Tipps auf die zuvor gespeicherte Antwort zurück (EC-1, EC-3)', async () => {
    const pending: ((value: unknown) => void)[] = []
    saveFeedback.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))
    render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)

    await tap(answer('Wie war der Aufwand?', 'Zu viel'))
    await tap(answer('Wie war der Aufwand?', 'Zu wenig'))
    await act(async () => pending[0]({ ok: true }))
    await act(async () => pending[1]({ ok: false, reason: 'failed' }))

    expect(answer('Wie war der Aufwand?', 'Zu viel')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('lässt die andere Frage nicht warten, während eine Frage speichert', async () => {
    saveFeedback.mockImplementationOnce(() => new Promise(() => {}))
    render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)
    await tap(answer('Wie war der Aufwand?', 'Zu viel'))
    await tap(answer('Wieder vorschlagen?', 'Gern wieder'))
    expect(saveFeedback).toHaveBeenCalledTimes(2)
  })

  it('zeigt bei einem Fehler die Meldung, markiert die zuletzt gespeicherte Antwort und versucht es erneut (EC-3)', async () => {
    saveFeedback.mockResolvedValueOnce({ ok: false, reason: 'failed' })
    render(<FeedbackQuestions actionId={ACTION_ID} initial={{ effort: 'just_right', suggestAgain: null }} />)
    await tap(answer('Wie war der Aufwand?', 'Zu viel'))

    expect(screen.getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt. Bitte versuch es noch einmal.')
    expect(answer('Wie war der Aufwand?', 'Passte')).toHaveAttribute('aria-pressed', 'true')
    expect(answer('Wie war der Aufwand?', 'Zu viel')).toHaveAttribute('aria-pressed', 'false')

    await tap(within(screen.getByRole('alert')).getByRole('button', { name: 'Nochmal versuchen' }))
    expect(saveFeedback).toHaveBeenCalledTimes(2)
    expect(saveFeedback).toHaveBeenLastCalledWith({ actionId: ACTION_ID, question: 'effort', value: 'too_much' })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(answer('Wie war der Aufwand?', 'Zu viel')).toHaveAttribute('aria-pressed', 'true')
  })

  it('zeigt keinen Fehler, wenn die Karte nicht mehr gilt — die Seite zeigt den Zustand (EC-4)', async () => {
    saveFeedback.mockResolvedValue({ ok: false, reason: 'not_possible' })
    render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)
    await tap(answer('Wieder vorschlagen?', 'Lieber nicht'))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(answer('Wieder vorschlagen?', 'Lieber nicht')).toHaveAttribute('aria-pressed', 'false')
  })

  it('erinnert nicht und mahnt nicht, wenn nicht geantwortet wird (AC-4)', () => {
    const { container } = render(<FeedbackQuestions actionId={ACTION_ID} initial={NO_FEEDBACK} />)
    expect(container.textContent).not.toMatch(/fehlt|bitte antworte|noch nicht|erinner/i)
  })
})
