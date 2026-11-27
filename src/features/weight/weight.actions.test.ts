export {}

const requireUser = vi.fn()
vi.mock('@/features/account/account.data', () => ({ requireUser }))

const getWeightAccess = vi.fn()
const saveOwnWeightEntry = vi.fn()
const deleteOwnWeightEntry = vi.fn()
const deleteAllOwnWeightEntries = vi.fn()
const setOwnWeightVisibility = vi.fn()
vi.mock('./weight.data', () => ({
  getWeightAccess,
  saveOwnWeightEntry,
  deleteOwnWeightEntry,
  deleteAllOwnWeightEntries,
  setOwnWeightVisibility,
}))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath }))

let timeZoneCookie: string | undefined = 'Europe/Berlin'
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (timeZoneCookie ? { value: timeZoneCookie } : undefined) }),
}))

const actions = await import('./weight.actions')

const VISIBLE = { ageBand: '16_plus', showWeightInNav: true }

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  timeZoneCookie = 'Europe/Berlin'
  requireUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null })
  getWeightAccess.mockResolvedValue(VISIBLE)
  saveOwnWeightEntry.mockResolvedValue({ status: 'saved' })
  deleteOwnWeightEntry.mockResolvedValue(undefined)
  deleteAllOwnWeightEntries.mockResolvedValue(undefined)
  setOwnWeightVisibility.mockResolvedValue(undefined)
})

describe('saveWeightEntry (AC-4 bis AC-6, AC-11, EC-2 bis EC-5)', () => {
  it('verlangt eine Sitzung, bevor etwas gespeichert wird', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(actions.saveWeightEntry({ date: '2026-11-20', weight: '72' })).rejects.toThrow('REDIRECT')
    expect(saveOwnWeightEntry).not.toHaveBeenCalled()
  })

  it('speichert einen gültigen Eintrag und aktualisiert den Verlauf', async () => {
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72,4' })).toEqual({ ok: true })
    expect(saveOwnWeightEntry).toHaveBeenCalledWith({ date: '2026-11-20', weightKg: 72.4, previousDate: null, replace: false })
    expect(revalidatePath).toHaveBeenCalledWith('/gewicht')
  })

  it.each([
    ['unter 16', { ageBand: '12_15', showWeightInNav: true }],
    ['ausgeblendet', { ageBand: '16_plus', showWeightInNav: false }],
    ['ohne Profil', null],
  ])('lehnt ab, wenn der Bereich nicht verfügbar ist (%s) — ohne Hinweis auf das Alter (AC-2, AC-14)', async (_name, access) => {
    getWeightAccess.mockResolvedValue(access)
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72' })).toEqual({ ok: false, reason: 'denied' })
    expect(saveOwnWeightEntry).not.toHaveBeenCalled()
  })

  it('liefert Feldhinweise für ungültige Eingaben, ohne zu speichern (AC-5)', async () => {
    const result = await actions.saveWeightEntry({ date: '', weight: '72,45' })
    expect(result).toMatchObject({ ok: false, reason: 'invalid', fieldErrors: { date: expect.any(String), weight: expect.any(String) } })
    expect(saveOwnWeightEntry).not.toHaveBeenCalled()
  })

  it('„heute“ richtet sich nach dem Zeitzonen-Cookie des Geräts (EC-5)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T23:30:00Z'))
    timeZoneCookie = 'Europe/Berlin'
    expect(await actions.saveWeightEntry({ date: '2026-11-26', weight: '72' })).toEqual({ ok: true })
    timeZoneCookie = 'America/New_York'
    expect(await actions.saveWeightEntry({ date: '2026-11-26', weight: '72' })).toMatchObject({ ok: false, reason: 'invalid' })
  })

  it('meldet einen vorhandenen Eintrag mit Wert, statt ihn zu überschreiben (AC-6)', async () => {
    saveOwnWeightEntry.mockResolvedValue({ status: 'exists', weightKg: 71.5 })
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72' })).toEqual({ ok: false, reason: 'exists', weightKg: 71.5 })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('reicht Ändern und Ersetzen weiter (AC-6, AC-11)', async () => {
    await actions.saveWeightEntry({ date: '2026-11-19', weight: '71', previousDate: '2026-11-20', replace: true })
    expect(saveOwnWeightEntry).toHaveBeenCalledWith({ date: '2026-11-19', weightKg: 71, previousDate: '2026-11-20', replace: true })
  })

  it('meldet „gibt es nicht mehr“ und aktualisiert den Verlauf (EC-3)', async () => {
    saveOwnWeightEntry.mockResolvedValue({ status: 'gone' })
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72', previousDate: '2026-11-21' })).toEqual({ ok: false, reason: 'gone' })
    expect(revalidatePath).toHaveBeenCalledWith('/gewicht')
  })

  it('ein von der Datenbank abgelehnter Wert ist ungültig', async () => {
    saveOwnWeightEntry.mockResolvedValue({ status: 'invalid' })
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72' })).toEqual({ ok: false, reason: 'invalid', fieldErrors: {} })
  })

  it('meldet Fehler ohne Gewicht oder Datum im Protokoll (EC-4)', async () => {
    saveOwnWeightEntry.mockRejectedValue(new Error('Weight entry could not be saved (08006).'))
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72,4' })).toEqual({ ok: false, reason: 'failed' })
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain('08006')
    expect(logged).not.toContain('72')
    expect(logged).not.toContain('2026-11-20')
  })

  it('auch ein Fehler beim Lesen des Zugangs ist ein Fehler, keine Freigabe', async () => {
    getWeightAccess.mockRejectedValue(new Error('Weight access could not be read (08006).'))
    expect(await actions.saveWeightEntry({ date: '2026-11-20', weight: '72' })).toEqual({ ok: false, reason: 'failed' })
    expect(saveOwnWeightEntry).not.toHaveBeenCalled()
  })
})

