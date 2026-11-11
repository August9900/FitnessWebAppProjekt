import { Badge } from '@/components/ui/badge'
import { SAMPLE_CONTENT_LABEL, type ReviewStatus } from '../workouts.rules'

/** Marks content that experts have not reviewed yet (AC-12). Nothing for reviewed content. */
export function SampleContentBadge({ reviewStatus }: { reviewStatus: ReviewStatus }) {
  if (reviewStatus === 'reviewed') return null
  return (
    <Badge variant="outline" className="w-fit font-medium">
      {SAMPLE_CONTENT_LABEL}
    </Badge>
  )
}
