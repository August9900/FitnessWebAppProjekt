import { Badge } from '@/components/ui/badge'

export const SAMPLE_CONTENT_LABEL = 'Beispielinhalt – noch nicht fachlich geprüft'

/**
 * Marks shared content that experts have not reviewed yet (PROJ-4 AC-12, PROJ-5 AC-8).
 * Shows nothing for reviewed content.
 */
export function SampleContentBadge({ reviewStatus }: { reviewStatus: 'unreviewed' | 'reviewed' }) {
  if (reviewStatus === 'reviewed') return null
  return (
    <Badge variant="outline" className="w-fit font-medium">
      {SAMPLE_CONTENT_LABEL}
    </Badge>
  )
}
