import { EMPTY_ANSWERS, type ProfileAnswers } from './profile.rules'
import { MESSAGES } from './profile.schema'

const requireUser = vi.fn()
vi.mock('@/features/account/account.data', () => ({ requireUser }))

const getOwnAnswers = vi.fn()
const saveAnswers = vi.fn()
vi.mock('./profile.data', () => ({ getOwnAnswers, saveAnswers }))

const { saveOnboardingAnswer, updateProfileAnswers } = await import('./profile.actions')

const almost: ProfileAnswers = {
  goal: 'fitness',
  experience: 'occasional',
  places: ['home', 'gym'],
  homeEquipment: ['mat'],
  diet: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  requireUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null })
  saveAnswers.mockResolvedValue(undefined)
})

describe('saveOnboardingAnswer', () => {
  it('braucht eine Sitzung, bevor etwas gespeichert wird', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(saveOnboardingAnswer({ question: 'goal', value: 'fitness' })).rejects.toThrow('REDIRECT:/anmelden')
    expect(saveAnswers).not.toHaveBeenCalled()
  })

  it('speichert eine Antwort sofort für die eigene Person (EC-1)', async () => {
    getOwnAnswers.mockResolvedValue(EMPTY_ANSWERS)
    const result = await saveOnboardingAnswer({ question: 'goal', value: 'strength' })
    expect(saveAnswers).toHaveBeenCalledWith('u1', { goal: 'strength' })
    expect(result).toEqual({ ok: true, answers: { ...EMPTY_ANSWERS, goal: 'strength' }, complete: false })
  })

  it('meldet „vollständig“ nach der letzten Antwort (AC-9)', async () => {
    getOwnAnswers.mockResolvedValue(almost)
    const result = await saveOnboardingAnswer({ question: 'diet', value: 'vegetarian' })
    expect(result).toMatchObject({ ok: true, complete: true })
  })

  it('lehnt fehlende oder unbekannte Antworten mit Hinweis ab (AC-8, EC-5)', async () => {
    expect(await saveOnboardingAnswer({ question: 'goal' })).toEqual({ ok: false, fieldError: MESSAGES.goal })
    expect(await saveOnboardingAnswer({ question: 'places', value: [] })).toEqual({ ok: false, fieldError: MESSAGES.places })
    expect(await saveOnboardingAnswer({ question: 'homeEquipment', value: ['none', 'mat'] })).toEqual({
      ok: false,
      fieldError: MESSAGES.noneAlone,
    })
    expect(saveAnswers).not.toHaveBeenCalled()
  })

  it('lehnt Ausstattung ohne „Zuhause“ ab (EC-5)', async () => {
    getOwnAnswers.mockResolvedValue({ ...almost, places: ['gym'], homeEquipment: null })
    const result = await saveOnboardingAnswer({ question: 'homeEquipment', value: ['mat'] })
    expect(result).toEqual({ ok: false, fieldError: MESSAGES.equipmentWithoutHome })
    expect(saveAnswers).not.toHaveBeenCalled()
  })

  it('entfernt die Ausstattung im selben Schritt, wenn „Zuhause“ abgewählt wird (AC-14)', async () => {
    getOwnAnswers.mockResolvedValue(almost)
    await saveOnboardingAnswer({ question: 'places', value: ['outdoors'] })
    expect(saveAnswers).toHaveBeenCalledWith('u1', { places: ['outdoors'], homeEquipment: null })
  })

  it('zeigt bei Speicherfehlern eine Meldung zum erneuten Versuch (AC-17)', async () => {
    getOwnAnswers.mockResolvedValue(EMPTY_ANSWERS)
    saveAnswers.mockRejectedValue(new Error('Profile answers could not be saved (no row updated).'))
    const result = await saveOnboardingAnswer({ question: 'goal', value: 'fitness' })
    expect(result).toEqual({ ok: false, message: expect.stringContaining('Bitte versuche es erneut') })
  })
})

describe('updateProfileAnswers (AC-13, AC-14, EC-2)', () => {
  const form = { goal: 'wellbeing', experience: 'regular', places: ['home'], homeEquipment: ['kettlebell'], diet: 'vegan' }

  it('speichert alle Angaben in einer Änderung und bestätigt', async () => {
    const result = await updateProfileAnswers(form)
    expect(saveAnswers).toHaveBeenCalledTimes(1)
    expect(saveAnswers).toHaveBeenCalledWith('u1', form)
    expect(result).toEqual({ ok: true, message: 'Gespeichert.' })
  })

  it('verlangt die Ausstattung bei „Zuhause“', async () => {
    const result = await updateProfileAnswers({ ...form, homeEquipment: null })
    expect(result).toEqual({ ok: false, fieldErrors: { homeEquipment: MESSAGES.homeEquipment } })
    expect(saveAnswers).not.toHaveBeenCalled()
  })

  it('entfernt die Ausstattung ohne „Zuhause“', async () => {
    await updateProfileAnswers({ ...form, places: ['gym'] })
    expect(saveAnswers).toHaveBeenCalledWith('u1', { ...form, places: ['gym'], homeEquipment: null })
  })

  it('meldet Speicherfehler, ohne Erfolg vorzutäuschen (AC-17)', async () => {
    saveAnswers.mockRejectedValue(new Error('boom'))
    const result = await updateProfileAnswers(form)
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining('Bitte versuche es erneut') })
  })
})
