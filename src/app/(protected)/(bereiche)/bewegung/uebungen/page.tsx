import type { Metadata } from 'next'
import { ExerciseLibrary } from '@/features/exercises/components/exercise-library'
import { FILTER_PARAM, filterExercises, offeredFilters, parseFilter } from '@/features/exercises/exercises.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { getAllExercises } from '@/features/workouts/workouts.data'

export const metadata: Metadata = { title: 'Übungen · PULSE' }

// The Übungsbibliothek (PROJ-9): all exercises, filtered by the address and the person's current
// answers on every visit (AC-3 to AC-6, EC-4). Reading fails → the area's error boundary (EC-5).
export default async function UebungenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ answers }, exercises, params] = await Promise.all([requireCompletedProfile(), getAllExercises(), searchParams])
  const filter = parseFilter(params[FILTER_PARAM], answers)

  return (
    <ExerciseLibrary exercises={filterExercises(exercises, filter, answers)} filter={filter} filters={offeredFilters(answers)} />
  )
}
