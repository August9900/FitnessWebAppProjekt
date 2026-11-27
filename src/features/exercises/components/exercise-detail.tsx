// One exercise in the Übungsbibliothek (PROJ-9): instructions, the easier variant, equipment, the
// safety note and the offered workouts it occurs in (AC-7, AC-8). Read-only: nothing here starts
// or begins anything (AC-10). "Alle Übungen" returns to the list with the earlier filter (AC-9).
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { SAFETY_NOTE, type Exercise } from '@/features/workouts/workouts.rules'
import { LIBRARY_TEXTS, exerciseEquipmentText, libraryHref, type ExerciseFilter, type UsedInWorkout } from '../exercises.rules'

export function ExerciseDetail({
  exercise,
  usedIn,
  filter,
}: {
  exercise: Exercise
  usedIn: UsedInWorkout[]
  filter: ExerciseFilter
}) {
  return (
    <div className="space-y-8">
      <PageHeader title={exercise.name} />

      <section className="max-w-[70ch] space-y-6">
        <p className="leading-relaxed">{exercise.instructions}</p>

        <div className="space-y-2">
          <h2 className="text-base font-semibold">
            {LIBRARY_TEXTS.easier}: {exercise.easierName}
          </h2>
          <p className="leading-relaxed">{exercise.easierInstructions}</p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">{LIBRARY_TEXTS.equipment}</dt>
          <dd className="[overflow-wrap:anywhere]">{exerciseEquipmentText(exercise)}</dd>
        </dl>

        <Alert>
          <AlertDescription className="text-base text-foreground">{SAFETY_NOTE}</AlertDescription>
        </Alert>
      </section>

      <section aria-labelledby="used-in-title" className="space-y-3">
        <h2 id="used-in-title" className="text-xl font-semibold">
          {LIBRARY_TEXTS.usedIn}
        </h2>
        {usedIn.length > 0 ? (
          <ul className="divide-y rounded-lg border bg-card">
            {usedIn.map((workout) => (
              <li key={workout.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:justify-between">
                <Link href={workout.href} className="font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline">
                  {workout.title}
                </Link>
                <span className="text-sm text-muted-foreground">{workout.duration}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{LIBRARY_TEXTS.usedInNone}</p>
        )}
      </section>

      <Button asChild variant="outline">
        <Link href={libraryHref(filter)}>
          <ChevronLeft aria-hidden="true" />
          {LIBRARY_TEXTS.backToList}
        </Link>
      </Button>
    </div>
  )
}
