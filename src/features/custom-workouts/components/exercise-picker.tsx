'use client'

// "Übung hinzufügen" (PROJ-10 AC-2, AC-4): all library exercises alphabetically with their
// equipment and the same filters as the library (PROJ-9). The dialog stays open after
// "Hinzufügen", so several exercises — the same one again, too — can be added in a row.
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  FILTER_LABELS,
  LIBRARY_TEXTS,
  exerciseEquipmentText,
  filterExercises,
  offeredFilters,
  type ExerciseFilter,
} from '@/features/exercises/exercises.rules'
import type { ProfileAnswers } from '@/features/profile/profile.rules'
import type { Exercise } from '@/features/workouts/workouts.rules'
import { CUSTOM_TEXTS } from '../custom-workouts.rules'

export function ExercisePicker({
  exercises,
  profile,
  onAdd,
  disabled = false,
}: {
  exercises: Exercise[]
  profile: Pick<ProfileAnswers, 'places' | 'homeEquipment'>
  onAdd: (exerciseId: string) => void
  /** E.g. while saving or with the maximum of exercises reached. */
  disabled?: boolean
}) {
  const [filter, setFilter] = useState<ExerciseFilter>('alle')
  const shown = filterExercises(exercises, filter, profile)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          {CUSTOM_TEXTS.addExercise}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{CUSTOM_TEXTS.addExercise}</DialogTitle>
          <DialogDescription>Neue Übungen kommen ans Ende der Folge.</DialogDescription>
        </DialogHeader>

        <div role="group" aria-label="Filter" className="flex flex-wrap gap-2">
          {offeredFilters(profile).map((option) => {
            const selected = option === filter
            return (
              <Button
                key={option}
                type="button"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                onClick={() => setFilter(option)}
              >
                {selected && <Check aria-hidden="true" />}
                {FILTER_LABELS[option]}
              </Button>
            )
          })}
        </div>

        {shown.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {shown.map((exercise) => (
              <li key={exercise.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium [overflow-wrap:anywhere]">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">{exerciseEquipmentText(exercise)}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onAdd(exercise.id)}
                  aria-label={`${CUSTOM_TEXTS.add}: ${exercise.name}`}
                >
                  {CUSTOM_TEXTS.add}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{LIBRARY_TEXTS.noMatch}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
