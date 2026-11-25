// Server-side access to the person's PROJ-11 weight entries and the setting that shows the area.
// Every query runs with the person's own session, so Row Level Security (own rows, active session,
// age band "ab 16") and the column grants apply (AC-2, AC-15); the user id is filtered in addition,
// never instead. Saving goes through one database function that decides in a single step (AC-6, AC-11).
import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { newestFirst, type WeightAccessInput, type WeightEntry } from './weight.rules'
import type { ValidWeightEntry } from './weight.schema'

/** Database refusals of a value (check constraint, own date guard) — the input was not valid (AC-5). */
const CHECK_VIOLATION = '23514'
const FUTURE_DATE = 'WE001'

/** Reading or writing failed (EC-4, EC-6). The message carries the database code only, never weight or date. */
export class WeightDataError extends Error {}

function failed(what: string, error: { code?: string } | null | undefined): WeightDataError {
  return new WeightDataError(`${what} (${error?.code ?? 'unknown'}).`)
}

export type WeightAccess = { ageBand: WeightAccessInput['ageBand']; showWeightInNav: boolean } | null

/**
 * Age band and setting of the signed-in person — what decides about the area (AC-1, AC-2, AC-14).
 * Asked once per request: the frame and the page both need it. Null when there is no profile row.
 */
export const getWeightAccess = cache(async (userId: string): Promise<WeightAccess> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('age_band_at_signup, show_weight_in_nav')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw failed('Weight access could not be read', error)
  if (!data) return null
  return { ageBand: data.age_band_at_signup, showWeightInNav: data.show_weight_in_nav === true }
})

const kg = z.union([z.number(), z.string()]).transform(Number).pipe(z.number().finite())
const storedRow = z.object({ entry_date: z.string(), weight_kg: kg })

function toEntries(rows: unknown[] | null): WeightEntry[] {
  return (rows ?? [])
    .map((row) => storedRow.safeParse(row))
    .filter((parsed) => parsed.success)
    .map((parsed) => ({ date: parsed.data.entry_date, weightKg: parsed.data.weight_kg }))
}

/** All of the person's entries, newest first (AC-9). Throws instead of looking like an empty history (EC-6). */
export async function listOwnWeightEntries(userId: string): Promise<WeightEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_entries')
    .select('entry_date, weight_kg')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
  if (error) throw failed('Weight entries could not be read', error)
  return newestFirst(toEntries(data))
}

export type SaveOutcome = { status: 'saved' } | { status: 'exists'; weightKg: number } | { status: 'gone' } | { status: 'invalid' }

const saveResult = z.discriminatedUnion('status', [
  z.object({ status: z.literal('saved') }),
  z.object({ status: z.literal('exists'), weight_kg: kg }),
  z.object({ status: z.literal('gone') }),
])

/**
 * New entry or change of an existing one (AC-4, AC-6, AC-11, EC-1 to EC-3). The database answers
 * saved, exists (with the value on that day) or gone; a value it refuses is "invalid".
 */
export async function saveOwnWeightEntry(entry: ValidWeightEntry): Promise<SaveOutcome> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('save_weight_entry', {
    p_entry_date: entry.date,
    p_weight_kg: entry.weightKg,
    p_previous_date: entry.previousDate,
    p_replace: entry.replace,
  })
  if (error) {
    if (error.code === CHECK_VIOLATION || error.code === FUTURE_DATE) return { status: 'invalid' }
    throw failed('Weight entry could not be saved', error)
  }
  const parsed = saveResult.safeParse(data)
  if (!parsed.success) throw new WeightDataError('Weight entry save returned an unknown result.')
  return parsed.data.status === 'exists' ? { status: 'exists', weightKg: parsed.data.weight_kg } : parsed.data
}

/** Deletes one entry; an entry that is already gone is fine (AC-12, EC-2). */
export async function deleteOwnWeightEntry(userId: string, date: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('weight_entries').delete().eq('user_id', userId).eq('entry_date', date)
  if (error) throw failed('Weight entry could not be deleted', error)
}

/** Deletes every entry of the person (AC-13); repeating it is fine (EC-2). */
export async function deleteAllOwnWeightEntries(userId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('weight_entries').delete().eq('user_id', userId)
  if (error) throw failed('Weight entries could not be deleted', error)
}

/** Shows or hides the area for the account, on every device (AC-14). */
export async function setOwnWeightVisibility(userId: string, show: boolean): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ show_weight_in_nav: show }).eq('user_id', userId)
  if (error) throw failed('Weight setting could not be saved', error)
}

/** The entries for the data export, oldest first — also while the area is hidden (AC-16). */
export async function getOwnWeightExport(userId: string): Promise<WeightEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weight_entries')
    .select('entry_date, weight_kg')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true })
  if (error) throw failed('Weight entries could not be exported', error)
  return toEntries(data)
}
