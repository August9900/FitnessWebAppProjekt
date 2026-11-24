// The Wochenblick (PROJ-8): one calendar week, day by day, with what the person started or
// managed — no numbers, goals, streaks or gap markers (AC-1 to AC-14). A read-only server view:
// paging is plain links, titles open the detail view, nothing can be marked here (AC-8).
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { WEEK_TEXTS, type Week } from '../week.rules'

export function WeekView({ week }: { week: Week }) {
  const title = week.heading ? `${week.heading} · ${week.range}` : week.range

  return (
    <div className="space-y-8">
      <PageHeader title="Wochenblick" />

      <section aria-labelledby="week-title" className="space-y-6">
        <div className="space-y-2">
          <h2 id="week-title" className="text-xl font-semibold">
            {title}
          </h2>
          {week.summary && <p>{week.summary}</p>}
        </div>

        {(week.previousHref || week.nextHref) && (
          <nav aria-label="Wochen" className="flex flex-wrap gap-2">
            {week.previousHref && (
              <Button asChild variant="outline">
                <Link href={week.previousHref}>
                  <ChevronLeft aria-hidden="true" />
                  {WEEK_TEXTS.previousLink}
                </Link>
              </Button>
            )}
            {week.nextHref && (
              <Button asChild variant="outline">
                <Link href={week.nextHref}>
                  {WEEK_TEXTS.nextLink}
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </nav>
        )}

        <ol className="divide-y rounded-lg border bg-card">
          {week.days.map((day) => (
            <li
              key={day.date}
              aria-current={day.isToday ? 'date' : undefined}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:gap-6"
            >
              <p className="flex shrink-0 items-center gap-2 font-medium sm:w-28">
                <span>{day.label}</span>
                {day.isToday && (
                  <span className="rounded-full border border-primary px-2 text-sm font-semibold">{WEEK_TEXTS.today}</span>
                )}
              </p>

              {day.entries.length > 0 ? (
                <ul className="min-w-0 flex-1 space-y-2">
                  {day.entries.map((entry) => (
                    <li key={entry.id} className="[overflow-wrap:anywhere]">
                      {entry.href ? (
                        <Link href={entry.href} className="font-medium underline-offset-4 hover:underline">
                          {entry.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{entry.title}</span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {' · '}
                        {entry.kindLabel} · {entry.statusLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  <span aria-hidden="true">{WEEK_TEXTS.noEntry}</span>
                  <span className="sr-only">Kein Eintrag</span>
                </p>
              )}
            </li>
          ))}
        </ol>

        {week.showEmptyHint && (
          <div className="max-w-xl space-y-4 rounded-lg border bg-card p-6">
            <p>{WEEK_TEXTS.emptyCurrent}</p>
            <Button asChild>
              <Link href="/heute">{WEEK_TEXTS.toToday}</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
