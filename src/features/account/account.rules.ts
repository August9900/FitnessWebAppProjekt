/**
 * Pure account rules: which neutral message an auth failure maps to, where a login may
 * redirect to, and what the data export contains. No IO, no framework.
 */

/** Minimum duration of login and reset-request responses, so timing does not reveal accounts (AC-6). */
export const MIN_RESPONSE_MS = 800

export const DEFAULT_AFTER_LOGIN_PATH = '/heute'

export const AUTH_MESSAGES = {
  invalidCredentials: 'E-Mail oder Passwort stimmen nicht.',
  signupUnavailable:
    'Mit dieser E-Mail-Adresse ist keine Registrierung möglich. Wenn du schon ein Konto hast, melde dich an.',
  resetRequested:
    'Falls ein Konto zu dieser Adresse existiert, haben wir dir einen Code geschickt. Er ist 10 Minuten gültig.',
  codeInvalid: 'Der Code ist falsch, abgelaufen oder wurde schon verwendet. Fordere einen neuen Code an.',
  weakPassword: 'Dieses Passwort wird nicht akzeptiert. Wähle ein längeres Passwort oder eine Passphrase.',
  samePassword: 'Das neue Passwort muss sich vom bisherigen unterscheiden.',
  currentPasswordWrong: 'Das aktuelle Passwort stimmt nicht.',
  rateLimited: 'Zu viele Versuche in kurzer Zeit. Bitte warte ein paar Minuten und versuche es dann erneut.',
  serviceUnavailable: 'Der Dienst ist gerade nicht erreichbar. Bitte versuche es gleich noch einmal.',
} as const

export type AuthMessageKey = keyof typeof AUTH_MESSAGES

export const ACCOUNT_MESSAGES = {
  passwordChanged: 'Dein Passwort wurde geändert. Andere Geräte wurden abgemeldet.',
  deleteFailed:
    'Dein Konto konnte gerade nicht gelöscht werden. Es wurde nichts verändert. Bitte versuche es erneut.',
} as const

export type AuthFlow = 'signup' | 'login' | 'resetRequest' | 'resetConfirm' | 'passwordUpdate'

/** The parts of a Supabase AuthError the rules look at. */
export type AuthErrorLike = { code?: string | null; status?: number | null } | null | undefined

const RATE_LIMIT_CODES = new Set(['over_request_rate_limit', 'over_email_send_rate_limit'])

function isUnavailable(error: NonNullable<AuthErrorLike>): boolean {
  // No status means the request never got a proper answer (network, timeout).
  return error.status == null || error.status >= 500
}

/**
 * Maps an auth failure to a fixed, neutral message key. Returns null when the flow
 * should present the failure as its normal neutral outcome.
 */
export function authErrorKey(flow: AuthFlow, error: AuthErrorLike): AuthMessageKey | null {
  if (!error) return null
  const code = error.code ?? ''

  switch (flow) {
    case 'login':
      if (RATE_LIMIT_CODES.has(code)) return 'rateLimited'
      if (isUnavailable(error)) return 'serviceUnavailable'
      // Unknown address, wrong password, anything else: the same answer (AC-6).
      return 'invalidCredentials'

    case 'signup':
      if (code === 'user_already_exists' || code === 'email_exists') return 'signupUnavailable'
      if (code === 'weak_password') return 'weakPassword'
      if (RATE_LIMIT_CODES.has(code)) return 'rateLimited'
      return 'serviceUnavailable'

    case 'resetRequest':
      // Supabase only throttles mails for existing addresses, so a throttle must look
      // exactly like success (AC-6). A real delivery failure is not hidden (EC-3).
      if (RATE_LIMIT_CODES.has(code)) return null
      if (isUnavailable(error)) return 'serviceUnavailable'
      return null

    case 'resetConfirm':
      if (code === 'over_request_rate_limit') return 'rateLimited'
      if (isUnavailable(error)) return 'serviceUnavailable'
      return 'codeInvalid'

    case 'passwordUpdate':
      if (code === 'same_password') return 'samePassword'
      if (code === 'weak_password') return 'weakPassword'
      if (RATE_LIMIT_CODES.has(code)) return 'rateLimited'
      return 'serviceUnavailable'
  }
}

/**
 * Only internal, absolute paths are allowed as a post-login target. Anything else —
 * protocol-relative URLs, backslash tricks, external URLs — falls back to the default.
 */
