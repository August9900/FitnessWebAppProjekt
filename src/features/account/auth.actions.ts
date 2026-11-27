'use server'

// Public account flows: sign up, sign in, sign out, request and complete a password reset.
// All run on the server, validate their input with Zod and answer with fixed, neutral messages.
// Credentials only ever arrive in the POST body of a Server Action (AC-21).
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  AUTH_MESSAGES,
  authErrorKey,
  remainingDelay,
  safeRedirectPath,
  type AuthErrorLike,
  type AuthFlow,
} from './account.rules'
import {
  firstFieldErrors,
  loginSchema,
  resetConfirmSchema,
  resetRequestSchema,
  signupSchema,
  type FieldErrors,
} from './account.schema'

export type FormState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: FieldErrors
  /** Non-secret values to put back into the form. Never contains a password or code. */
  values?: Record<string, string>
  /** Password reset only: which of the two steps the form shows. */
  step?: 'request' | 'confirm'
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

async function padResponse(startedAt: number) {
  const wait = remainingDelay(startedAt, Date.now())
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
}

/** One log line for failures the person cannot fix themselves — never with email, password or code. */
function logUnexpected(flow: AuthFlow, error: AuthErrorLike) {
  if (error && (error.status == null || error.status >= 500)) {
    console.error(`[account] ${flow} failed`, { code: error.code ?? null, status: error.status ?? null })
  }
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, 'email'), ageBand: text(formData, 'ageBand') }
  const parsed = signupSchema.safeParse({ ...values, password: text(formData, 'password') })
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstFieldErrors(parsed.error), values }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { age_band: parsed.data.ageBand } },
  })

  if (error) {
    logUnexpected('signup', error)
    const key = authErrorKey('signup', error) ?? 'serviceUnavailable'
    if (key === 'weakPassword') {
      return { status: 'error', fieldErrors: { password: AUTH_MESSAGES.weakPassword }, values }
    }
    return { status: 'error', message: AUTH_MESSAGES[key], values }
  }

  // Email confirmation is off in the prototype: a new account comes with a session (AC-2).
  redirect(data.session ? '/heute' : '/anmelden')
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const startedAt = Date.now()
  const values = { email: text(formData, 'email') }
  const parsed = loginSchema.safeParse({ ...values, password: text(formData, 'password') })
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstFieldErrors(parsed.error), values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  await padResponse(startedAt)

  if (error) {
    logUnexpected('login', error)
    const key = authErrorKey('login', error) ?? 'invalidCredentials'
    return { status: 'error', message: AUTH_MESSAGES[key], values }
  }

  redirect(safeRedirectPath(formData.get('weiter')))
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  // Ends the session on this device only (AC-11).
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/anmelden')
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const startedAt = Date.now()
  const values = { email: text(formData, 'email') }
  const parsed = resetRequestSchema.safeParse(values)
  if (!parsed.success) {
    return { status: 'error', step: 'request', fieldErrors: firstFieldErrors(parsed.error), values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email)
  await padResponse(startedAt)

  const key = authErrorKey('resetRequest', error)
  if (key) {
    logUnexpected('resetRequest', error)
    // A real delivery failure is not passed off as success (EC-3).
    return { status: 'error', step: 'request', message: AUTH_MESSAGES[key], values }
  }

  // Same answer for known and unknown addresses (AC-6).
  return {
    status: 'success',
    step: 'confirm',
    message: AUTH_MESSAGES.resetRequested,
    values: { email: parsed.data.email },
  }
}

export async function confirmPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, 'email') }
  const parsed = resetConfirmSchema.safeParse({
    ...values,
    code: text(formData, 'code'),
    password: text(formData, 'password'),
  })
  if (!parsed.success) {
    return { status: 'error', step: 'confirm', fieldErrors: firstFieldErrors(parsed.error), values }
  }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: 'recovery',
  })
  if (verifyError) {
    logUnexpected('resetConfirm', verifyError)
    const key = authErrorKey('resetConfirm', verifyError) ?? 'codeInvalid'
    // An expired, used or wrong code changes nothing (EC-2).
    if (key === 'codeInvalid') {
      return { status: 'error', step: 'confirm', fieldErrors: { code: AUTH_MESSAGES.codeInvalid }, values }
    }
    return { status: 'error', step: 'confirm', message: AUTH_MESSAGES[key], values }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (updateError) {
    logUnexpected('passwordUpdate', updateError)
    // The code is spent: end the recovery session and start over with a new code.
    await supabase.auth.signOut({ scope: 'local' })
    const key = authErrorKey('passwordUpdate', updateError) ?? 'serviceUnavailable'
    return {
      status: 'error',
      step: 'request',
      message: `${AUTH_MESSAGES[key]} Bitte fordere dafür einen neuen Code an.`,
      values,
    }
  }

  // Everyone else who was signed in with the old password loses access (AC-8).
  await supabase.auth.signOut({ scope: 'others' })
  redirect('/heute')
}