describe('deleteWeightEntry und deleteAllWeightEntries (AC-12, AC-13, EC-2, EC-4)', () => {
  it('löscht einen eigenen Eintrag nach Datum', async () => {
    expect(await actions.deleteWeightEntry({ date: '2026-11-20' })).toEqual({ ok: true })
    expect(deleteOwnWeightEntry).toHaveBeenCalledWith('u1', '2026-11-20')
    expect(revalidatePath).toHaveBeenCalledWith('/gewicht')
  })

  it('lehnt ungültige Daten ab', async () => {
    expect(await actions.deleteWeightEntry({ date: '20.11.2026' })).toEqual({ ok: false, reason: 'invalid' })
    expect(await actions.deleteWeightEntry(null)).toEqual({ ok: false, reason: 'invalid' })
    expect(deleteOwnWeightEntry).not.toHaveBeenCalled()
  })

  it('löscht alle eigenen Einträge', async () => {
    expect(await actions.deleteAllWeightEntries()).toEqual({ ok: true })
    expect(deleteAllOwnWeightEntries).toHaveBeenCalledWith('u1')
  })

  it('lehnt beides ab, wenn der Bereich nicht verfügbar ist (AC-2)', async () => {
    getWeightAccess.mockResolvedValue({ ageBand: '12_15', showWeightInNav: true })
    expect(await actions.deleteWeightEntry({ date: '2026-11-20' })).toEqual({ ok: false, reason: 'denied' })
    expect(await actions.deleteAllWeightEntries()).toEqual({ ok: false, reason: 'denied' })
    expect(deleteOwnWeightEntry).not.toHaveBeenCalled()
    expect(deleteAllOwnWeightEntries).not.toHaveBeenCalled()
  })

  it('meldet Fehler', async () => {
    deleteOwnWeightEntry.mockRejectedValue(new Error('x (08006).'))
    deleteAllOwnWeightEntries.mockRejectedValue(new Error('x (08006).'))
    expect(await actions.deleteWeightEntry({ date: '2026-11-20' })).toEqual({ ok: false, reason: 'failed' })
    expect(await actions.deleteAllWeightEntries()).toEqual({ ok: false, reason: 'failed' })
  })
})

describe('setWeightVisibility (AC-14)', () => {
  it('blendet aus und aktualisiert alle Seiten mit Navigation', async () => {
    expect(await actions.setWeightVisibility({ show: false })).toEqual({ ok: true })
    expect(setOwnWeightVisibility).toHaveBeenCalledWith('u1', false)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('auch bei ausgeblendetem Bereich lässt er sich wieder einschalten', async () => {
    getWeightAccess.mockResolvedValue({ ageBand: '16_plus', showWeightInNav: false })
    expect(await actions.setWeightVisibility({ show: true })).toEqual({ ok: true })
  })

  it('gibt es für 12–15 nicht (AC-2) und verlangt einen Wahrheitswert', async () => {
    getWeightAccess.mockResolvedValue({ ageBand: '12_15', showWeightInNav: true })
    expect(await actions.setWeightVisibility({ show: false })).toEqual({ ok: false, reason: 'denied' })
    expect(await actions.setWeightVisibility({ show: 'nein' })).toEqual({ ok: false, reason: 'invalid' })
    expect(setOwnWeightVisibility).not.toHaveBeenCalled()
  })

  it('meldet Fehler', async () => {
    setOwnWeightVisibility.mockRejectedValue(new Error('x (08006).'))
    expect(await actions.setWeightVisibility({ show: false })).toEqual({ ok: false, reason: 'failed' })
  })
})