export function safeRedirectPath(candidate: unknown): string {
  if (typeof candidate !== 'string') return DEFAULT_AFTER_LOGIN_PATH
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return DEFAULT_AFTER_LOGIN_PATH
  }
  if ([...candidate].some((char) => char.charCodeAt(0) < 0x20)) return DEFAULT_AFTER_LOGIN_PATH
  return candidate
}

/** Remaining wait so a response takes at least MIN_RESPONSE_MS in total. */
export function remainingDelay(startedAt: number, now: number, minimum = MIN_RESPONSE_MS): number {
  return Math.max(0, minimum - (now - startedAt))
}

export type ExportAccount = {
  id: string
  email: string | null | undefined
  created_at: string
  last_sign_in_at?: string | null
}

export type ExportProfile = {
  age_band_at_signup: string
  created_at: string
  updated_at: string
  /** PROJ-3 answers; empty until the person has answered. */
  goal?: string | null
  experience?: string | null
  places?: string[] | null
  home_equipment?: string[] | null
  diet?: string | null
}

/** A PROJ-6 check-in as stored: answers of the chosen kind and the ranked suggestion. */
export type ExportCheckIn = {
  id: string
  kind: string
  minutes: number | null
  energy: string | null
  place: string | null
  effort: string | null
  suggested_ids: string[]
  created_at: string
}

/** A PROJ-6 action as stored: the started content, its state and times. */
export type ExportAction = {
  id: string
  check_in_id: string
  kind: string
  workout_id: string | null
  meal_id: string | null
  status: string
  started_at: string
  concluded_at: string | null
  updated_at: string
}

export type ExportDailyDecisions = { checkIns: ExportCheckIn[]; actions: ExportAction[] }

/** A PROJ-7 feedback as stored: the action it belongs to, both answers and their times. */
export type ExportFeedback = {
  action_id: string
  effort: string | null
  effort_at: string | null
  suggest_again: string | null
  suggest_again_at: string | null
  created_at: string
  updated_at: string
}

/** Machine-readable copy of the account's stored data (AC-15). Later features add their sections. */
export function buildAccountExport(input: {
  account: ExportAccount
  profile: ExportProfile | null
  dailyDecisions: ExportDailyDecisions
  feedback: ExportFeedback[]
  exportedAt: Date
}) {
  return {
    format: 'pulse-account-export',
    version: 1,
    exportedAt: input.exportedAt.toISOString(),
    account: {
      id: input.account.id,
      email: input.account.email ?? null,
      createdAt: input.account.created_at,
      lastSignInAt: input.account.last_sign_in_at ?? null,
    },
    profile: input.profile
      ? {
          ageBandAtSignup: input.profile.age_band_at_signup,
          goal: input.profile.goal ?? null,
          experience: input.profile.experience ?? null,
          places: input.profile.places ?? null,
          homeEquipment: input.profile.home_equipment ?? null,
          diet: input.profile.diet ?? null,
          createdAt: input.profile.created_at,
          updatedAt: input.profile.updated_at,
        }
      : null,
    // PROJ-6 Tagesentscheidung: check-ins with answers and suggestion, actions with state (AC-18).
    dailyDecisions: {
      checkIns: input.dailyDecisions.checkIns.map((checkIn) => ({
        id: checkIn.id,
        kind: checkIn.kind,
        minutes: checkIn.minutes,
        energy: checkIn.energy,
        place: checkIn.place,
        effort: checkIn.effort,
        suggestedIds: checkIn.suggested_ids,
        createdAt: checkIn.created_at,
      })),
      actions: input.dailyDecisions.actions.map((action) => ({
        id: action.id,
        checkInId: action.check_in_id,
        kind: action.kind,
        workoutId: action.workout_id,
        mealId: action.meal_id,
        status: action.status,
        startedAt: action.started_at,
        concludedAt: action.concluded_at,
        updatedAt: action.updated_at,
      })),
    },
    // PROJ-7 Abschlussfeedback: both answers with their times and the action they belong to (AC-17).
    feedback: input.feedback.map((entry) => ({
      actionId: entry.action_id,
      effort: entry.effort,
      effortAt: entry.effort_at,
      suggestAgain: entry.suggest_again,
      suggestAgainAt: entry.suggest_again_at,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    })),
  }
}

export function exportFileName(date: Date): string {
  return `pulse-daten-${date.toISOString().slice(0, 10)}.json`
}

const AGE_BAND_LABELS: Record<string, string> = {
  '12_15': '12–15 Jahre',
  '16_plus': 'ab 16 Jahren',
}

export function ageBandLabel(band: string | null | undefined): string {
  return (band && AGE_BAND_LABELS[band]) || 'Keine Angabe'
}
