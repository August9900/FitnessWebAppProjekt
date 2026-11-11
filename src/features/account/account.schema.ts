import { z } from 'zod'

/** Age bands stored on the profile. "under_12" is a form choice only and is never stored. */
export const STORED_AGE_BANDS = ['12_15', '16_plus'] as const
export const AGE_BAND_CHOICES = ['12_15', '16_plus', 'under_12'] as const

export type StoredAgeBand = (typeof STORED_AGE_BANDS)[number]
export type AgeBandChoice = (typeof AGE_BAND_CHOICES)[number]

export const PASSWORD_MIN_LENGTH = 12
/** Supabase hashes with bcrypt, which only reads the first 72 bytes. */
export const PASSWORD_MAX_BYTES = 72

export const MESSAGES = {
  emailRequired: 'Bitte gib deine E-Mail-Adresse ein.',
  emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
  passwordRequired: 'Bitte gib dein Passwort ein.',
  passwordTooShort: `Das Passwort braucht mindestens ${PASSWORD_MIN_LENGTH} Zeichen. Eine Passphrase aus mehreren Wörtern ist ideal.`,
  passwordTooLong: `Das Passwort ist zu lang. Erlaubt sind höchstens ${PASSWORD_MAX_BYTES} Zeichen (Umlaute zählen doppelt).`,
  ageBandRequired: 'Bitte wähle deine Altersgruppe.',
  underAge: 'PULSE ist ab 12 Jahren nutzbar. Ein Konto kann leider erst ab diesem Alter angelegt werden.',
  codeInvalidFormat: 'Der Code besteht aus 6 Ziffern.',
  deleteConfirmation: 'Bitte tippe LÖSCHEN, um die Löschung zu bestätigen.',
} as const

const email = z
  .string({ error: MESSAGES.emailRequired })
  .trim()
  .min(1, { error: MESSAGES.emailRequired })
  .max(254, { error: MESSAGES.emailInvalid })
  .toLowerCase()
  .pipe(z.email({ error: MESSAGES.emailInvalid }))

const utf8Length = (value: string) => new TextEncoder().encode(value).length

/** A password someone sets: 12 characters minimum, at most 72 bytes. No character-class rules. */
export const newPasswordSchema = z
  .string({ error: MESSAGES.passwordRequired })
  .min(1, { error: MESSAGES.passwordRequired })
  .min(PASSWORD_MIN_LENGTH, { error: MESSAGES.passwordTooShort })
  .refine((value) => utf8Length(value) <= PASSWORD_MAX_BYTES, { error: MESSAGES.passwordTooLong })

/** A password someone enters to prove who they are — only presence and a sane upper bound. */
const enteredPassword = z
  .string({ error: MESSAGES.passwordRequired })
  .min(1, { error: MESSAGES.passwordRequired })
  .max(1024, { error: MESSAGES.passwordRequired })

export const signupSchema = z
  .object({
    email,
    password: newPasswordSchema,
    ageBand: z.enum(AGE_BAND_CHOICES, { error: MESSAGES.ageBandRequired }),
  })
  .superRefine((value, ctx) => {
    if (value.ageBand === 'under_12') {
      ctx.addIssue({ code: 'custom', path: ['ageBand'], message: MESSAGES.underAge })
    }
  })

export const loginSchema = z.object({
  email,
  password: enteredPassword,
})

export const resetRequestSchema = z.object({
  email,
})

export const resetConfirmSchema = z.object({
  email,
  code: z
    .string({ error: MESSAGES.codeInvalidFormat })
    .trim()
    .regex(/^\d{6}$/, { error: MESSAGES.codeInvalidFormat }),
  password: newPasswordSchema,
})

export const passwordChangeSchema = z.object({
  currentPassword: enteredPassword,
  newPassword: newPasswordSchema,
})

export const deleteAccountSchema = z.object({
  currentPassword: enteredPassword,
  confirmation: z
    .string({ error: MESSAGES.deleteConfirmation })
    .trim()
    .refine((value) => value === 'LÖSCHEN', { error: MESSAGES.deleteConfirmation }),
})

export type SignupInput = z.input<typeof signupSchema>
export type LoginInput = z.input<typeof loginSchema>
export type ResetRequestInput = z.input<typeof resetRequestSchema>
export type ResetConfirmInput = z.input<typeof resetConfirmSchema>
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>
export type DeleteAccountInput = z.input<typeof deleteAccountSchema>

/** Field name → first error message, for showing errors directly at the field (AC-21). */
export type FieldErrors = Partial<Record<string, string>>

export function firstFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    if (!result[field]) result[field] = issue.message
  }
  return result
}
