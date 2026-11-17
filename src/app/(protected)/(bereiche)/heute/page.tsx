import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { OpenActions } from '@/features/today/components/open-actions'
import { TodayFlow } from '@/features/today/components/today-flow'
import { getLastAnswers, getOpenActions, getUndoableConclusion } from '@/features/today/today.data'
import { continueHref, placesToAsk } from '@/features/today/today.rules'

export const metadata: Metadata = { title: 'Heute · PULSE' }

// "Heute" (PROJ-6): open actions and the latest marking on top, below the daily decision
// (AC-1, AC-13). Reading fails → the error boundary of the protected area shows.
export default async function TodayPage() {
  const { user, answers } = await requireCompletedProfile()
  const [lastAnswers, openActions, lastConclusion] = await Promise.all([
    getLastAnswers(user.id),
    getOpenActions(user.id, new Date()),
    getUndoableConclusion(user.id),
  ])

  return (
    <div className="space-y-8">
      <PageHeader title="Heute" />
      <OpenActions
        openActions={openActions.map((action) => ({
          id: action.id,
          kind: action.kind,
          title: action.title,
          href: continueHref(action.kind, action.itemId),
        }))}
        lastConclusion={
          lastConclusion && lastConclusion.status !== 'started'
            ? { id: lastConclusion.id, kind: lastConclusion.kind, title: lastConclusion.title, status: lastConclusion.status }
            : null
        }
      />
      <TodayFlow places={placesToAsk(answers)} lastAnswers={lastAnswers} />
    </div>
  )
}
