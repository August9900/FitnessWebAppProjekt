import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'
import { CustomWorkoutEditor } from '@/features/custom-workouts/components/custom-workout-editor'
import { CUSTOM_TEXTS } from '@/features/custom-workouts/custom-workouts.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { getAllExercises } from '@/features/workouts/workouts.data'

export const metadata: Metadata = { title: 'Neues Workout · PULSE' }

// A new own workout (PROJ-10 AC-2 to AC-6). The id is chosen here, once per visit, so a double
// "Speichern" creates one workout only (EC-4).
export default async function NewCustomWorkoutPage() {
  const [{ answers }, exercises] = await Promise.all([requireCompletedProfile(), getAllExercises()])

  return (
    <div className="space-y-8">
      <PageHeader title={CUSTOM_TEXTS.newTitle} />
      <CustomWorkoutEditor
        intent="create"
        initial={{ id: crypto.randomUUID(), name: '', steps: [] }}
        exercises={exercises}
        profile={answers}
        cancelHref="/bewegung"
      />
    </div>
  )
}
