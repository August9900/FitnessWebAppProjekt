'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DURATION_FILTERS,
  INTENSITY_LABELS,
  PLACE_LABELS,
  durationFilterLabel,
  durationLabel,
  equipmentText,
  filterByDuration,
  type DurationFilter,
  type ExerciseEquipment,
  type Fit,
  type Workout,
} from '../workouts.rules'
import { SampleContentBadge } from '@/components/content/sample-content-badge'

/** What a card needs; "passt" and the reason are decided on the server (AC-2). */
export type WorkoutListItem = Pick<Workout, 'id' | 'title' | 'durationMinutes' | 'intensity' | 'places' | 'reviewStatus'> & {
  equipment: ExerciseEquipment[]
  fit: Fit
}

/**
 * The Bewegung overview: duration filter and "Alle Workouts anzeigen", applied right here in the
 * browser without a new request (AC-3, AC-4), with a calm way out when nothing is left (AC-5).
 */
export function WorkoutList({ items }: { items: WorkoutListItem[] }) {
  const [duration, setDuration] = useState<DurationFilter>('all')
  const [showAll, setShowAll] = useState(false)
  const showAllId = useId()

  const fitting = items.filter((item) => item.fit.fits)
  const visible = filterByDuration(showAll ? items : fitting, duration)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div role="group" aria-label="Dauer" className="flex flex-wrap gap-2">
          {DURATION_FILTERS.map((filter) => (
            <Button
              key={filter}
              type="button"
              variant={duration === filter ? 'default' : 'outline'}
              aria-pressed={duration === filter}
              onClick={() => setDuration(filter)}
            >
              {durationFilterLabel(filter)}
            </Button>
          ))}
        </div>
        <div className="flex min-h-12 items-center gap-3">
          <Switch id={showAllId} checked={showAll} onCheckedChange={setShowAll} />
          <Label htmlFor={showAllId} className="cursor-pointer py-3 text-base">
            Alle Workouts anzeigen
          </Label>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length === 1 ? '1 Workout' : `${visible.length} Workouts`}
      </p>

      {visible.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <li key={item.id}>
              <WorkoutCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          noneOffered={items.length === 0}
          noneFitting={!showAll && fitting.length === 0}
          onShowAll={() => setShowAll(true)}
          onAllDurations={() => setDuration('all')}
        />
      )}
    </div>
  )
}

function WorkoutCard({ item }: { item: WorkoutListItem }) {
  return (
    <Card className="relative h-full p-5 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:bg-secondary/40">
      <h2 className="text-lg font-semibold">
        {/* The link covers the whole card; the focus ring sits on the card. */}
        <Link href={`/bewegung/${item.id}`} className="outline-none after:absolute after:inset-0 after:content-['']">
          {item.title}
        </Link>
      </h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Dauer</dt>
        <dd>{durationLabel(item.durationMinutes)}</dd>
        <dt className="text-muted-foreground">Intensität</dt>
        <dd>{INTENSITY_LABELS[item.intensity]}</dd>
        <dt className="text-muted-foreground">Orte</dt>
        <dd>{item.places.map((place) => PLACE_LABELS[place]).join(', ')}</dd>
        <dt className="text-muted-foreground">Ausstattung</dt>
        <dd>{equipmentText(item.equipment)}</dd>
      </dl>
      {!item.fit.fits && <p className="mt-3 text-sm font-medium">Passt gerade nicht: {item.fit.reason}</p>}
      <div className="mt-3">
        <SampleContentBadge reviewStatus={item.reviewStatus} />
      </div>
    </Card>
  )
}

function EmptyState({
  noneOffered,
  noneFitting,
  onShowAll,
  onAllDurations,
}: {
  noneOffered: boolean
  noneFitting: boolean
  onShowAll: () => void
  onAllDurations: () => void
}) {
  if (noneOffered) {
    return (
      <section className="max-w-xl rounded-lg border bg-card p-6">
        <p>Gerade gibt es hier noch keine Workouts.</p>
        <Button asChild className="mt-6">
          <Link href="/heute">Zu Heute</Link>
        </Button>
      </section>
    )
  }

  if (noneFitting) {
    return (
      <section className="max-w-xl rounded-lg border bg-card p-6">
        <p>Zu deinen Angaben passt gerade kein Workout.</p>
        <p className="mt-2 text-muted-foreground">Du kannst dir trotzdem alle ansehen – vielleicht bist du heute woanders.</p>
        <Button type="button" className="mt-6" onClick={onShowAll}>
          Alle Workouts anzeigen
        </Button>
      </section>
    )
  }

  return (
    <section className="max-w-xl rounded-lg border bg-card p-6">
      <p>Für diese Dauer gibt es gerade kein Workout.</p>
      <Button type="button" className="mt-6" onClick={onAllDurations}>
        Alle Dauern anzeigen
      </Button>
    </section>
  )
}
