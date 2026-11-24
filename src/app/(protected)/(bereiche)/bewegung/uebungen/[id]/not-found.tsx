import Link from 'next/link'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { LIBRARY_TEXTS, libraryHref } from '@/features/exercises/exercises.rules'

// An exercise address that does not exist (PROJ-9 EC-2), with the way back to the library.
export default function ExerciseNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader title={LIBRARY_TEXTS.notFound} />
      <Button asChild>
        <Link href={libraryHref()}>{LIBRARY_TEXTS.backToList}</Link>
      </Button>
    </div>
  )
}
