import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { WorkoutList, type WorkoutListItem } from '@/features/workouts/components/workout-list'
import { getOfferedWorkouts } from '@/features/workouts/workouts.data'
import { fitOf, workoutEquipment } from '@/features/workouts/workouts.rules'

export const metadata: Metadata = { title: 'Bewegung · PULSE' }

// Reads the offered workouts and the person's current answers on every visit, so a changed
// profile shows up right away (EC-1). "Passt" and the reason are decided here (AC-2).
export default async function BewegungPage() {
  const [{ answers }, workouts] = await Promise.all([requireCompletedProfile(), getOfferedWorkouts()])

  const items: WorkoutListItem[] = workouts.map((workout) => ({
    id: workout.id,
    title: workout.title,
    durationMinutes: workout.durationMinutes,
    intensity: workout.intensity,
    places: workout.places,
    reviewStatus: workout.reviewStatus,
    equipment: workoutEquipment(workout),
    fit: fitOf(workout, answers),
  }))

  return (
    <div className="space-y-8">
      <PageHeader title="Bewegung" description="Kurze Workouts, die zu deinen Orten und deiner Ausstattung passen." />
      <WorkoutList items={items} />
    </div>
  )
}
