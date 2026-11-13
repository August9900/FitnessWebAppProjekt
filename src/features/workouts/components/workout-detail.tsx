'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PageHeader } from '@/components/shell/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  INTENSITY_LABELS,
  PLACE_LABELS,
  SAFETY_NOTE,
  durationLabel,
  equipmentText,
  guidedHref,
  workoutEquipment,
  type Workout,
} from '../workouts.rules'
import { ExerciseView } from './exercise-view'
import { SampleContentBadge } from './sample-content-badge'

/**
 * The workout detail: description, key facts, the safety note and the exercise sequence, each
 * with "Leichter" (AC-6, AC-7, AC-12). "Los geht's" carries the "leichter" choice in the address
 * to the guided view (design → Abläufe und Zugriffe).
 */
export function WorkoutDetail({ workout }: { workout: Workout }) {
  const [easier, setEasier] = useState<number[]>([])

  function setEasierAt(position: number, value: boolean) {
    setEasier((current) => (value ? [...current, position] : current.filter((p) => p !== position)))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={workout.title}
        description={workout.description}
        action={
          <Button asChild size="lg">
            <Link href={guidedHref(workout.id, easier)}>Los geht&apos;s</Link>
          </Button>
        }
      />

      <SampleContentBadge reviewStatus={workout.reviewStatus} />

      <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Dauer</dt>
        <dd>{durationLabel(workout.durationMinutes)}</dd>
        <dt className="text-muted-foreground">Intensität</dt>
        <dd>{INTENSITY_LABELS[workout.intensity]}</dd>
        <dt className="text-muted-foreground">Orte</dt>
        <dd>{workout.places.map((place) => PLACE_LABELS[place]).join(', ')}</dd>
        <dt className="text-muted-foreground">Ausstattung</dt>
        <dd>{equipmentText(workoutEquipment(workout))}</dd>
      </dl>

      <Alert className="max-w-xl">
        <AlertDescription className="text-base text-foreground">{SAFETY_NOTE}</AlertDescription>
      </Alert>

      <section aria-labelledby="uebungen-titel" className="space-y-4">
        <h2 id="uebungen-titel" className="text-xl font-semibold">
          Übungen
        </h2>
        <ol className="space-y-4">
          {workout.steps.map((step) => (
            <li key={step.position} className="rounded-lg border bg-card p-5">
              <p className="mb-1 text-sm text-muted-foreground">
                {step.position}. Übung
              </p>
              <ExerciseView
                step={step}
                easier={easier.includes(step.position)}
                onEasierChange={(value) => setEasierAt(step.position, value)}
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
