// Server-side account data access: who is signed in, their profile, the export, a password
// re-check that leaves the running session alone, and the account deletion.
import 'server-only'
import { createClient as createStatelessClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildAccountExport, type ExportProfile } from './account.rules'

export type AccountUser = {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
}

/**
 * The signed-in person, confirmed by the auth server — not just a cookie that decodes.
 * Revoked or expired sessions come back as null (AC-12). Asked once per request.
 */
export const getCurrentUser = cache(async (): Promise<AccountUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  const { id, email, created_at, last_sign_in_at } = data.user
  return { id, email: email ?? null, created_at, last_sign_in_at: last_sign_in_at ?? null }
})

/** For protected pages and actions: the signed-in person, or a redirect to the login (AC-1). */
export async function requireUser(): Promise<AccountUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/anmelden')
  return user
}

/** The caller's own profile. Row Level Security limits the read to the owner with a live session. */
export async function getOwnProfile(userId: string): Promise<ExportProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('age_band_at_signup, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`Profile could not be read (${error.code ?? 'unknown'}).`)
  return data
}

/**
 * Everything stored about the signed-in person, or null without a session. Throws instead of
 * returning a partial export when a part cannot be read (AC-15).
 */
export async function collectAccountExport(now = new Date()) {
  const user = await getCurrentUser()
  if (!user) return null
  const profile = await getOwnProfile(user.id)
  return buildAccountExport({ account: user, profile, exportedAt: now })
}

export type PasswordCheck = { ok: true } | { ok: false; reason: 'wrong' | 'unavailable' }

/**
 * Checks a password through a separate client that keeps nothing in cookies, so the person's
 * running session is untouched. The helper session it creates is ended right away.
 */
export async function verifyCurrentPassword(email: string, password: string): Promise<PasswordCheck> {
  const client = createStatelessClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  )
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    const unavailable = error.status == null || error.status >= 500
    return { ok: false, reason: unavailable ? 'unavailable' : 'wrong' }
  }
  await client.auth.signOut({ scope: 'local' })
  return { ok: true }
}

/**
 * Removes the auth account. Profile and sessions go with it through the database cascade, so
 * old tokens lose access at once (AC-16, EC-5). Throws when the deletion did not happen.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(`Account deletion failed (${error.code ?? error.status ?? 'unknown'}).`)
}
