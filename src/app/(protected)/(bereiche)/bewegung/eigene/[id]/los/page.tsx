import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/page-header'
import { getOwnCustomWorkout } from '@/features/custom-workouts/custom-workouts.data'
import { customDetailHref, toWorkoutSteps } from '@/features/custom-workouts/custom-workouts.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { GuidedWorkout } from '@/features/workouts/components/guided-workout'
import { getAllExercises } from '@/features/workouts/workouts.data'
import { EASIER_PARAM, parseEasier } from '@/features/workouts/workouts.rules'

export const metadata: Metadata = { title: 'Workout läuft · PULSE' }

// The guided run of an own workout (PROJ-10 AC-8): the same guided view as for offered workouts,
// with the "leichter" choice from the address; nothing is saved or counted.
export default async function CustomGuidedWorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ user }, { id }, query, exercises] = await Promise.all([requireCompletedProfile(), params, searchParams, getAllExercises()])
  const workout = await getOwnCustomWorkout(user.id, id)
  const steps = workout ? toWorkoutSteps(workout.steps, exercises) : null
  if (!workout || !steps) notFound()

  const easier = parseEasier(
    query[EASIER_PARAM],
    steps.map((step) => step.position)
  )

  return (
    <div className="space-y-8">
      <PageHeader title={workout.name} />
      <GuidedWorkout steps={steps} exitHref={customDetailHref(workout.id)} initialEasier={easier} />
    </div>
  )
}
