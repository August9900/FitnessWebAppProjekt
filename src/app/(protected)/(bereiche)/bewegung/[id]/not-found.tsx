import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'

// A workout address that does not exist (anymore) — also for its guided view (EC-2).
export default function WorkoutNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dieses Workout gibt es nicht (mehr)" />
      <Button asChild>
        <Link href="/bewegung">Zu Bewegung</Link>
      </Button>
    </div>
  )
}
