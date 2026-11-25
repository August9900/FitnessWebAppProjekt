'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { PageHeader } from '@/components/shell/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteAllWeightEntries, deleteWeightEntry } from '../weight.actions'
import {
  RANGE_LABELS,
  WEIGHT_RANGES,
  WEIGHT_TEXTS,
  deleteQuestion,
  entriesInRange,
  formatDate,
  formatWeight,
  weightHref,
  type WeightEntry,
  type WeightRange,
} from '../weight.rules'
import { WeightChart } from './weight-chart'
import { WeightEntryDialog } from './weight-entry-dialog'

type Editing = { open: false } | { open: true; entry: WeightEntry | null }

/**
 * The area „Gewicht“ (AC-4, AC-7 to AC-13): range choice, curve, the full list newest first with
 * „Ändern“ and „Löschen“, „Alle Einträge löschen“ and the empty state. Every delete asks first, is
 * locked while it runs (EC-2) and keeps its dialog open with a message when it fails (EC-4).
 */
export function WeightView({ entries, range, today }: { entries: WeightEntry[]; range: WeightRange; today: string }) {
  const [editing, setEditing] = useState<Editing>({ open: false })
  const [toDelete, setToDelete] = useState<string | 'all' | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  const openNew = () => setEditing({ open: true, entry: null })

  function confirmDelete() {
    if (pending || toDelete === null) return
    setFailed(false)
    startTransition(async () => {
      const result = toDelete === 'all' ? await deleteAllWeightEntries() : await deleteWeightEntry({ date: toDelete })
      if (result.ok) setToDelete(null)
      else setFailed(true)
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader title={WEIGHT_TEXTS.title} action={<Button onClick={openNew}>{WEIGHT_TEXTS.add}</Button>} />

      {entries.length === 0 ? (
        <section className="max-w-xl rounded-lg border bg-card p-6">
          <p className="text-base">{WEIGHT_TEXTS.empty}</p>
          <Button className="mt-6" variant="outline" onClick={openNew}>
            {WEIGHT_TEXTS.add}
          </Button>
        </section>
      ) : (
        <>
          <nav aria-label={WEIGHT_TEXTS.rangeLabel} className="flex flex-wrap gap-2">
            {WEIGHT_RANGES.map((option) => {
              const selected = option === range
              return (
                <Button key={option} asChild variant={selected ? 'default' : 'outline'}>
                  <Link href={weightHref(option)} aria-current={selected ? 'page' : undefined} scroll={false}>
                    {selected && <Check aria-hidden="true" />}
                    {RANGE_LABELS[option]}
                  </Link>
                </Button>
              )
            })}
          </nav>

          <WeightChart entries={entriesInRange(entries, range, today)} range={range} today={today} />

          <section aria-labelledby="eintraege" className="space-y-4">
            <h2 id="eintraege" className="text-xl font-semibold">
              {WEIGHT_TEXTS.listTitle}
            </h2>
            <ul className="divide-y rounded-lg border bg-card">
              {entries.map((entry) => (
                <li key={entry.date} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{formatDate(entry.date)}</p>
                    <p className="text-muted-foreground">{formatWeight(entry.weightKg)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing({ open: true, entry })}
                      aria-label={`${WEIGHT_TEXTS.edit}: ${formatDate(entry.date)}`}
                    >
                      {WEIGHT_TEXTS.edit}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFailed(false)
                        setToDelete(entry.date)
                      }}
                      aria-label={`${WEIGHT_TEXTS.delete}: ${formatDate(entry.date)}`}
                    >
                      {WEIGHT_TEXTS.delete}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setFailed(false)
                setToDelete('all')
              }}
            >
              {WEIGHT_TEXTS.deleteAll}
            </Button>
          </section>
        </>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && !pending && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toDelete === 'all' ? WEIGHT_TEXTS.deleteAllQuestion : toDelete ? deleteQuestion(toDelete) : ''}
            </AlertDialogTitle>
            <AlertDialogDescription className={toDelete === 'all' ? 'sr-only' : undefined}>
              Das lässt sich nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* The dialog stays open after a failed delete, so the message belongs here (EC-4). */}
          {failed && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{WEIGHT_TEXTS.failed}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{WEIGHT_TEXTS.cancel}</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={pending}>
              {WEIGHT_TEXTS.delete}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WeightEntryDialog
        open={editing.open}
        onOpenChange={(open) => !open && setEditing({ open: false })}
        entry={editing.open ? editing.entry : null}
        entries={entries}
        today={today}
      />
    </div>
  )
}
