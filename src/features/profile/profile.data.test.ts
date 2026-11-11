export {}

vi.mock('server-only', () => ({}))

const query = { maybeSingle: vi.fn(), select: vi.fn() }
const updateCalls: unknown[] = []
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ maybeSingle: query.maybeSingle }) }),
  update: (values: unknown) => {
    updateCalls.push(values)
    return { eq: () => ({ select: query.select }) }
  },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from }) }))

const requireUser = vi.fn()
vi.mock('@/features/account/account.data', () => ({ requireUser }))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`)
  },
}))

const data = await import('./profile.data')

const fullRow = {
  goal: 'fitness',
  experience: 'beginner',
  places: ['home'],
  home_equipment: ['none'],
  diet: 'vegan',
}

beforeEach(() => {
  vi.clearAllMocks()
  updateCalls.length = 0
  requireUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null })
})

describe('getOwnAnswers', () => {
  it('liest die Angaben der Person', async () => {
    query.maybeSingle.mockResolvedValue({ data: fullRow, error: null })
    await expect(data.getOwnAnswers('u1')).resolves.toEqual({
      goal: 'fitness',
      experience: 'beginner',
      places: ['home'],
      homeEquipment: ['none'],
      diet: 'vegan',
    })
    expect(from).toHaveBeenCalledWith('profiles')
  })

  it('behandelt leere oder unerwartete Werte als unbeantwortet', async () => {
    query.maybeSingle.mockResolvedValue({ data: { ...fullRow, goal: 'abnehmen', places: null }, error: null })
    const answers = await data.getOwnAnswers('u1')
    expect(answers.goal).toBeNull()
    expect(answers.places).toBeNull()
  })

  it('wirft, statt still leere Angaben zu liefern, wenn das Lesen scheitert', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: { code: '42501' } })
    await expect(data.getOwnAnswers('u1')).rejects.toThrow('could not be read')
  })
})

describe('saveAnswers (EC-2, AC-17)', () => {
  it('schreibt alle übergebenen Angaben in einer Änderung', async () => {
    query.select.mockResolvedValue({ data: [{ user_id: 'u1' }], error: null })
    await data.saveAnswers('u1', { goal: 'strength', places: ['gym'], homeEquipment: null })
    expect(updateCalls).toEqual([{ goal: 'strength', places: ['gym'], home_equipment: null }])
  })

  it('meldet einen Fehler, wenn keine Zeile geändert wurde (z. B. fremde Zeile oder abgelaufene Sitzung)', async () => {
    query.select.mockResolvedValue({ data: [], error: null })
    await expect(data.saveAnswers('u1', { diet: 'vegan' })).rejects.toBeInstanceOf(data.ProfileSaveError)
  })

  it('meldet einen Fehler bei abgelehntem Wert', async () => {
    query.select.mockResolvedValue({ data: null, error: { code: '23514' } })
    await expect(data.saveAnswers('u1', { diet: 'vegan' })).rejects.toThrow('could not be saved')
  })
})

describe('requireCompletedProfile (AC-1, EC-6)', () => {
  it('lässt Personen mit vollständigen Angaben durch', async () => {
    query.maybeSingle.mockResolvedValue({ data: fullRow, error: null })
    await expect(data.requireCompletedProfile()).resolves.toMatchObject({ user: { id: 'u1' } })
  })

  it('führt Personen ohne vollständige Angaben zum Einstieg', async () => {
    query.maybeSingle.mockResolvedValue({ data: { ...fullRow, diet: null }, error: null })
    await expect(data.requireCompletedProfile()).rejects.toThrow('REDIRECT:/einstieg')
  })

  it('führt auch ein altes Konto ohne Angaben zum Einstieg', async () => {
    query.maybeSingle.mockResolvedValue({
      data: { goal: null, experience: null, places: null, home_equipment: null, diet: null },
      error: null,
    })
    await expect(data.requireCompletedProfile()).rejects.toThrow('REDIRECT:/einstieg')
  })
})
