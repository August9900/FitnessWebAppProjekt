// Privileged Supabase client (service role). It bypasses Row Level Security, so it is used for
// exactly one thing: deleting an account (PROJ-1, AC-16). Server-only — never import it from a
// Client Component, and never give the key a NEXT_PUBLIC_ prefix.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin client is not configured (SUPABASE_SERVICE_ROLE_KEY missing).')
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
