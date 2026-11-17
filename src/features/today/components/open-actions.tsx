'use client'

// Open actions on "Heute" (PROJ-6): what the person started in the last 12 hours, with
// "Weitermachen", "Geschafft" and "Heute nicht", and the latest marking with "Rückgängig" until the
// next check-in (AC-13 to AC-15). The page passes the server state; every server action refreshes
// "Heute", so after a marking the props show the actual state — also when another device was first
// (EC-5). No points, streaks, counters or reproach (AC-14).
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { concludeAction, undoConclusion } from '../today.actions'
import { CONCLUSION_MESSAGES, TODAY_MESSAGES, type Kind } from '../today.rules'

export type OpenActionItem = {
  id: string
  kind: Kind
  /** Null when the content is no longer offered. */
  title: string | null
  /** The guided run or the meal detail; opening it starts nothing again (AC-13). */
  href: string
}

export type ConclusionItem = {
  id: string
  kind: Kind
  title: string | null
  status: 'done' | 'skipped'
}

const FALLBACK_TITLES = { move: 'Dein Workout', eat: 'Deine Mahlzeit' } satisfies Record<Kind, string>

function titleOf(item: { kind: Kind; title: string | null }): string {
  return item.title ?? FALLBACK_TITLES[item.kind]
}

type Failure = { actionId: string; retry: () => void }

export function OpenActions({
  openActions,
  lastConclusion,
}: {
  openActions: OpenActionItem[]
  lastConclusion: ConclusionItem | null
}) {
  const [pending, startTransition] = useTransition()
  const [failure, setFailure] = useState<Failure | null>(null)

  function run(actionId: string, call: () => Promise<{ ok: boolean; reason?: string }>) {
    // One change at a time: buttons are locked while a call runs (EC-4).
    if (pending) return
    setFailure(null)
    startTransition(async () => {
      const result = await call()
      // "not_possible" means the state already moved on; the refreshed page shows it (AC-15, EC-5).
      if (!result.ok && result.reason !== 'not_possible') {
        setFailure({ actionId, retry: () => run(actionId, call) })
      }
    })
  }

  const conclude = (actionId: string, status: 'done' | 'skipped') =>
    run(actionId, () => concludeAction({ actionId, status }))
  const undo = (actionId: string) => run(actionId, () => undoConclusion({ actionId }))

  if (openActions.length === 0 && !lastConclusion) return null

  const errorFor = (actionId: string) =>
    failure?.actionId === actionId ? (
      <Alert variant="destructive" role="alert">
        <AlertDescription className="space-y-3">
          <span className="block">{TODAY_MESSAGES.failed}</span>
          <Button type="button" variant="outline" onClick={failure.retry} disabled={pending}>
            Nochmal versuchen
          </Button>
        </AlertDescription>
      </Alert>
    ) : null

  return (
    <section aria-labelledby="open-actions-title" className="space-y-3">
      <h2 id="open-actions-title" className="text-xl font-semibold">
        Begonnen
      </h2>

      <div role="status" aria-live="polite">
        {lastConclusion && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <p className="flex items-center gap-2 font-medium">
              <Check aria-hidden="true" className="size-5 shrink-0" />
              <span>{CONCLUSION_MESSAGES[lastConclusion.status]}</span>
            </p>
            <p className="text-sm text-muted-foreground">{titleOf(lastConclusion)}</p>
            <Button type="button" variant="ghost" onClick={() => undo(lastConclusion.id)} disabled={pending}>
              Rückgängig
            </Button>
            {errorFor(lastConclusion.id)}
          </div>
        )}
      </div>

      {openActions.length > 0 && (
        <ul className="space-y-3">
          {openActions.map((action) => (
            <li key={action.id}>
              <Card>
                <CardContent className="space-y-4 p-4">
                  <p className="font-medium [overflow-wrap:anywhere]">{titleOf(action)}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button asChild variant="secondary">
                      <Link href={action.href}>Weitermachen</Link>
                    </Button>
                    <Button type="button" variant="outline" onClick={() => conclude(action.id, 'done')} disabled={pending}>
                      Geschafft
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => conclude(action.id, 'skipped')} disabled={pending}>
                      Heute nicht
                    </Button>
                  </div>
                  {errorFor(action.id)}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
