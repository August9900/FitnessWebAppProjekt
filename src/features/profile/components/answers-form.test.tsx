import { act, render, screen } from '@testing-library/react'
import type { ProfileAnswers } from '../profile.rules'
import { MESSAGES } from '../profile.schema'

const updateProfileAnswers = vi.fn()
vi.mock('../profile.actions', () => ({ updateProfileAnswers }))

const { AnswersForm } = await import('./answers-form')

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const answers: ProfileAnswers = {
  goal: 'fitness',
  experience: 'occasional',
  places: ['home', 'gym'],
  homeEquipment: ['dumbbells'],
  diet: 'vegetarian',
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  updateProfileAnswers.mockResolvedValue({ ok: true, message: 'Gespeichert.' })
})

describe('AnswersForm', () => {
  it('zeigt alle Angaben vorausgewählt (AC-12)', () => {
    render(<AnswersForm initialAnswers={answers} />)
    expect(screen.getByRole('radio', { name: 'Fitter und ausdauernder werden' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Ich bewege mich ab und zu' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Zuhause' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Fitnessstudio' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Kurzhanteln' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Vegetarisch' })).toBeChecked()
  })

  it('speichert Änderungen in einem Schritt und bestätigt sie (AC-13)', async () => {
    render(<AnswersForm initialAnswers={answers} />)
    await click(screen.getByRole('radio', { name: 'Kräftiger werden' }))
    await click(screen.getByRole('button', { name: 'Angaben speichern' }))
    expect(updateProfileAnswers).toHaveBeenCalledTimes(1)
    expect(updateProfileAnswers).toHaveBeenCalledWith({ ...answers, goal: 'strength' })
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert.')
  })

  it('blendet die Ausstattung ohne „Zuhause“ aus und speichert sie leer (AC-14)', async () => {
    render(<AnswersForm initialAnswers={answers} />)
    await click(screen.getByRole('checkbox', { name: 'Zuhause' }))
    expect(screen.queryByRole('group', { name: 'Was hast du zuhause?' })).toBeNull()
    await click(screen.getByRole('button', { name: 'Angaben speichern' }))
    expect(updateProfileAnswers).toHaveBeenCalledWith({ ...answers, places: ['gym'], homeEquipment: null })
  })

  it('verlangt die Ausstattung, wenn „Zuhause“ wieder gewählt wird (AC-14)', async () => {
    render(<AnswersForm initialAnswers={{ ...answers, places: ['gym'], homeEquipment: null }} />)
    await click(screen.getByRole('checkbox', { name: 'Zuhause' }))
    await click(screen.getByRole('button', { name: 'Angaben speichern' }))
    expect(updateProfileAnswers).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(MESSAGES.homeEquipment)
  })

  it('zeigt bei Speicherfehlern „Erneut versuchen“ und behält die Auswahl (AC-17)', async () => {
    updateProfileAnswers.mockResolvedValueOnce({ ok: false, message: 'Deine Angaben konnten gerade nicht gespeichert werden.' })
    render(<AnswersForm initialAnswers={answers} />)
    await click(screen.getByRole('radio', { name: 'Vegan' }))
    await click(screen.getByRole('button', { name: 'Angaben speichern' }))
    expect(screen.getByRole('alert')).toHaveTextContent('nicht gespeichert')
    expect(screen.getByRole('radio', { name: 'Vegan' })).toBeChecked()
    await click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(updateProfileAnswers).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert.')
  })
})
