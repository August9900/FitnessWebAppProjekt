'use server'

// PROJ-10 server actions. Each checks the session and validates its input with the same schema the
// editor uses; the database checks ownership, limits and exercises once more (AC-6, AC-12). Every
// action returns a result instead of throwing; failures are logged with the action name and a
// database code only — no name, no steps, no user id (EC-5).
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/features/account/account.data'
import { createCustomWorkout, deleteCustomWorkout as deleteOwnCustomWorkout, replaceCustomWorkout } from './custom-workouts.data'
import { CUSTOM_TEXTS } from './custom-workouts.rules'
import { deleteCustomWorkoutSchema, fieldErrorsOf, saveCustomWorkoutSchema, type FieldErrors } from './custom-workouts.schema'

const BEWEGUNG_PATH = '/bewegung'

export type SaveIntent = 'create' | 'replace'

/**
 * "gone": deleted on another device in the meantime (EC-2); "limit": already 20 (AC-11, EC-3);
 * "invalid": field hints for the editor (AC-6).
 */
export type SaveCustomWorkoutResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'invalid'; fieldErrors: FieldErrors }
  | { ok: false; reason: 'gone' | 'limit' | 'failed' }

export type DeleteCustomWorkoutResult = { ok: true } | { ok: false; reason: 'invalid' | 'failed' }

function logFailure(action: string, error: unknown) {
  console.error(`[custom-workouts] ${action} failed`, { reason: error instanceof Error ? error.message : 'unknown' })
}

/** Creates a new own workout or replaces an existing one as a whole (AC-5, AC-9, EC-1, EC-4). */
export async function saveCustomWorkout(input: unknown, intent: SaveIntent): Promise<SaveCustomWorkoutResult> {
  const user = await requireUser()
  if (intent !== 'create' && intent !== 'replace') return { ok: false, reason: 'invalid', fieldErrors: {} }
  const parsed = saveCustomWorkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid', fieldErrors: fieldErrorsOf(parsed.error) }

  try {
    const outcome =
      intent === 'create' ? await createCustomWorkout(user.id, parsed.data) : await replaceCustomWorkout(user.id, parsed.data)
    if (outcome === 'saved') {
      revalidatePath(BEWEGUNG_PATH)
      return { ok: true, id: parsed.data.id }
    }
    if (outcome === 'unknown_exercise') return { ok: false, reason: 'invalid', fieldErrors: { steps: CUSTOM_TEXTS.unknownExercise } }
    if (outcome === 'invalid') return { ok: false, reason: 'invalid', fieldErrors: {} }
    return { ok: false, reason: outcome }
  } catch (error) {
    logFailure('saveCustomWorkout', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Deletes an own workout; one already gone counts as done (AC-10, EC-4). */
export async function deleteCustomWorkout(input: unknown): Promise<DeleteCustomWorkoutResult> {
  const user = await requireUser()
  const parsed = deleteCustomWorkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid' }

  try {
    await deleteOwnCustomWorkout(user.id, parsed.data.id)
    revalidatePath(BEWEGUNG_PATH)
    return { ok: true }
  } catch (error) {
    logFailure('deleteCustomWorkout', error)
    return { ok: false, reason: 'failed' }
  }
}
