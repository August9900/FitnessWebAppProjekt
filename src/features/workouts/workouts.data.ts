// Server-side access to the shared PROJ-4 content. Queries run with the person's own session,
// so Row Level Security applies: only signed-in people read, and only offered workouts (EC-2).
import 'server-only'
import { z } from 'zod'
import { PLACES } from '@/features/profile/profile.schema'
import { createClient } from '@/lib/supabase/server'
import { DURATIONS, EXERCISE_EQUIPMENT, INTENSITIES, REVIEW_STATUSES, STEP_MODES, type Exercise, type Workout } from './workouts.rules'

const ID_PATTERN = /^[a-z0-9_]{3,40}$/

/** One query: each workout with its steps and their exercises (no N+1). */
const COLUMNS = `
  id, title, description, duration_minutes, intensity, places, review_status,
  workout_steps (
    position, mode, amount,
    exercises ( id, name, instructions, easier_name, easier_instructions, equipment, is_pause )
  )
`

const exerciseRow = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string(),
  easier_name: z.string(),
  easier_instructions: z.string(),
  equipment: z.array(z.enum(EXERCISE_EQUIPMENT)),
  is_pause: z.boolean(),
})

const workoutRow = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration_minutes: z.literal(DURATIONS),
  intensity: z.enum(INTENSITIES),
  places: z.array(z.enum(PLACES)).min(1),
  review_status: z.enum(REVIEW_STATUSES),
  workout_steps: z.array(
    z.object({
      position: z.number().int(),
      mode: z.enum(STEP_MODES),
      amount: z.number().int().positive(),
      exercises: exerciseRow,
    })
  ),
})

/**
 * Database row → the rules' type. The database already enforces these values; a row that still
 * does not fit, or a workout without steps, is left out instead of breaking the view.
 */
export function toWorkout(row: unknown): Workout | null {
  const parsed = workoutRow.safeParse(row)
  if (!parsed.success || parsed.data.workout_steps.length === 0) return null
  const data = parsed.data
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    durationMinutes: data.duration_minutes,
    intensity: data.intensity,
    places: data.places,
    reviewStatus: data.review_status,
    steps: data.workout_steps
      .map((step) => ({
        position: step.position,
        mode: step.mode,
        amount: step.amount,
        exercise: {
          id: step.exercises.id,
          name: step.exercises.name,
          instructions: step.exercises.instructions,
          easierName: step.exercises.easier_name,
          easierInstructions: step.exercises.easier_instructions,
          equipment: step.exercises.equipment,
          isPause: step.exercises.is_pause,
        },
      }))
      .sort((a, b) => a.position - b.position),
  }
}

/** All offered workouts in list order (AC-1). Throws when reading fails — the error state shows. */
export async function getOfferedWorkouts(): Promise<Workout[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workouts')
    .select(COLUMNS)
    .eq('is_offered', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(`Workouts could not be read (${error.code ?? 'unknown'}).`)
  return (data ?? []).map(toWorkout).filter((workout): workout is Workout => workout !== null)
}

/** One offered workout, or null when it does not exist (anymore) (AC-6, EC-2). */
export async function getWorkout(id: string): Promise<Workout | null> {
  if (!ID_PATTERN.test(id)) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from('workouts').select(COLUMNS).eq('id', id).eq('is_offered', true).maybeSingle()
  if (error) throw new Error(`Workout could not be read (${error.code ?? 'unknown'}).`)
  return data ? toWorkout(data) : null
}

const EXERCISE_COLUMNS = 'id, name, instructions, easier_name, easier_instructions, equipment, is_pause'

/** Database row → exercise; a row that does not fit is left out instead of breaking the view. */
export function toExercise(row: unknown): Exercise | null {
  const parsed = exerciseRow.safeParse(row)
  if (!parsed.success) return null
  const data = parsed.data
  return {
    id: data.id,
    name: data.name,
    instructions: data.instructions,
    easierName: data.easier_name,
    easierInstructions: data.easier_instructions,
    equipment: data.equipment,
    isPause: data.is_pause,
  }
}

/** All exercises for the PROJ-9 library (AC-3). Throws when reading fails — the error state shows (EC-5). */
export async function getAllExercises(): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('exercises').select(EXERCISE_COLUMNS).order('name')
  if (error) throw new Error(`Exercises could not be read (${error.code ?? 'unknown'}).`)
  return (data ?? []).map(toExercise).filter((exercise): exercise is Exercise => exercise !== null)
}

/** One exercise, or null for an invalid or unknown id (PROJ-9 AC-7, EC-2). */
export async function getExercise(id: string): Promise<Exercise | null> {
  if (!ID_PATTERN.test(id)) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from('exercises').select(EXERCISE_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(`Exercise could not be read (${error.code ?? 'unknown'}).`)
  return data ? toExercise(data) : null
}
