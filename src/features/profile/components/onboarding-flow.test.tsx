import { act, render, screen } from '@testing-library/react'
import { EMPTY_ANSWERS, applyAnswer, isComplete, type ProfileAnswers } from '../profile.rules'
import { MESSAGES, type QuestionKey } from '../profile.schema'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

// The server action, simulated with the same rules the real one uses.
const saveOnboardingAnswer = vi.fn()
vi.mock('../profile.actions', () => ({ saveOnboardingAnswer }))

const { OnboardingFlow, CONFIRMATION_MS } = await import('./onboarding-flow')

let stored: ProfileAnswers
function realisticSave() {
  saveOnboardingAnswer.mockImplementation(async ({ question, value }) => {
    stored = applyAnswer(stored, question, value)
    return { ok: true, answers: stored, complete: isComplete(stored) }
  })
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  vi.clearAllMocks()
  stored = EMPTY_ANSWERS
  realisticSave()
})

function start(answers: ProfileAnswers = EMPTY_ANSWERS, question: QuestionKey = 'goal') {
  stored = answers
  return render(<OnboardingFlow initialAnswers={answers} initialQuestion={question} />)
}

async function clickAndSettle(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

describe('OnboardingFlow', () => {
  it('zeigt genau eine Frage mit Fortschritt und ohne Texteingabe (AC-2, AC-11)', () => {
    start()
    expect(screen.getByRole('heading', { level: 1, name: 'Was möchtest du mit PULSE erreichen?' })).toBeInTheDocument()
    expect(screen.getByText('Frage 1 von 4')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Zurück' })).toBeNull()
  })

  it('bleibt ohne Antwort bei der Frage und zeigt dort den Hinweis (AC-8)', async () => {
    start()
    await clickAndSettle(screen.getByRole('button', { name: 'Weiter' }))
    expect(screen.getByRole('alert')).toHaveTextContent(MESSAGES.goal)
    expect(saveOnboardingAnswer).not.toHaveBeenCalled()
    expect(screen.getByText('Frage 1 von 4')).toBeInTheDocument()
  })

  it('speichert jede Antwort sofort und geht zur nächsten Frage (AC-3, EC-1)', async () => {
    start()
    await clickAndSettle(screen.getByRole('radio', { name: 'Kräftiger werden' }))
    await clickAndSettle(screen.getByRole('button', { name: 'Weiter' }))
    expect(saveOnboardingAnswer).toHaveBeenCalledWith({ question: 'goal', value: 'strength' })
    expect(screen.getByRole('heading', { level: 1, name: 'Wie viel bewegst du dich bisher?' })).toBeInTheDocument()
    expect(screen.getByText('Frage 2 von 4')).toBeInTheDocument()
  })

  it('behält Antworten beim Zurückgehen (AC-2)', async () => {
    start()
    await clickAndSettle(screen.getByRole('radio', { name: 'Besser essen' }))
    await clickAndSettle(screen.getByRole('button', { name: 'Weiter' }))
    await clickAndSettle(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByRole('radio', { name: 'Besser essen' })).toBeChecked()
  })

  it('fragt die Ausstattung nur mit „Zuhause“ und zählt dann fünf Fragen (AC-6)', async () => {
    start({ ...EMPTY_ANSWERS, goal: 'fitness', experience: 'beginner' }, 'places')
    expect(screen.getByText('Frage 3 von 4')).toBeInTheDocument()
    await clickAndSettle(screen.getByRole('checkbox', { name: 'Zuhause' }))
    expect(screen.getByText('Frage 3 von 5')).toBeInTheDocument()
    await clickAndSettle(screen.getByRole('button', { name: 'Weiter' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Was hast du zuhause?' })).toBeInTheDocument()
    await clickAndSettle(screen.getByRole('checkbox', { name: 'Matte' }))
    await clickAndSettle(screen.getByRole('checkbox', { name: 'Nichts davon' }))
    expect(screen.getByRole('checkbox', { name: 'Matte' })).not.toBeChecked()
  })

  it('zeigt nach der letzten Antwort eine Bestätigung und öffnet „Heute“ (AC-9)', async () => {
    vi.useFakeTimers()
    try {
      start({ goal: 'fitness', experience: 'beginner', places: ['gym'], homeEquipment: null, diet: null }, 'diet')
      expect(screen.getByRole('button', { name: 'Fertig' })).toBeInTheDocument()
      await clickAndSettle(screen.getByRole('radio', { name: 'Vegan' }))
      await clickAndSettle(screen.getByRole('button', { name: 'Fertig' }))
      expect(screen.getByRole('status')).toHaveTextContent('Danke, das reicht schon.')
      expect(push).not.toHaveBeenCalled()
      await act(async () => {
        vi.advanceTimersByTime(CONFIRMATION_MS)
      })
      expect(push).toHaveBeenCalledWith('/heute')
    } finally {
      vi.useRealTimers()
    }
  })

  it('zeigt „Erneut versuchen“, behält die Auswahl und versucht es erneut (AC-17)', async () => {
    saveOnboardingAnswer.mockResolvedValueOnce({ ok: false, message: 'Deine Antwort konnte gerade nicht gespeichert werden.' })
    start()
    await clickAndSettle(screen.getByRole('radio', { name: 'Mich mehr bewegen' }))
    await clickAndSettle(screen.getByRole('button', { name: 'Weiter' }))
    expect(screen.getByRole('alert')).toHaveTextContent('nicht gespeichert')
    expect(screen.getByRole('radio', { name: 'Mich mehr bewegen' })).toBeChecked()
    await clickAndSettle(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(saveOnboardingAnswer).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Frage 2 von 4')).toBeInTheDocument()
  })

  it('sperrt die Knöpfe, solange gespeichert wird (EC-3)', async () => {
    let finish: (value: unknown) => void = () => {}
    saveOnboardingAnswer.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    start()
    await clickAndSettle(screen.getByRole('radio', { name: 'Mich mehr bewegen' }))
    await clickAndSettle(screen.getByRole('button', { name: 'Weiter' }))
    expect(screen.getByRole('button', { name: 'Wird gespeichert …' })).toBeDisabled()
    await clickAndSettle(screen.getByRole('button', { name: 'Wird gespeichert …' }))
    expect(saveOnboardingAnswer).toHaveBeenCalledTimes(1)
    await act(async () => finish({ ok: true, answers: { ...EMPTY_ANSWERS, goal: 'move_more' }, complete: false }))
  })
})
