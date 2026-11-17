import type { Meal } from '@/features/meals/meals.rules'
import type { ProfileAnswers } from '@/features/profile/profile.rules'
import type { Workout } from '@/features/workouts/workouts.rules'

const requireUser = vi.fn()
vi.mock('@/features/account/account.data', () => ({ requireUser }))

const getOwnAnswers = vi.fn()
vi.mock('@/features/profile/profile.data', () => ({ getOwnAnswers }))

const getOfferedWorkouts = vi.fn()
const getWorkout = vi.fn()
vi.mock('@/features/workouts/workouts.data', () => ({ getOfferedWorkouts, getWorkout }))

const getOfferedMeals = vi.fn()
const getMeal = vi.fn()
vi.mock('@/features/meals/meals.data', () => ({ getOfferedMeals, getMeal }))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath }))

class ActionRejectedError extends Error {}
const createCheckIn = vi.fn()
const getOwnCheckIn = vi.fn()
const getRecentlyStartedIds = vi.fn()
const startOwnAction = vi.fn()
const concludeOwnAction = vi.fn()
const undoOwnConclusion = vi.fn()
vi.mock('./today.data', () => ({
  ActionRejectedError,
  createCheckIn,
  getOwnCheckIn,
  getRecentlyStartedIds,
  startAction: startOwnAction,
  concludeAction: concludeOwnAction,
  undoConclusion: undoOwnConclusion,
}))

const { requestSuggestion, startAction, concludeAction, undoConclusion } = await import('./today.actions')

const CHECK_IN_ID = '11111111-1111-4111-8111-111111111111'
const ACTION_ID = '33333333-3333-4333-8333-333333333333'

const profile: ProfileAnswers = {
  goal: 'fitness',
  experience: 'occasional',
  places: ['home', 'outdoors'],
  homeEquipment: ['mat'],
  diet: 'vegetarian',
}

const step = { position: 1, mode: 'time' as const, amount: 60 }
const exercise = { id: 'ex', name: 'Übung', instructions: '…', easierName: 'leichter', easierInstructions: '…' }
const workout = (id: string, overrides: Partial<Workout> = {}): Workout => ({
  id,
  title: `Workout ${id}`,
  description: '',
  durationMinutes: 10,
  intensity: 'gentle',
  places: ['home', 'outdoors'],
  reviewStatus: 'unreviewed',
  steps: [{ ...step, exercise: { ...exercise, equipment: [] } }],
  ...overrides,
})

const meal = (id: string, overrides: Partial<Meal> = {}): Meal => ({
  id,
  title: `Mahlzeit ${id}`,
  diet: 'vegan',
  effort: 'quick',
  minutes: 10,
  ingredients: ['x'],
  steps: ['y'],
  easierHint: 'z',
  allergens: [],
  reviewStatus: 'reviewed',
  ...overrides,
})

const moveInput = { kind: 'move', minutes: 10, energy: 'low', place: 'home' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  requireUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null })
  getOwnAnswers.mockResolvedValue(profile)
  getRecentlyStartedIds.mockResolvedValue([])
  createCheckIn.mockImplementation(async (_user, answers, suggestedIds) => ({
    id: CHECK_IN_ID,
    answers,
    suggestedIds,
    createdAt: new Date(),
  }))
})

describe('Sitzung (AC-17)', () => {
  it('verlangt bei jeder Action eine Sitzung, bevor etwas gelesen oder gespeichert wird', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(requestSuggestion(moveInput)).rejects.toThrow('REDIRECT:/anmelden')
    await expect(startAction({ checkInId: CHECK_IN_ID, itemId: 'w_one' })).rejects.toThrow('REDIRECT')
    await expect(concludeAction({ actionId: ACTION_ID, status: 'done' })).rejects.toThrow('REDIRECT')
    await expect(undoConclusion({ actionId: ACTION_ID })).rejects.toThrow('REDIRECT')
    expect(getOwnAnswers).not.toHaveBeenCalled()
    expect(createCheckIn).not.toHaveBeenCalled()
    expect(getOwnCheckIn).not.toHaveBeenCalled()
    expect(concludeOwnAction).not.toHaveBeenCalled()
    expect(undoOwnConclusion).not.toHaveBeenCalled()
  })
})

