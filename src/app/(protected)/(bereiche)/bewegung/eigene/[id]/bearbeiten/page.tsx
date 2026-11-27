import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shell/page-header'
import { CustomWorkoutEditor } from '@/features/custom-workouts/components/custom-workout-editor'
import { getOwnCustomWorkout } from '@/features/custom-workouts/custom-workouts.data'
import { CUSTOM_TEXTS, customDetailHref } from '@/features/custom-workouts/custom-workouts.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { getAllExercises } from '@/features/workouts/workouts.data'

export const metadata: Metadata = { title: 'Workout bearbeiten · PULSE' }

// Editing an own workout (PROJ-10 AC-9): saving replaces it as a whole (EC-1). Someone else's or
// an unknown one → "Nicht gefunden" (AC-12, EC-6).
export default async function EditCustomWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ user, answers }, { id }, exercises] = await Promise.all([requireCompletedProfile(), params, getAllExercises()])
  const workout = await getOwnCustomWorkout(user.id, id)
  if (!workout) notFound()

  return (
    <div className="space-y-8">
      <PageHeader title={CUSTOM_TEXTS.editTitle} />
      <CustomWorkoutEditor
        intent="replace"
        initial={workout}
        exercises={exercises}
        profile={answers}
        cancelHref={customDetailHref(workout.id)}
      />
    </div>
  )
}
