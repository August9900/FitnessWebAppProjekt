// "Deine Workouts" on Bewegung (PROJ-10 AC-1): the person's own workouts alphabetically with their
// number of exercises, a calm empty state and the way to a new one. A server view without state.
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  CUSTOM_TEXTS,
  customDetailHref,
  newCustomHref,
  sortSummaries,
  stepCountLabel,
  type CustomWorkoutSummary,
} from '../custom-workouts.rules'

export function CustomWorkoutList({ workouts }: { workouts: CustomWorkoutSummary[] }) {
  const sorted = sortSummaries(workouts)

  return (
    <section aria-labelledby="custom-workouts-title" className="space-y-4">
      <h2 id="custom-workouts-title" className="text-xl font-semibold">
        {CUSTOM_TEXTS.section}
      </h2>

      {sorted.length > 0 ? (
        <ul className="divide-y rounded-lg border bg-card">
          {sorted.map((workout) => (
            <li key={workout.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <Link href={customDetailHref(workout.id)} className="font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline">
                {workout.name}
              </Link>
              <span className="text-sm text-muted-foreground">{stepCountLabel(workout.stepCount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{CUSTOM_TEXTS.empty}</p>
      )}

      <Button asChild variant="outline">
        <Link href={newCustomHref()}>{CUSTOM_TEXTS.newWorkout}</Link>
      </Button>
    </section>
  )
}