describe('requestSuggestion (AC-7 bis AC-11, EC-1, EC-9)', () => {
  it('wählt passende Workouts, speichert Check-in samt Rangfolge und liefert den Vorschlag', async () => {
    getOfferedWorkouts.mockResolvedValue([
      workout('w_short', { durationMinutes: 5 }),
      workout('w_exact'),
      workout('w_too_long', { durationMinutes: 15 }),
      workout('w_gym', { places: ['gym'] }),
    ])
    getRecentlyStartedIds.mockResolvedValue([])

    const result = await requestSuggestion(moveInput)

    expect(getRecentlyStartedIds).toHaveBeenCalledWith('u1', 'move', expect.any(Date))
    expect(createCheckIn).toHaveBeenCalledWith('u1', moveInput, ['w_exact', 'w_short'])
    expect(result).toEqual({
      ok: true,
      checkInId: CHECK_IN_ID,
      kind: 'move',
      fitsLine: 'Passt zu: 10 Min · wenig Energie · Zuhause',
      items: [
        { id: 'w_exact', title: 'Workout w_exact', detail: '10 Min', isSample: true, href: '/bewegung/w_exact' },
        { id: 'w_short', title: 'Workout w_short', detail: '5 Min', isSample: true, href: '/bewegung/w_short' },
      ],
    })
    expect(revalidatePath).toHaveBeenCalledWith('/heute')
  })

  it('wählt bei „Essen“ passende Mahlzeiten zur Essensweise und zum Aufwand', async () => {
    getOfferedMeals.mockResolvedValue([
      meal('m_meat', { diet: 'meat_fish' }),
      meal('m_no_cook', { effort: 'no_cook' }),
      meal('m_quick'),
    ])

    const result = await requestSuggestion({ kind: 'eat', effort: 'quick' })

    expect(getRecentlyStartedIds).toHaveBeenCalledWith('u1', 'eat', expect.any(Date))
    expect(createCheckIn).toHaveBeenCalledWith('u1', { kind: 'eat', effort: 'quick' }, ['m_quick', 'm_no_cook'])
    expect(result).toMatchObject({
      ok: true,
      kind: 'eat',
      fitsLine: 'Passt zu: Kurz kochen',
      items: [
        { id: 'm_quick', detail: 'Schnell gekocht', isSample: false, href: '/essen/m_quick' },
        { id: 'm_no_cook', detail: 'Ohne Kochen' },
      ],
    })
  })

  it('reicht kürzlich begonnene Inhalte an die Regel weiter (AC-7)', async () => {
    getOfferedWorkouts.mockResolvedValue([workout('w_a'), workout('w_b')])
    getRecentlyStartedIds.mockResolvedValue(['w_a'])
    const result = await requestSuggestion(moveInput)
    expect(result.ok && result.items.map((item) => item.id)).toEqual(['w_b', 'w_a'])
  })

  it('speichert den Check-in auch ohne passenden Inhalt und liefert einen leeren Vorschlag (EC-1)', async () => {
    getOfferedWorkouts.mockResolvedValue([])
    const result = await requestSuggestion(moveInput)
    expect(createCheckIn).toHaveBeenCalledWith('u1', moveInput, [])
    expect(result).toMatchObject({ ok: true, items: [] })
  })

  it('lehnt ungültige Antworten ab, ohne zu speichern', async () => {
    for (const input of [
      { kind: 'move', minutes: 7, energy: 'low', place: 'home' },
      { kind: 'eat', effort: 'quick', note: 'x' },
      { kind: 'sleep' },
      null,
    ]) {
      expect(await requestSuggestion(input)).toEqual({ ok: false, reason: 'invalid' })
    }
    expect(createCheckIn).not.toHaveBeenCalled()
  })

  it('lehnt einen Ort ab, der nicht im eigenen Profil steht (AC-2)', async () => {
    expect(await requestSuggestion({ ...moveInput, place: 'gym' })).toEqual({ ok: false, reason: 'invalid' })
    expect(createCheckIn).not.toHaveBeenCalled()
  })

  it('lehnt ab, solange das Profil unvollständig ist', async () => {
    getOwnAnswers.mockResolvedValue({ ...profile, diet: null })
    expect(await requestSuggestion({ kind: 'eat', effort: 'quick' })).toEqual({ ok: false, reason: 'invalid' })
    expect(createCheckIn).not.toHaveBeenCalled()
  })

  it('meldet „fehlgeschlagen“ und protokolliert ohne Antworten oder Nutzer-ID (EC-9)', async () => {
    getOfferedWorkouts.mockResolvedValue([workout('w_exact')])
    createCheckIn.mockRejectedValue(new Error('Check-in could not be saved (08006).'))

    expect(await requestSuggestion(moveInput)).toEqual({ ok: false, reason: 'failed' })
    expect(revalidatePath).not.toHaveBeenCalled()
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain('requestSuggestion')
    expect(logged).not.toMatch(/u1|home|low/)
  })
})

