import type { Metadata } from 'next'
import { AreaPlaceholder } from '@/components/shell/area-placeholder'

export const metadata: Metadata = { title: 'Essen · PULSE' }

// Placeholder until the area's own feature fills it (PROJ-2, AC-5).
export default function EssenPage() {
  return <AreaPlaceholder area="essen" />
}
