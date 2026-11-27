import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExerciseDetail } from '@/features/exercises/components/exercise-detail'
import { FILTER_PARAM, parseFilter, workoutsUsing } from '@/features/exercises/exercises.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { getExercise, getOfferedWorkouts } from '@/features/workouts/workouts.data'

export const metadata: Metadata = { title: 'Übung · PULSE' }

// One exercise of the Übungsbibliothek (PROJ-9) with the offered workouts it occurs in (AC-7,
// AC-8, EC-3). Unknown or invalid id, or a pause, → "Nicht gefunden" (EC-2, AC-11).
export default async function UebungPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ answers }, { id }, query] = await Promise.all([requireCompletedProfile(), params, searchParams])
  const [exercise, workouts] = await Promise.all([getExercise(id), getOfferedWorkouts()])
  if (!exercise || exercise.isPause) notFound()

  return (
    <ExerciseDetail
      exercise={exercise}
      usedIn={workoutsUsing(exercise.id, workouts)}
      filter={parseFilter(query[FILTER_PARAM], answers)}
    />
  )
}
