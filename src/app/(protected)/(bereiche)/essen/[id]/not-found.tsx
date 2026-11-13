import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'

// A meal address that does not exist (anymore) (EC-2).
export default function MealNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader title="Diese Mahlzeit gibt es nicht (mehr)" />
      <Button asChild>
        <Link href="/essen">Zu Essen</Link>
      </Button>
    </div>
  )
}
