import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/page-header'
import { GuidedWorkout } from '@/features/workouts/components/guided-workout'
import { getWorkout } from '@/features/workouts/workouts.data'
import { EASIER_PARAM, parseEasier } from '@/features/workouts/workouts.rules'

export const metadata: Metadata = { title: 'Workout läuft · PULSE' }

// The guided view always starts at the first exercise (EC-3); the only input is the "leichter"
// choice from the address, where positions the workout does not have are ignored (AC-7, AC-8).
export default async function GuidedWorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const workout = await getWorkout(id)
  if (!workout) notFound()

  const easier = parseEasier(
    query[EASIER_PARAM],
    workout.steps.map((step) => step.position)
  )

  return (
    <div className="space-y-8">
      <PageHeader title={workout.title} />
      <GuidedWorkout workout={workout} initialEasier={easier} />
    </div>
  )
}
