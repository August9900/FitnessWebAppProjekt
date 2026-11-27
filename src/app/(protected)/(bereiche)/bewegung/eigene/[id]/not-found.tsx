import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { CUSTOM_TEXTS } from '@/features/custom-workouts/custom-workouts.rules'

// An own-workout address that is unknown or someone else's (PROJ-10 AC-12, EC-6) — also for its
// edit and guided pages.
export default function CustomWorkoutNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader title={CUSTOM_TEXTS.notFound} />
      <Button asChild>
        <Link href="/bewegung">{CUSTOM_TEXTS.toBewegung}</Link>
      </Button>
    </div>
  )
}