describe('startAction (AC-12, EC-4, EC-6)', () => {
  const ownCheckIn = {
    id: CHECK_IN_ID,
    answers: { kind: 'move', minutes: 10, energy: 'low', place: 'home' },
    suggestedIds: ['w_one', 'w_two'],
    createdAt: new Date(),
  }
  const started = (itemId: string, kind = 'move') => ({
    id: ACTION_ID,
    checkInId: CHECK_IN_ID,
    kind,
    itemId,
    status: 'started',
    startedAt: new Date(),
    concludedAt: null,
  })

  beforeEach(() => {
    getOwnCheckIn.mockResolvedValue(ownCheckIn)
    getWorkout.mockResolvedValue(workout('w_two'))
  })

  it('beginnt genau den gewählten Inhalt und führt zur geführten Durchführung ohne „leichter“', async () => {
    startOwnAction.mockResolvedValue(started('w_two'))
    const result = await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_two' })

    expect(getOwnCheckIn).toHaveBeenCalledWith('u1', CHECK_IN_ID)
    expect(getWorkout).toHaveBeenCalledWith('w_two')
    expect(startOwnAction).toHaveBeenCalledWith('u1', ownCheckIn, 'w_two')
    expect(result).toEqual({ ok: true, href: '/bewegung/w_two/los' })
  })

  it('führt bei einer Mahlzeit zu deren Detail', async () => {
    getOwnCheckIn.mockResolvedValue({ ...ownCheckIn, answers: { kind: 'eat', effort: 'quick' }, suggestedIds: ['m_one'] })
    getMeal.mockResolvedValue(meal('m_one'))
    startOwnAction.mockResolvedValue(started('m_one', 'eat'))

    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'm_one' })).toEqual({ ok: true, href: '/essen/m_one' })
    expect(getWorkout).not.toHaveBeenCalled()
  })

  it('führt bei einem zweiten Versuch zur bereits begonnenen Aktion (EC-4)', async () => {
    startOwnAction.mockResolvedValue(started('w_one'))
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_two' })).toEqual({
      ok: true,
      href: '/bewegung/w_one/los',
    })
  })

  it('lehnt fremde Check-ins und nicht vorgeschlagene Inhalte ab (AC-17)', async () => {
    getOwnCheckIn.mockResolvedValueOnce(null)
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_two' })).toEqual({ ok: false, reason: 'invalid' })
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_other' })).toEqual({ ok: false, reason: 'invalid' })
    expect(startOwnAction).not.toHaveBeenCalled()
  })

  it('lehnt ungültige Eingaben ab', async () => {
    expect(await startAction({ checkInId: 'nicht-uuid', itemId: 'w_two' })).toEqual({ ok: false, reason: 'invalid' })
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: '../x' })).toEqual({ ok: false, reason: 'invalid' })
    expect(getOwnCheckIn).not.toHaveBeenCalled()
  })

  it('meldet „gibt es nicht mehr“, wenn der Inhalt nicht mehr angeboten wird (EC-6)', async () => {
    getWorkout.mockResolvedValue(null)
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_two' })).toEqual({ ok: false, reason: 'gone' })
    expect(startOwnAction).not.toHaveBeenCalled()
  })

  it('meldet „gibt es nicht mehr“, wenn die Datenbank den Inhalt beim Anlegen ablehnt (EC-6)', async () => {
    startOwnAction.mockRejectedValue(new ActionRejectedError('refused'))
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_two' })).toEqual({ ok: false, reason: 'gone' })
  })

  it('meldet „fehlgeschlagen“, wenn das Speichern scheitert (EC-9)', async () => {
    startOwnAction.mockRejectedValue(new Error('Action could not be saved (08006).'))
    expect(await startAction({ checkInId: CHECK_IN_ID, itemId: 'w_two' })).toEqual({ ok: false, reason: 'failed' })
  })
})

