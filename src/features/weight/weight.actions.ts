'use server'

// PROJ-11 server actions. Each checks the session, the person's access and its input; the database
// checks ownership, age band and values once more (AC-2, AC-5, AC-15). Every action returns a result
// instead of throwing; failures are logged with the action name and a database code only — never a
// weight, a date or a user id (EC-4).
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { requireUser } from '@/features/account/account.data'
import { TIME_ZONE_COOKIE, resolveTimeZone } from '@/features/week/week.rules'
import {
  deleteAllOwnWeightEntries,
  deleteOwnWeightEntry,
  getWeightAccess,
  saveOwnWeightEntry,
  setOwnWeightVisibility,
} from './weight.data'
import { WEIGHT_PATH, canUseWeight, isIsoDate, todayIn, weightVisible } from './weight.rules'
import { validateWeightEntry, type WeightFieldErrors } from './weight.schema'

/**
 * "exists": another value is stored for that day — ask before replacing (AC-6); "gone": the entry
 * was deleted elsewhere (EC-3); "denied": the area is not available to this person (AC-2, AC-14).
 */
export type SaveWeightEntryResult =
  | { ok: true }
  | { ok: false; reason: 'invalid'; fieldErrors: WeightFieldErrors }
  | { ok: false; reason: 'exists'; weightKg: number }
  | { ok: false; reason: 'gone' | 'denied' | 'failed' }

export type WeightActionResult = { ok: true } | { ok: false; reason: 'invalid' | 'denied' | 'failed' }

function logFailure(action: string, error: unknown) {
  console.error(`[weight] ${action} failed`, { reason: error instanceof Error ? error.message : 'unknown' })
}

/** The area exists for this person: "ab 16" with the setting on (AC-2, AC-14). */
async function areaVisible(userId: string): Promise<boolean> {
  const access = await getWeightAccess(userId)
  return access !== null && weightVisible(access)
}

async function deviceToday(): Promise<string> {
  const store = await cookies()
  return todayIn(resolveTimeZone(store.get(TIME_ZONE_COOKIE)?.value))
}

/** New entry or change of an existing one (AC-4 to AC-6, AC-11, EC-1 to EC-5). */
export async function saveWeightEntry(input: unknown): Promise<SaveWeightEntryResult> {
  const user = await requireUser()
  try {
    if (!(await areaVisible(user.id))) return { ok: false, reason: 'denied' }
    const checked = validateWeightEntry(input, await deviceToday())
    if (!checked.ok) return { ok: false, reason: 'invalid', fieldErrors: checked.errors }

    const outcome = await saveOwnWeightEntry(checked.value)
    if (outcome.status === 'saved') {
      revalidatePath(WEIGHT_PATH)
      return { ok: true }
    }
    if (outcome.status === 'exists') return { ok: false, reason: 'exists', weightKg: outcome.weightKg }
    if (outcome.status === 'gone') {
      revalidatePath(WEIGHT_PATH)
      return { ok: false, reason: 'gone' }
    }
    return { ok: false, reason: 'invalid', fieldErrors: {} }
  } catch (error) {
    logFailure('saveWeightEntry', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Deletes one own entry by its day; one already gone counts as done (AC-12, EC-2). */
export async function deleteWeightEntry(input: unknown): Promise<WeightActionResult> {
  const user = await requireUser()
  const date = typeof input === 'object' && input !== null ? (input as { date?: unknown }).date : undefined
  if (!isIsoDate(date)) return { ok: false, reason: 'invalid' }
  try {
    if (!(await areaVisible(user.id))) return { ok: false, reason: 'denied' }
    await deleteOwnWeightEntry(user.id, date)
    revalidatePath(WEIGHT_PATH)
    return { ok: true }
  } catch (error) {
    logFailure('deleteWeightEntry', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Deletes every own entry (AC-13); repeating it is fine (EC-2). */
export async function deleteAllWeightEntries(): Promise<WeightActionResult> {
  const user = await requireUser()
  try {
    if (!(await areaVisible(user.id))) return { ok: false, reason: 'denied' }
    await deleteAllOwnWeightEntries(user.id)
    revalidatePath(WEIGHT_PATH)
    return { ok: true }
  } catch (error) {
    logFailure('deleteAllWeightEntries', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Shows or hides the area for the account (AC-14). Only "ab 16" has the setting at all (AC-2). */
export async function setWeightVisibility(input: unknown): Promise<WeightActionResult> {
  const user = await requireUser()
  const show = typeof input === 'object' && input !== null ? (input as { show?: unknown }).show : undefined
  if (typeof show !== 'boolean') return { ok: false, reason: 'invalid' }
  try {
    const access = await getWeightAccess(user.id)
    if (!canUseWeight(access?.ageBand)) return { ok: false, reason: 'denied' }
    await setOwnWeightVisibility(user.id, show)
    // The navigation of every protected page and the profile change with it.
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    logFailure('setWeightVisibility', error)
    return { ok: false, reason: 'failed' }
  }
}
