'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SampleContentBadge } from '@/components/content/sample-content-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  EFFORT_FILTERS,
  EFFORT_LABELS,
  MEAL_DIET_LABELS,
  effortFilterLabel,
  filterByEffort,
  minutesLabel,
  type EffortFilter,
  type Meal,
} from '../meals.rules'

/** What a card needs. Only meals that fit the person's diet arrive here (AC-2, decided on the server). */
export type MealListItem = Pick<Meal, 'id' | 'title' | 'diet' | 'effort' | 'minutes' | 'reviewStatus'>

/**
 * The Essen overview: effort filter applied right here in the browser without a new request
 * (AC-3), with a calm way out when nothing is left (AC-4).
 */
export function MealList({ items }: { items: MealListItem[] }) {
  const [effort, setEffort] = useState<EffortFilter>('all')
  const visible = filterByEffort(items, effort)

  if (items.length === 0) {
    return (
      <section className="max-w-xl rounded-lg border bg-card p-6">
        <p>Zu deiner Essensweise gibt es gerade keine Mahlzeit.</p>
        <Button asChild className="mt-6">
          <Link href="/heute">Zu Heute</Link>
        </Button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Aufwand" className="flex flex-wrap gap-2">
        {EFFORT_FILTERS.map((filter) => (
          <Button
            key={filter}
            type="button"
            variant={effort === filter ? 'default' : 'outline'}
            aria-pressed={effort === filter}
            onClick={() => setEffort(filter)}
          >
            {effortFilterLabel(filter)}
          </Button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length === 1 ? '1 Mahlzeit' : `${visible.length} Mahlzeiten`}
      </p>

      {visible.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <li key={item.id}>
              <MealCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <section className="max-w-xl rounded-lg border bg-card p-6">
          <p>Für diesen Aufwand gibt es gerade keine Mahlzeit.</p>
          <Button type="button" className="mt-6" onClick={() => setEffort('all')}>
            Alle Aufwandsstufen anzeigen
          </Button>
        </section>
      )}
    </div>
  )
}

function MealCard({ item }: { item: MealListItem }) {
  return (
    <Card className="relative h-full p-5 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:bg-secondary/40">
      <h2 className="text-lg font-semibold">
        {/* The link covers the whole card; the focus ring sits on the card. */}
        <Link href={`/essen/${item.id}`} className="outline-none after:absolute after:inset-0 after:content-['']">
          {item.title}
        </Link>
      </h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Aufwand</dt>
        <dd>{EFFORT_LABELS[item.effort]}</dd>
        <dt className="text-muted-foreground">Zeit</dt>
        <dd>{minutesLabel(item.minutes)}</dd>
        <dt className="text-muted-foreground">Essensweise</dt>
        <dd>{MEAL_DIET_LABELS[item.diet]}</dd>
      </dl>
      <div className="mt-3">
        <SampleContentBadge reviewStatus={item.reviewStatus} />
      </div>
    </Card>
  )
}
