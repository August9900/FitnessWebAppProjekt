import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WorkoutDetail } from '@/features/workouts/components/workout-detail'
import { getWorkout } from '@/features/workouts/workouts.data'

export const metadata: Metadata = { title: 'Workout · PULSE' }

// Unknown or no longer offered workouts end in this segment's not-found view (EC-2).
export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workout = await getWorkout(id)
  if (!workout) notFound()
  return <WorkoutDetail workout={workout} />
}
