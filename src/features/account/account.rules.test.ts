import {
  DEFAULT_AFTER_LOGIN_PATH,
  MIN_RESPONSE_MS,
  ageBandLabel,
  authErrorKey,
  buildAccountExport,
  exportFileName,
  remainingDelay,
  safeRedirectPath,
} from './account.rules'

describe('authErrorKey', () => {
  it('gives the same login answer for an unknown address and a wrong password (AC-6)', () => {
    expect(authErrorKey('login', { code: 'invalid_credentials', status: 400 })).toBe('invalidCredentials')
    expect(authErrorKey('login', { code: 'user_not_found', status: 400 })).toBe('invalidCredentials')
    expect(authErrorKey('login', { code: 'email_not_confirmed', status: 400 })).toBe('invalidCredentials')
  })

  it('separates throttling and outages from wrong credentials on login', () => {
    expect(authErrorKey('login', { code: 'over_request_rate_limit', status: 429 })).toBe('rateLimited')
    expect(authErrorKey('login', { status: 503 })).toBe('serviceUnavailable')
    expect(authErrorKey('login', {})).toBe('serviceUnavailable')
  })

  it('maps a taken address on signup to the neutral signup message', () => {
    expect(authErrorKey('signup', { code: 'user_already_exists', status: 422 })).toBe('signupUnavailable')
    expect(authErrorKey('signup', { code: 'email_exists', status: 422 })).toBe('signupUnavailable')
    expect(authErrorKey('signup', { code: 'weak_password', status: 422 })).toBe('weakPassword')
    expect(authErrorKey('signup', { code: 'unexpected_failure', status: 500 })).toBe('serviceUnavailable')
  })

  it('makes a throttled reset request look like success, but not a delivery failure (AC-6, EC-3)', () => {
    expect(authErrorKey('resetRequest', { code: 'over_email_send_rate_limit', status: 429 })).toBeNull()
    expect(authErrorKey('resetRequest', { code: 'unexpected_failure', status: 500 })).toBe('serviceUnavailable')
    expect(authErrorKey('resetRequest', null)).toBeNull()
  })

  it('treats any rejected reset code as invalid without detail (EC-2)', () => {
    expect(authErrorKey('resetConfirm', { code: 'otp_expired', status: 403 })).toBe('codeInvalid')
    expect(authErrorKey('resetConfirm', { code: 'validation_failed', status: 400 })).toBe('codeInvalid')
    expect(authErrorKey('resetConfirm', { status: 502 })).toBe('serviceUnavailable')
  })

  it('explains a reused or weak password on update', () => {
    expect(authErrorKey('passwordUpdate', { code: 'same_password', status: 422 })).toBe('samePassword')
    expect(authErrorKey('passwordUpdate', { code: 'weak_password', status: 422 })).toBe('weakPassword')
  })
})

describe('safeRedirectPath', () => {
  it('keeps internal paths', () => {
    expect(safeRedirectPath('/profil')).toBe('/profil')
    expect(safeRedirectPath('/heute?x=1')).toBe('/heute?x=1')
  })

  it('falls back for anything that could leave the app', () => {
    for (const candidate of ['https://evil.example', '//evil.example', '/\\evil.example', 'profil', '', null, 42, '/a\nb']) {
      expect(safeRedirectPath(candidate)).toBe(DEFAULT_AFTER_LOGIN_PATH)
    }
  })
})

describe('remainingDelay', () => {
  it('pads fast responses up to the minimum and never goes negative', () => {
    expect(remainingDelay(1000, 1100)).toBe(MIN_RESPONSE_MS - 100)
    expect(remainingDelay(1000, 1000 + MIN_RESPONSE_MS + 50)).toBe(0)
  })
})

describe('buildAccountExport (AC-15)', () => {
  const exportedAt = new Date('2026-11-11T10:00:00.000Z')

  it('contains account and profile data and nothing secret', () => {
    const result = buildAccountExport({
      account: {
        id: 'u1',
        email: 'a@b.de',
        created_at: '2026-11-01T00:00:00Z',
        last_sign_in_at: '2026-11-10T00:00:00Z',
        // fields a real user object carries that must not leak into the export
        ...({ encrypted_password: 'hash', app_metadata: { provider: 'email' } } as object),
      },
      profile: { age_band_at_signup: '16_plus', created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z' },
      exportedAt,
    })
    expect(result).toEqual({
      format: 'pulse-account-export',
      version: 1,
      exportedAt: '2026-11-11T10:00:00.000Z',
      account: { id: 'u1', email: 'a@b.de', createdAt: '2026-11-01T00:00:00Z', lastSignInAt: '2026-11-10T00:00:00Z' },
      profile: { ageBandAtSignup: '16_plus', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' },
    })
    expect(JSON.stringify(result)).not.toContain('hash')
  })

  it('names the file after the export date', () => {
    expect(exportFileName(exportedAt)).toBe('pulse-daten-2026-11-11.json')
  })
})

describe('ageBandLabel', () => {
  it('labels stored bands and falls back for unknown values', () => {
    expect(ageBandLabel('12_15')).toBe('12–15 Jahre')
    expect(ageBandLabel('16_plus')).toBe('ab 16 Jahren')
    expect(ageBandLabel(undefined)).toBe('Keine Angabe')
  })
})
