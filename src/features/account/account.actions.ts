'use server'

// Signed-in account actions: change the password and delete the account. Both require the
// current password again; neither trusts anything but the server-confirmed session.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteAccount, requireUser, verifyCurrentPassword } from './account.data'
import { ACCOUNT_MESSAGES, AUTH_MESSAGES, authErrorKey } from './account.rules'
import { deleteAccountSchema, firstFieldErrors, passwordChangeSchema } from './account.schema'
import type { FormState } from './auth.actions'

function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: text(formData, 'currentPassword'),
    newPassword: text(formData, 'newPassword'),
  })
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstFieldErrors(parsed.error) }
  }

  const check = await verifyCurrentPassword(user.email ?? '', parsed.data.currentPassword)
  if (!check.ok) {
    return check.reason === 'wrong'
      ? { status: 'error', fieldErrors: { currentPassword: AUTH_MESSAGES.currentPasswordWrong } }
      : { status: 'error', message: AUTH_MESSAGES.serviceUnavailable }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
  if (error) {
    const key = authErrorKey('passwordUpdate', error) ?? 'serviceUnavailable'
    if (key === 'samePassword' || key === 'weakPassword') {
      return { status: 'error', fieldErrors: { newPassword: AUTH_MESSAGES[key] } }
    }
    console.error('[account] passwordUpdate failed', { code: error.code ?? null, status: error.status ?? null })
    return { status: 'error', message: AUTH_MESSAGES[key] }
  }

  // Only the new password counts from now on; other devices lose access (AC-9).
  await supabase.auth.signOut({ scope: 'others' })
  return { status: 'success', message: ACCOUNT_MESSAGES.passwordChanged }
}

export async function deleteOwnAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = deleteAccountSchema.safeParse({
    currentPassword: text(formData, 'currentPassword'),
    confirmation: text(formData, 'confirmation'),
  })
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstFieldErrors(parsed.error) }
  }

  const check = await verifyCurrentPassword(user.email ?? '', parsed.data.currentPassword)
  if (!check.ok) {
    return check.reason === 'wrong'
      ? { status: 'error', fieldErrors: { currentPassword: AUTH_MESSAGES.currentPasswordWrong } }
      : { status: 'error', message: AUTH_MESSAGES.serviceUnavailable }
  }

  try {
    await deleteAccount(user.id)
  } catch (error) {
    console.error('[account] deletion failed', { reason: error instanceof Error ? error.message : 'unknown' })
    // Nothing changed — say so and allow another attempt (AC-16).
    return { status: 'error', message: ACCOUNT_MESSAGES.deleteFailed }
  }

  // The account and all its sessions are gone; clear this browser's cookies as well.
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/?konto=geloescht')
}
