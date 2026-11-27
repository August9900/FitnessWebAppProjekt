import { ACCOUNT_MESSAGES, AUTH_MESSAGES } from './account.rules'
import { MESSAGES } from './account.schema'

const auth = { updateUser: vi.fn(), signOut: vi.fn() }
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth }) }))

const requireUser = vi.fn()
const verifyCurrentPassword = vi.fn()
const deleteAccount = vi.fn()
vi.mock('./account.data', () => ({ requireUser, verifyCurrentPassword, deleteAccount }))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`)
  },
}))

const { changePassword, deleteOwnAccount } = await import('./account.actions')
const idle = { status: 'idle' } as const
const user = { id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null }
const newPassword = 'neue lange passphrase'

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  requireUser.mockResolvedValue(user)
})

describe('changePassword', () => {
  it('requires a session before doing anything (AC-1)', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(changePassword(idle, form({ currentPassword: 'x', newPassword }))).rejects.toThrow('REDIRECT:/anmelden')
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('checks the current password of the signed-in person, sets the new one and signs out other devices (AC-9)', async () => {
    verifyCurrentPassword.mockResolvedValue({ ok: true })
    auth.updateUser.mockResolvedValue({ data: {}, error: null })
    auth.signOut.mockResolvedValue({ error: null })
    const state = await changePassword(idle, form({ currentPassword: 'alt', newPassword }))
    expect(verifyCurrentPassword).toHaveBeenCalledWith('a@b.de', 'alt')
    expect(auth.updateUser).toHaveBeenCalledWith({ password: newPassword })
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' })
    expect(state).toEqual({ status: 'success', message: ACCOUNT_MESSAGES.passwordChanged })
  })

  it('keeps the old password when the current one is wrong', async () => {
    verifyCurrentPassword.mockResolvedValue({ ok: false, reason: 'wrong' })
    const state = await changePassword(idle, form({ currentPassword: 'falsch', newPassword }))
    expect(state.fieldErrors).toEqual({ currentPassword: AUTH_MESSAGES.currentPasswordWrong })
    expect(auth.updateUser).not.toHaveBeenCalled()
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('rejects a too short new password at its field (AC-7, AC-21)', async () => {
    const state = await changePassword(idle, form({ currentPassword: 'alt', newPassword: 'kurz' }))
    expect(state.fieldErrors).toEqual({ newPassword: MESSAGES.passwordTooShort })
    expect(verifyCurrentPassword).not.toHaveBeenCalled()
  })

  it('explains a reused password at the new-password field', async () => {
    verifyCurrentPassword.mockResolvedValue({ ok: true })
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'same_password', status: 422 } })
    const state = await changePassword(idle, form({ currentPassword: 'alt', newPassword }))
    expect(state.fieldErrors).toEqual({ newPassword: AUTH_MESSAGES.samePassword })
    expect(auth.signOut).not.toHaveBeenCalled()
  })
})

describe('deleteOwnAccount', () => {
  const valid = { currentPassword: 'richtig', confirmation: 'LÖSCHEN' }

  it('deletes exactly the signed-in account after password and confirmation (AC-16)', async () => {
    verifyCurrentPassword.mockResolvedValue({ ok: true })
    deleteAccount.mockResolvedValue(undefined)
    auth.signOut.mockResolvedValue({ error: null })
    await expect(deleteOwnAccount(idle, form(valid))).rejects.toThrow('REDIRECT:/?konto=geloescht')
    expect(deleteAccount).toHaveBeenCalledWith('u1')
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('does nothing without the exact confirmation word', async () => {
    const state = await deleteOwnAccount(idle, form({ ...valid, confirmation: 'ja' }))
    expect(state.fieldErrors?.confirmation).toBe(MESSAGES.deleteConfirmation)
    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('does nothing with a wrong password', async () => {
    verifyCurrentPassword.mockResolvedValue({ ok: false, reason: 'wrong' })
    const state = await deleteOwnAccount(idle, form(valid))
    expect(state.fieldErrors).toEqual({ currentPassword: AUTH_MESSAGES.currentPasswordWrong })
    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('reports a failed deletion as failure and keeps the session (AC-16)', async () => {
    verifyCurrentPassword.mockResolvedValue({ ok: true })
    deleteAccount.mockRejectedValue(new Error('Account deletion failed (500).'))
    const state = await deleteOwnAccount(idle, form(valid))
    expect(state).toEqual({ status: 'error', message: ACCOUNT_MESSAGES.deleteFailed })
    expect(auth.signOut).not.toHaveBeenCalled()
  })
})
