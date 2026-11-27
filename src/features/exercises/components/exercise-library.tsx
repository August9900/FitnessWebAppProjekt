// The Übungsbibliothek list (PROJ-9): filters as plain links (the choice lives in the address and
// survives going back, AC-6), all exercises alphabetically with their equipment (AC-3 to AC-5),
// and a calm way out when a filter leaves nothing (EC-1). A server view without state.
import { Check } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/features/workouts/workouts.rules'
import {
  FILTER_LABELS,
  LIBRARY_TEXTS,
  exerciseEquipmentText,
  exerciseHref,
  libraryHref,
  type ExerciseFilter,
} from '../exercises.rules'

export function ExerciseLibrary({
  exercises,
  filter,
  filters,
}: {
  /** Already filtered and sorted. */
  exercises: Exercise[]
  filter: ExerciseFilter
  /** The filters on offer for this person. */
  filters: ExerciseFilter[]
}) {
  return (
    <div className="space-y-8">
      <PageHeader title={LIBRARY_TEXTS.title} />

      <nav aria-label="Filter" className="flex flex-wrap gap-2">
        {filters.map((option) => {
          const selected = option === filter
          return (
            <Button key={option} asChild variant={selected ? 'default' : 'outline'}>
              <Link href={libraryHref(option)} aria-current={selected ? 'page' : undefined}>
                {selected && <Check aria-hidden="true" />}
                {FILTER_LABELS[option]}
              </Link>
            </Button>
          )
        })}
      </nav>

      {exercises.length > 0 ? (
        <ul className="divide-y rounded-lg border bg-card">
          {exercises.map((exercise) => (
            <li key={exercise.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <Link href={exerciseHref(exercise.id, filter)} className="font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline">
                {exercise.name}
              </Link>
              <span className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{exerciseEquipmentText(exercise)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="max-w-xl space-y-4 rounded-lg border bg-card p-6">
          <p>{LIBRARY_TEXTS.noMatch}</p>
          <Button asChild variant="outline">
            <Link href={libraryHref()}>{LIBRARY_TEXTS.showAll}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
