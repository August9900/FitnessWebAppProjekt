import { Skeleton } from '@/components/ui/skeleton'

// Calm placeholder while an area loads (AC-17): keeps the space, no pulsing, navigation stays usable.
export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-8">
      <p role="status" className="sr-only">
        Wird geladen …
      </p>
      <Skeleton className="h-9 w-48 animate-none" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-full max-w-md animate-none" />
        <Skeleton className="h-5 w-full max-w-sm animate-none" />
      </div>
      <Skeleton className="h-40 w-full max-w-xl animate-none" />
    </div>
  )
}
