import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomWorkoutDetail } from '@/features/custom-workouts/components/custom-workout-detail'
import { getOwnCustomWorkout } from '@/features/custom-workouts/custom-workouts.data'
import { toWorkoutSteps } from '@/features/custom-workouts/custom-workouts.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { getAllExercises } from '@/features/workouts/workouts.data'

export const metadata: Metadata = { title: 'Eigenes Workout · PULSE' }

// One own workout (PROJ-10 AC-7, AC-8, AC-10). Someone else's or an unknown one → "Nicht
// gefunden" (AC-12, EC-6).
export default async function CustomWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ user }, { id }, exercises] = await Promise.all([requireCompletedProfile(), params, getAllExercises()])
  const workout = await getOwnCustomWorkout(user.id, id)
  const steps = workout ? toWorkoutSteps(workout.steps, exercises) : null
  if (!workout || !steps) notFound()

  return <CustomWorkoutDetail id={workout.id} name={workout.name} steps={steps} />
}
