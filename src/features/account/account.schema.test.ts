import {
  MESSAGES,
  deleteAccountSchema,
  firstFieldErrors,
  loginSchema,
  newPasswordSchema,
  passwordChangeSchema,
  resetConfirmSchema,
  signupSchema,
} from './account.schema'

const validPassword = 'lange sichere passphrase'

describe('signupSchema', () => {
  it('accepts a valid signup and normalizes the email', () => {
    const result = signupSchema.safeParse({
      email: '  Person@Example.ORG ',
      password: validPassword,
      ageBand: '12_15',
    })
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('person@example.org')
  })

  it('rejects people under 12 with the age-limit message at the age field (AC-3)', () => {
    const result = signupSchema.safeParse({ email: 'a@b.de', password: validPassword, ageBand: 'under_12' })
    expect(result.success).toBe(false)
    expect(firstFieldErrors(result.error!)).toEqual({ ageBand: MESSAGES.underAge })
  })

  it('requires an age band', () => {
    const result = signupSchema.safeParse({ email: 'a@b.de', password: validPassword })
    expect(result.success).toBe(false)
    expect(firstFieldErrors(result.error!).ageBand).toBe(MESSAGES.ageBandRequired)
  })

  it('reports each invalid field at its own name (AC-21)', () => {
    const result = signupSchema.safeParse({ email: 'kein-at', password: 'kurz', ageBand: '16_plus' })
    expect(result.success).toBe(false)
    expect(firstFieldErrors(result.error!)).toEqual({
      email: MESSAGES.emailInvalid,
      password: MESSAGES.passwordTooShort,
    })
  })
})

describe('newPasswordSchema (AC-7)', () => {
  it('rejects 11 characters and accepts 12', () => {
    expect(newPasswordSchema.safeParse('a'.repeat(11)).success).toBe(false)
    expect(newPasswordSchema.safeParse('a'.repeat(12)).success).toBe(true)
  })

  it('accepts a long passphrase up to 72 bytes', () => {
    expect(newPasswordSchema.safeParse('a'.repeat(72)).success).toBe(true)
  })

  it('rejects more than 72 bytes, counting umlauts as two bytes', () => {
    expect(newPasswordSchema.safeParse('a'.repeat(73)).error?.issues[0].message).toBe(MESSAGES.passwordTooLong)
    // 37 × "ä" = 74 bytes although only 37 characters
    expect(newPasswordSchema.safeParse('ä'.repeat(37)).success).toBe(false)
  })

  it('explains an empty password as missing, not as too short', () => {
    expect(newPasswordSchema.safeParse('').error?.issues[0].message).toBe(MESSAGES.passwordRequired)
  })
})

describe('loginSchema', () => {
  it('does not apply the new-password length rule to a login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.de', password: 'x' }).success).toBe(true)
  })

  it('requires both fields', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(firstFieldErrors(result.error!)).toEqual({
      email: MESSAGES.emailRequired,
      password: MESSAGES.passwordRequired,
    })
  })
})

describe('resetConfirmSchema', () => {
  it('accepts a 6-digit code', () => {
    const result = resetConfirmSchema.safeParse({ email: 'a@b.de', code: ' 123456 ', password: validPassword })
    expect(result.success).toBe(true)
    expect(result.data?.code).toBe('123456')
  })

  it('rejects codes that are not exactly 6 digits', () => {
    for (const code of ['12345', '1234567', 'abcdef']) {
      const result = resetConfirmSchema.safeParse({ email: 'a@b.de', code, password: validPassword })
      expect(firstFieldErrors(result.error!).code).toBe(MESSAGES.codeInvalidFormat)
    }
  })
})

describe('passwordChangeSchema', () => {
  it('needs the current password and a valid new one', () => {
    const result = passwordChangeSchema.safeParse({ currentPassword: '', newPassword: 'kurz' })
    expect(firstFieldErrors(result.error!)).toEqual({
      currentPassword: MESSAGES.passwordRequired,
      newPassword: MESSAGES.passwordTooShort,
    })
  })
})

describe('deleteAccountSchema', () => {
  it('only accepts the exact confirmation word', () => {
    expect(deleteAccountSchema.safeParse({ currentPassword: 'x', confirmation: 'LÖSCHEN' }).success).toBe(true)
    expect(deleteAccountSchema.safeParse({ currentPassword: 'x', confirmation: ' LÖSCHEN ' }).success).toBe(true)
    for (const confirmation of ['löschen', 'LOESCHEN', '']) {
      const result = deleteAccountSchema.safeParse({ currentPassword: 'x', confirmation })
      expect(firstFieldErrors(result.error!).confirmation).toBe(MESSAGES.deleteConfirmation)
    }
  })
})
