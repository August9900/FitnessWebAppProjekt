import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { CustomWorkoutList } from '@/features/custom-workouts/components/custom-workout-list'
import { listOwnCustomWorkouts } from '@/features/custom-workouts/custom-workouts.data'
import { LIBRARY_TEXTS, libraryHref } from '@/features/exercises/exercises.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { WorkoutList, type WorkoutListItem } from '@/features/workouts/components/workout-list'
import { getOfferedWorkouts } from '@/features/workouts/workouts.data'
import { fitOf, workoutEquipment } from '@/features/workouts/workouts.rules'

export const metadata: Metadata = { title: 'Bewegung · PULSE' }

// Reads the offered workouts and the person's current answers on every visit, so a changed
// profile shows up right away (EC-1). "Passt" and the reason are decided here (AC-2). Below the
// offer: the person's own workouts (PROJ-10 AC-1).
export default async function BewegungPage() {
  const [{ user, answers }, workouts] = await Promise.all([requireCompletedProfile(), getOfferedWorkouts()])
  const ownWorkouts = await listOwnCustomWorkouts(user.id)

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
      {/* PROJ-9 AC-1: a calm way to the exercise library, below the list. */}
      <p>
        <Link href={libraryHref()} className="inline-flex min-h-12 items-center font-medium underline-offset-4 hover:underline">
          {LIBRARY_TEXTS.lookUp} ›
        </Link>
      </p>
      <CustomWorkoutList workouts={ownWorkouts} />
    </div>
  )
}
