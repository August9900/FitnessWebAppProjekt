export {}

const requireUser = vi.fn()
vi.mock('@/features/account/account.data', () => ({ requireUser }))

const createCustomWorkout = vi.fn()
const replaceCustomWorkout = vi.fn()
const deleteOwn = vi.fn()
vi.mock('./custom-workouts.data', () => ({ createCustomWorkout, replaceCustomWorkout, deleteCustomWorkout: deleteOwn }))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath }))

const { saveCustomWorkout, deleteCustomWorkout } = await import('./custom-workouts.actions')

const ID = '55555555-5555-4555-8555-555555555555'
const input = { id: ID, name: '  Mein Mix ', steps: [{ exerciseId: 'kniebeuge', mode: 'time', amount: 30 }] }
const parsed = { id: ID, name: 'Mein Mix', steps: [{ exerciseId: 'kniebeuge', mode: 'time', amount: 30 }] }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  requireUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null })
  createCustomWorkout.mockResolvedValue('saved')
  replaceCustomWorkout.mockResolvedValue('saved')
  deleteOwn.mockResolvedValue(undefined)
})

describe('saveCustomWorkout (AC-5, AC-6, AC-9, AC-11, EC-2 bis EC-5)', () => {
  it('verlangt eine Sitzung, bevor etwas gespeichert wird', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(saveCustomWorkout(input, 'create')).rejects.toThrow('REDIRECT')
    expect(createCustomWorkout).not.toHaveBeenCalled()
  })

  it('legt ein neues Workout für die eigene Person an und aktualisiert „Bewegung“', async () => {
    expect(await saveCustomWorkout(input, 'create')).toEqual({ ok: true, id: ID })
    expect(createCustomWorkout).toHaveBeenCalledWith('u1', parsed)
    expect(replaceCustomWorkout).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/bewegung')
  })

  it('ersetzt ein bestehendes Workout als Ganzes', async () => {
    expect(await saveCustomWorkout(input, 'replace')).toEqual({ ok: true, id: ID })
    expect(replaceCustomWorkout).toHaveBeenCalledWith('u1', parsed)
  })

  it('liefert Feldhinweise für ungültige Eingaben, ohne zu speichern (AC-6)', async () => {
    const result = await saveCustomWorkout({ ...input, name: 'X', steps: [] }, 'create')
    expect(result).toEqual({
      ok: false,
      reason: 'invalid',
      fieldErrors: { name: 'Gib einen Namen mit 2 bis 40 Zeichen ein.', steps: 'Füg mindestens eine Übung hinzu.' },
    })
    expect(await saveCustomWorkout(input, 'delete' as never)).toMatchObject({ ok: false, reason: 'invalid' })
    expect(createCustomWorkout).not.toHaveBeenCalled()
  })

  it('meldet „gibt es nicht mehr“, die Grenze und unbekannte Übungen (EC-2, AC-11)', async () => {
    replaceCustomWorkout.mockResolvedValue('gone')
    expect(await saveCustomWorkout(input, 'replace')).toEqual({ ok: false, reason: 'gone' })
    createCustomWorkout.mockResolvedValue('limit')
    expect(await saveCustomWorkout(input, 'create')).toEqual({ ok: false, reason: 'limit' })
    createCustomWorkout.mockResolvedValue('unknown_exercise')
    expect(await saveCustomWorkout(input, 'create')).toEqual({
      ok: false,
      reason: 'invalid',
      fieldErrors: { steps: 'Eine Übung gibt es nicht mehr. Bitte entferne sie.' },
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('meldet „fehlgeschlagen“ und protokolliert ohne Name, Folge oder Nutzer-ID (EC-5)', async () => {
    createCustomWorkout.mockRejectedValue(new Error('Own workout could not be saved (08006).'))
    expect(await saveCustomWorkout(input, 'create')).toEqual({ ok: false, reason: 'failed' })
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain('saveCustomWorkout')
    expect(logged).not.toMatch(/Mein Mix|kniebeuge|u1/)
  })
})

describe('deleteCustomWorkout (AC-10, EC-4, EC-5)', () => {
  it('löscht das eigene Workout und aktualisiert „Bewegung“', async () => {
    expect(await deleteCustomWorkout({ id: ID })).toEqual({ ok: true })
    expect(deleteOwn).toHaveBeenCalledWith('u1', ID)
    expect(revalidatePath).toHaveBeenCalledWith('/bewegung')
  })

  it('lehnt ungültige Eingaben ab und meldet Fehler', async () => {
    expect(await deleteCustomWorkout({ id: 'x' })).toEqual({ ok: false, reason: 'invalid' })
    expect(deleteOwn).not.toHaveBeenCalled()
    deleteOwn.mockRejectedValue(new Error('Own workout could not be deleted (08006).'))
    expect(await deleteCustomWorkout({ id: ID })).toEqual({ ok: false, reason: 'failed' })
  })

  it('verlangt eine Sitzung', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(deleteCustomWorkout({ id: ID })).rejects.toThrow('REDIRECT')
  })
})
