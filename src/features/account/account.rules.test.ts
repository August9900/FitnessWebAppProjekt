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
      profile: {
        age_band_at_signup: '16_plus',
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-01T00:00:00Z',
        goal: 'fitness',
        experience: 'beginner',
        places: ['home', 'gym'],
        home_equipment: ['mat'],
        diet: 'vegan',
      },
      dailyDecisions: { checkIns: [], actions: [] },
      feedback: [],
      customWorkouts: [],
      exportedAt,
    })
    expect(result).toEqual({
      format: 'pulse-account-export',
      version: 1,
      exportedAt: '2026-11-11T10:00:00.000Z',
      account: { id: 'u1', email: 'a@b.de', createdAt: '2026-11-01T00:00:00Z', lastSignInAt: '2026-11-10T00:00:00Z' },
      profile: {
        ageBandAtSignup: '16_plus',
        goal: 'fitness',
        experience: 'beginner',
        places: ['home', 'gym'],
        homeEquipment: ['mat'],
        diet: 'vegan',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
      },
      dailyDecisions: { checkIns: [], actions: [] },
      feedback: [],
      customWorkouts: [],
    })
    expect(JSON.stringify(result)).not.toContain('hash')
  })

  it('exports unanswered PROJ-3 fields as null (AC-15 of PROJ-3)', () => {
    const result = buildAccountExport({
      account: { id: 'u1', email: 'a@b.de', created_at: 'c' },
      profile: { age_band_at_signup: '12_15', created_at: 'c', updated_at: 'u' },
      dailyDecisions: { checkIns: [], actions: [] },
      feedback: [],
      customWorkouts: [],
      exportedAt,
    })
    expect(result.profile).toMatchObject({ goal: null, experience: null, places: null, homeEquipment: null, diet: null })
  })

  it('contains check-ins with answers, suggestion and time, and actions with state and times (AC-18 of PROJ-6)', () => {
    const result = buildAccountExport({
      account: { id: 'u1', email: 'a@b.de', created_at: 'c' },
      profile: null,
      dailyDecisions: {
        checkIns: [
          {
            id: 'ci1',
            kind: 'move',
            minutes: 10,
            energy: 'low',
            place: 'home',
            effort: null,
            suggested_ids: ['morgen_mobil_5', 'ruecken_10'],
            created_at: '2026-11-17T08:00:00Z',
          },
          {
            id: 'ci2',
            kind: 'eat',
            minutes: null,
            energy: null,
            place: null,
            effort: 'quick',
            suggested_ids: [],
            created_at: '2026-11-17T12:00:00Z',
          },
        ],
        actions: [
          {
            id: 'a1',
            check_in_id: 'ci1',
            kind: 'move',
            workout_id: 'ruecken_10',
            meal_id: null,
            status: 'done',
            started_at: '2026-11-17T08:01:00Z',
            concluded_at: '2026-11-17T08:20:00Z',
            updated_at: '2026-11-17T08:20:00Z',
          },
        ],
      },
      feedback: [],
      customWorkouts: [],
      exportedAt,
    })
    expect(result.dailyDecisions).toEqual({
      checkIns: [
        {
          id: 'ci1',
          kind: 'move',
          minutes: 10,
          energy: 'low',
          place: 'home',
          effort: null,
          suggestedIds: ['morgen_mobil_5', 'ruecken_10'],
          createdAt: '2026-11-17T08:00:00Z',
        },
        {
          id: 'ci2',
          kind: 'eat',
          minutes: null,
          energy: null,
          place: null,
          effort: 'quick',
          suggestedIds: [],
          createdAt: '2026-11-17T12:00:00Z',
        },
      ],
      actions: [
        {
          id: 'a1',
          checkInId: 'ci1',
          kind: 'move',
          workoutId: 'ruecken_10',
          mealId: null,
          status: 'done',
          startedAt: '2026-11-17T08:01:00Z',
          concludedAt: '2026-11-17T08:20:00Z',
          updatedAt: '2026-11-17T08:20:00Z',
        },
      ],
    })
  })

  it('contains each feedback with both answers, their times and the action (AC-17 of PROJ-7)', () => {
    const result = buildAccountExport({
      account: { id: 'u1', email: 'a@b.de', created_at: 'c' },
      profile: null,
      dailyDecisions: { checkIns: [], actions: [] },
      feedback: [
        {
          action_id: 'a1',
          effort: 'too_much',
          effort_at: '2026-11-17T08:21:00Z',
          suggest_again: null,
          suggest_again_at: null,
          created_at: '2026-11-17T08:21:00Z',
          updated_at: '2026-11-17T08:22:00Z',
        },
      ],
      customWorkouts: [],
      exportedAt,
    })
    expect(result.feedback).toEqual([
      {
        actionId: 'a1',
        effort: 'too_much',
        effortAt: '2026-11-17T08:21:00Z',
        suggestAgain: null,
        suggestAgainAt: null,
        createdAt: '2026-11-17T08:21:00Z',
        updatedAt: '2026-11-17T08:22:00Z',
      },
    ])
  })

  it('contains own workouts with name, sequence and times (AC-13 of PROJ-10)', () => {
    const result = buildAccountExport({
      account: { id: 'u1', email: 'a@b.de', created_at: 'c' },
      profile: null,
      dailyDecisions: { checkIns: [], actions: [] },
      feedback: [],
      customWorkouts: [
        {
          id: 'w1',
          name: 'Mein Mix',
          steps: [
            { exercise_id: 'kniebeuge', mode: 'time', amount: 30 },
            { exercise_id: 'marschieren', mode: 'reps', amount: 10 },
          ],
          created_at: 't1',
          updated_at: 't2',
        },
      ],
      exportedAt,
    })
    expect(result.customWorkouts).toEqual([
      {
        id: 'w1',
        name: 'Mein Mix',
        steps: [
          { exerciseId: 'kniebeuge', mode: 'time', amount: 30 },
          { exerciseId: 'marschieren', mode: 'reps', amount: 10 },
        ],
        createdAt: 't1',
        updatedAt: 't2',
      },
    ])
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
