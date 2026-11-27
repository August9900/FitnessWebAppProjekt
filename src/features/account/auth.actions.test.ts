import { AUTH_MESSAGES, MIN_RESPONSE_MS } from './account.rules'
import { MESSAGES } from './account.schema'

const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
}
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth }) }))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`)
  },
}))

const actions = await import('./auth.actions')
const idle = { status: 'idle' } as const

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

/** Runs an action under fake timers so the response padding is observable without waiting. */
async function timed<T>(run: () => Promise<T>): Promise<{ result?: T; error?: Error; elapsed: number }> {
  const startedAt = Date.now()
  const promise = run().then(
    (result) => ({ result }),
    (error: Error) => ({ error })
  )
  await vi.runAllTimersAsync()
  return { ...(await promise), elapsed: Date.now() - startedAt }
}

const password = 'lange sichere passphrase'

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.useRealTimers())

describe('signUp', () => {
  it('creates the account with the age band and signs the person in (AC-2)', async () => {
    auth.signUp.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null })
    await expect(
      actions.signUp(idle, form({ email: 'Neu@Example.org', password, ageBand: '12_15' }))
    ).rejects.toThrow('REDIRECT:/heute')
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'neu@example.org',
      password,
      options: { data: { age_band: '12_15' } },
    })
  })

  it('never contacts Supabase for someone under 12 (AC-3)', async () => {
    const state = await actions.signUp(idle, form({ email: 'a@b.de', password, ageBand: 'under_12' }))
    expect(state.fieldErrors?.ageBand).toBe(MESSAGES.underAge)
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('returns field errors and keeps non-secret values only (AC-21)', async () => {
    const state = await actions.signUp(idle, form({ email: 'x', password: 'kurz', ageBand: '16_plus' }))
    expect(state.fieldErrors).toEqual({ email: MESSAGES.emailInvalid, password: MESSAGES.passwordTooShort })
    expect(state.values).toEqual({ email: 'x', ageBand: '16_plus' })
    expect(JSON.stringify(state)).not.toContain('kurz')
  })

  it('answers a taken address with the neutral signup message (EC-1, EC-4)', async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: { code: 'user_already_exists', status: 422 } })
    const state = await actions.signUp(idle, form({ email: 'a@b.de', password, ageBand: '16_plus' }))
    expect(state).toMatchObject({ status: 'error', message: AUTH_MESSAGES.signupUnavailable })
  })
})

describe('signIn', () => {
  it('gives the same message, after the same minimum time, for unknown and wrong (AC-6)', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', status: 400 } })
    const { result, elapsed } = await timed(() =>
      actions.signIn(idle, form({ email: 'a@b.de', password: 'falsch' }))
    )
    expect(result).toMatchObject({ status: 'error', message: AUTH_MESSAGES.invalidCredentials })
    expect(elapsed).toBeGreaterThanOrEqual(MIN_RESPONSE_MS)
    expect(JSON.stringify(result)).not.toContain('falsch')
  })

  it('redirects to an internal target after a successful login (AC-5)', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null })
    const { error } = await timed(() =>
      actions.signIn(idle, form({ email: 'a@b.de', password: 'richtig', weiter: '/profil' }))
    )
    expect(error?.message).toBe('REDIRECT:/profil')
  })

  it('ignores an external redirect target', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null })
    const { error } = await timed(() =>
      actions.signIn(idle, form({ email: 'a@b.de', password: 'richtig', weiter: '//evil.example' }))
    )
    expect(error?.message).toBe('REDIRECT:/heute')
  })
})

describe('signOut', () => {
  it('ends the session on this device and returns to the login (AC-11)', async () => {
    auth.signOut.mockResolvedValue({ error: null })
    await expect(actions.signOut()).rejects.toThrow('REDIRECT:/anmelden')
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})

describe('requestPasswordReset', () => {
  it('answers identically for any address and moves to the code step (AC-6, AC-8)', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    const { result, elapsed } = await timed(() => actions.requestPasswordReset(idle, form({ email: 'A@b.de' })))
    expect(result).toEqual({
      status: 'success',
      step: 'confirm',
      message: AUTH_MESSAGES.resetRequested,
      values: { email: 'a@b.de' },
    })
    expect(elapsed).toBeGreaterThanOrEqual(MIN_RESPONSE_MS)
  })

  it('treats a mail throttle like success so it reveals no account', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { code: 'over_email_send_rate_limit', status: 429 } })
    const { result } = await timed(() => actions.requestPasswordReset(idle, form({ email: 'a@b.de' })))
    expect(result).toMatchObject({ status: 'success', message: AUTH_MESSAGES.resetRequested })
  })

  it('does not fake a successful delivery when sending fails (EC-3)', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { code: 'unexpected_failure', status: 500 } })
    const { result } = await timed(() => actions.requestPasswordReset(idle, form({ email: 'a@b.de' })))
    expect(result).toMatchObject({ status: 'error', step: 'request', message: AUTH_MESSAGES.serviceUnavailable })
  })
})

describe('confirmPasswordReset', () => {
  const fields = { email: 'a@b.de', code: '123456', password }

  it('sets the new password, ends other sessions and signs in (AC-8)', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null })
    auth.updateUser.mockResolvedValue({ data: {}, error: null })
    auth.signOut.mockResolvedValue({ error: null })
    await expect(actions.confirmPasswordReset(idle, form(fields))).rejects.toThrow('REDIRECT:/heute')
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.de', token: '123456', type: 'recovery' })
    expect(auth.updateUser).toHaveBeenCalledWith({ password })
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' })
  })

  it('changes nothing for an expired or used code (EC-2)', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { code: 'otp_expired', status: 403 } })
    const state = await actions.confirmPasswordReset(idle, form(fields))
    expect(state).toMatchObject({ status: 'error', step: 'confirm', fieldErrors: { code: AUTH_MESSAGES.codeInvalid } })
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('validates the new password before spending the code (AC-7)', async () => {
    const state = await actions.confirmPasswordReset(idle, form({ ...fields, password: 'kurz' }))
    expect(state.fieldErrors?.password).toBe(MESSAGES.passwordTooShort)
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('ends the recovery session if the new password is refused', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null })
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'same_password', status: 422 } })
    auth.signOut.mockResolvedValue({ error: null })
    const state = await actions.confirmPasswordReset(idle, form(fields))
    expect(state.status).toBe('error')
    expect(state.message).toContain(AUTH_MESSAGES.samePassword)
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})
