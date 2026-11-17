export {}

vi.mock('server-only', () => ({}))

const serverAuth = { getUser: vi.fn() }
const profileQuery = { maybeSingle: vi.fn() }
const from = vi.fn(() => ({ select: () => ({ eq: () => profileQuery }) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: serverAuth, from }),
}))

const getOwnTodayExport = vi.fn()
vi.mock('@/features/today/today.data', () => ({ getOwnTodayExport }))

const getOwnFeedbackExport = vi.fn()
vi.mock('@/features/feedback/feedback.data', () => ({ getOwnFeedbackExport }))

const deleteUser = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ auth: { admin: { deleteUser } } }),
}))

const statelessAuth = { signInWithPassword: vi.fn(), signOut: vi.fn() }
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: statelessAuth }),
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`)
  },
}))

const data = await import('./account.data')

const user = {
  id: 'u1',
  email: 'a@b.de',
  created_at: '2026-11-01T00:00:00Z',
  last_sign_in_at: '2026-11-10T00:00:00Z',
  app_metadata: { provider: 'email' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireUser', () => {
  it('returns the confirmed user', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    await expect(data.requireUser()).resolves.toEqual({
      id: 'u1',
      email: 'a@b.de',
      created_at: '2026-11-01T00:00:00Z',
      last_sign_in_at: '2026-11-10T00:00:00Z',
    })
  })

  it('redirects to the login when the auth server rejects the session (AC-1, AC-12)', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user: null }, error: { code: 'session_not_found', status: 403 } })
    await expect(data.requireUser()).rejects.toThrow('REDIRECT:/anmelden')
  })
})

describe('collectAccountExport (AC-15)', () => {
  beforeEach(() => {
    getOwnTodayExport.mockResolvedValue({ checkIns: [], actions: [] })
    getOwnFeedbackExport.mockResolvedValue([])
  })

  it('combines account and own profile', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({
      data: { age_band_at_signup: '12_15', created_at: 'c', updated_at: 'u', goal: 'strength', experience: 'regular', places: ['outdoors'], home_equipment: null, diet: 'omnivore' },
      error: null,
    })
    const result = await data.collectAccountExport(new Date('2026-11-11T00:00:00Z'))
    expect(from).toHaveBeenCalledWith('profiles')
    expect(result?.account.id).toBe('u1')
    expect(result?.profile).toEqual({
      ageBandAtSignup: '12_15',
      goal: 'strength',
      experience: 'regular',
      places: ['outdoors'],
      homeEquipment: null,
      diet: 'omnivore',
      createdAt: 'c',
      updatedAt: 'u',
    })
    expect(JSON.stringify(result)).not.toContain('provider')
  })

  it('adds the own check-ins and actions (AC-18 of PROJ-6)', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    getOwnTodayExport.mockResolvedValue({
      checkIns: [
        { id: 'ci1', kind: 'eat', minutes: null, energy: null, place: null, effort: 'quick', suggested_ids: ['m1'], created_at: 't1' },
      ],
      actions: [
        { id: 'a1', check_in_id: 'ci1', kind: 'eat', workout_id: null, meal_id: 'm1', status: 'started', started_at: 't2', concluded_at: null, updated_at: 't2' },
      ],
    })
    const result = await data.collectAccountExport()
    expect(getOwnTodayExport).toHaveBeenCalledWith('u1')
    expect(result?.dailyDecisions.checkIns).toEqual([expect.objectContaining({ id: 'ci1', effort: 'quick', suggestedIds: ['m1'] })])
    expect(result?.dailyDecisions.actions).toEqual([expect.objectContaining({ id: 'a1', mealId: 'm1', status: 'started' })])
  })

  it('refuses to produce a partial export when the daily decisions cannot be read', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    getOwnTodayExport.mockRejectedValue(new Error('Daily decisions could not be read (08006).'))
    await expect(data.collectAccountExport()).rejects.toThrow('Daily decisions could not be read')
  })

  it('adds the own feedback (AC-17 of PROJ-7)', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    getOwnFeedbackExport.mockResolvedValue([
      { action_id: 'a1', effort: null, effort_at: null, suggest_again: 'no', suggest_again_at: 't1', created_at: 't1', updated_at: 't1' },
    ])
    const result = await data.collectAccountExport()
    expect(getOwnFeedbackExport).toHaveBeenCalledWith('u1')
    expect(result?.feedback).toEqual([expect.objectContaining({ actionId: 'a1', suggestAgain: 'no', effort: null })])
  })

  it('refuses to produce a partial export when the feedback cannot be read', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    getOwnFeedbackExport.mockRejectedValue(new Error('Feedback could not be read (08006).'))
    await expect(data.collectAccountExport()).rejects.toThrow('Feedback could not be read')
  })

  it('returns null without a session', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(data.collectAccountExport()).resolves.toBeNull()
  })

  it('refuses to produce a partial export when the profile cannot be read', async () => {
    serverAuth.getUser.mockResolvedValue({ data: { user }, error: null })
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: { code: '42501' } })
    await expect(data.collectAccountExport()).rejects.toThrow('Profile could not be read')
  })
})

describe('verifyCurrentPassword', () => {
  it('confirms a correct password and ends the helper session', async () => {
    statelessAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    await expect(data.verifyCurrentPassword('a@b.de', 'richtig')).resolves.toEqual({ ok: true })
    expect(statelessAuth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('reports a wrong password without touching any session', async () => {
    statelessAuth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', status: 400 } })
    await expect(data.verifyCurrentPassword('a@b.de', 'falsch')).resolves.toEqual({ ok: false, reason: 'wrong' })
    expect(statelessAuth.signOut).not.toHaveBeenCalled()
  })

  it('distinguishes an outage from a wrong password', async () => {
    statelessAuth.signInWithPassword.mockResolvedValue({ data: {}, error: { status: 503 } })
    await expect(data.verifyCurrentPassword('a@b.de', 'x')).resolves.toEqual({ ok: false, reason: 'unavailable' })
  })
})

describe('deleteAccount (AC-16)', () => {
  it('deletes the auth account of exactly this user', async () => {
    deleteUser.mockResolvedValue({ data: {}, error: null })
    await data.deleteAccount('u1')
    expect(deleteUser).toHaveBeenCalledWith('u1')
  })

  it('throws when the deletion failed, so it is never reported as success', async () => {
    deleteUser.mockResolvedValue({ data: null, error: { status: 500, code: 'unexpected_failure' } })
    await expect(data.deleteAccount('u1')).rejects.toThrow('Account deletion failed')
  })
})