describe('concludeAction (AC-14, EC-5)', () => {
  const action = (status: string) => ({ id: ACTION_ID, status })

  it('markiert die eigene Aktion und liefert den neuen Zustand', async () => {
    concludeOwnAction.mockResolvedValue({ changed: true, action: action('done') })
    expect(await concludeAction({ actionId: ACTION_ID, status: 'done' })).toEqual({ ok: true, changed: true, status: 'done' })
    expect(concludeOwnAction).toHaveBeenCalledWith('u1', ACTION_ID, 'done', expect.any(Date))
    expect(revalidatePath).toHaveBeenCalledWith('/heute')
  })

  it('liefert den tatsächlichen Zustand, wenn eine andere Markierung zuerst kam (EC-5)', async () => {
    concludeOwnAction.mockResolvedValue({ changed: false, action: action('done') })
    expect(await concludeAction({ actionId: ACTION_ID, status: 'skipped' })).toEqual({
      ok: true,
      changed: false,
      status: 'done',
    })
  })

  it('lehnt ungültige Zustände und fremde Aktionen ab', async () => {
    expect(await concludeAction({ actionId: ACTION_ID, status: 'started' })).toEqual({ ok: false, reason: 'invalid' })
    expect(concludeOwnAction).not.toHaveBeenCalled()
    concludeOwnAction.mockResolvedValue(null)
    expect(await concludeAction({ actionId: ACTION_ID, status: 'done' })).toEqual({ ok: false, reason: 'invalid' })
  })

  it('meldet „fehlgeschlagen“, wenn das Speichern scheitert (EC-9)', async () => {
    concludeOwnAction.mockRejectedValue(new Error('Action could not be marked (08006).'))
    expect(await concludeAction({ actionId: ACTION_ID, status: 'done' })).toEqual({ ok: false, reason: 'failed' })
  })
})

describe('undoConclusion (AC-15)', () => {
  it('setzt die eigene Markierung zurück', async () => {
    undoOwnConclusion.mockResolvedValue({ undone: true, action: { status: 'started' } })
    expect(await undoConclusion({ actionId: ACTION_ID })).toEqual({ ok: true, status: 'started' })
    expect(undoOwnConclusion).toHaveBeenCalledWith('u1', ACTION_ID)
  })

  it('meldet „nicht mehr möglich“ mit dem tatsächlichen Zustand nach einem neuen Check-in', async () => {
    undoOwnConclusion.mockResolvedValue({ undone: false, action: { status: 'done' } })
    expect(await undoConclusion({ actionId: ACTION_ID })).toEqual({ ok: false, reason: 'not_possible', status: 'done' })
  })

  it('lehnt ungültige Eingaben und fremde Aktionen ab', async () => {
    expect(await undoConclusion({ actionId: 'x' })).toEqual({ ok: false, reason: 'invalid' })
    expect(undoOwnConclusion).not.toHaveBeenCalled()
    undoOwnConclusion.mockResolvedValue(null)
    expect(await undoConclusion({ actionId: ACTION_ID })).toEqual({ ok: false, reason: 'invalid' })
  })

  it('meldet „fehlgeschlagen“, wenn das Speichern scheitert (EC-9)', async () => {
    undoOwnConclusion.mockRejectedValue(new Error('Marking could not be undone (08006).'))
    expect(await undoConclusion({ actionId: ACTION_ID })).toEqual({ ok: false, reason: 'failed' })
  })
})
