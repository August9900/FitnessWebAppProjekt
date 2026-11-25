// Server-side access to the person's PROJ-10 own workouts. Every query runs with the person's own
// session, so Row Level Security and the column grants apply (AC-12); the user id is filtered in
// addition, never instead. The database checks the limits, the exercises and the 20-workouts cap.
import 'server-only'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { STEP_MODES } from '@/features/workouts/workouts.rules'
import type { CustomStep, CustomWorkout, CustomWorkoutSummary } from './custom-workouts.rules'
import type { SaveCustomWorkoutInput } from './custom-workouts.schema'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Postgres / own trigger codes the save maps to results (design → Fehler an den Schnittstellen). */
const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'
const UNKNOWN_EXERCISE = 'PW001'
const LIMIT_REACHED = 'PW002'

export type CreateOutcome = 'saved' | 'limit' | 'unknown_exercise' | 'invalid'
export type ReplaceOutcome = 'saved' | 'gone' | 'unknown_exercise' | 'invalid'

/** Reading or writing failed (EC-5). The message carries the database code only, never name or steps. */
export class CustomWorkoutDataError extends Error {}

function failed(what: string, error: { code?: string } | null | undefined): CustomWorkoutDataError {
  return new CustomWorkoutDataError(`${what} (${error?.code ?? 'unknown'}).`)
}

const storedStep = z.object({ exercise_id: z.string(), mode: z.enum(STEP_MODES), amount: z.number().int() })
const storedRow = z.object({ id: z.string(), name: z.string(), steps: z.array(storedStep).min(1) })

function toSteps(steps: z.infer<typeof storedStep>[]): CustomStep[] {
  return steps.map((step) => ({ exerciseId: step.exercise_id, mode: step.mode, amount: step.amount }))
}

function fromSteps(steps: CustomStep[]) {
  return steps.map((step) => ({ exercise_id: step.exerciseId, mode: step.mode, amount: step.amount }))
}

/** Database row → own workout; a row that does not fit is null instead of breaking the view. */
export function toCustomWorkout(row: unknown): CustomWorkout | null {
  const parsed = storedRow.safeParse(row)
  if (!parsed.success) return null
  return { id: parsed.data.id, name: parsed.data.name, steps: toSteps(parsed.data.steps) }
}

/** The person's own workouts for the overview (AC-1). Sorting happens in the rules. */
export async function listOwnCustomWorkouts(userId: string): Promise<CustomWorkoutSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('custom_workouts').select('id, name, steps').eq('user_id', userId)
  if (error) throw failed('Own workouts could not be read', error)
  return (data ?? [])
    .map(toCustomWorkout)
    .filter((workout): workout is CustomWorkout => workout !== null)
    .map((workout) => ({ id: workout.id, name: workout.name, stepCount: workout.steps.length }))
}

/** One of the person's own workouts, or null when it is unknown, someone else's or the id is invalid (AC-12, EC-6). */
export async function getOwnCustomWorkout(userId: string, id: string): Promise<CustomWorkout | null> {
  if (!UUID_PATTERN.test(id)) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_workouts')
    .select('id, name, steps')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw failed('Own workout could not be read', error)
  return data ? toCustomWorkout(data) : null
}

/**
 * Creates the own workout with the id the editor chose (AC-5). The same id again — a double tap —
 * counts as already saved (EC-4); the database refuses a 21st (AC-11, EC-3) and unknown exercises.
 */
export async function createCustomWorkout(userId: string, input: SaveCustomWorkoutInput): Promise<CreateOutcome> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('custom_workouts')
    .insert({ id: input.id, user_id: userId, name: input.name, steps: fromSteps(input.steps) })
  if (!error) return 'saved'
  if (error.code === UNIQUE_VIOLATION || error.code === LIMIT_REACHED) {
    // A repeated save of a workout that already exists is not a second one.
    if (await getOwnCustomWorkout(userId, input.id)) return 'saved'
    if (error.code === LIMIT_REACHED) return 'limit'
  }
  if (error.code === UNKNOWN_EXERCISE) return 'unknown_exercise'
  if (error.code === CHECK_VIOLATION) return 'invalid'
  throw failed('Own workout could not be saved', error)
}

/**
 * Replaces name and sequence in one change — the last save wins as a whole (AC-9, EC-1). "gone" when
 * no row changed: deleted in the meantime or not the person's (EC-2).
 */
export async function replaceCustomWorkout(userId: string, input: SaveCustomWorkoutInput): Promise<ReplaceOutcome> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_workouts')
    .update({ name: input.name, steps: fromSteps(input.steps) })
    .eq('id', input.id)
    .eq('user_id', userId)
    .select('id')
  if (error?.code === UNKNOWN_EXERCISE) return 'unknown_exercise'
  if (error?.code === CHECK_VIOLATION) return 'invalid'
  if (error) throw failed('Own workout could not be saved', error)
  return data && data.length === 1 ? 'saved' : 'gone'
}

/** Deletes an own workout; one already gone counts as done (AC-10, EC-4). */
export async function deleteCustomWorkout(userId: string, id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('custom_workouts').delete().eq('id', id).eq('user_id', userId)
  if (error) throw failed('Own workout could not be deleted', error)
}

export type CustomWorkoutExportRow = {
  id: string
  name: string
  steps: { exercise_id: string; mode: string; amount: number }[]
  created_at: string
  updated_at: string
}

/** All own workouts as stored, oldest first, for the data export (AC-13). Throws instead of a partial export. */
export async function getOwnCustomWorkoutsExport(userId: string): Promise<CustomWorkoutExportRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_workouts')
    .select('id, name, steps, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw failed('Own workouts could not be read', error)
  return (data ?? []) as CustomWorkoutExportRow[]
}
