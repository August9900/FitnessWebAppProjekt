import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'

export const metadata: Metadata = { title: 'Heute · PULSE' }

// Placeholder until PROJ-6 (Tagesentscheidung) fills "Heute". The frame comes from the protected layout.
export default function TodayPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Heute"
        description="Du bist angemeldet. Hier findest du bald deinen nächsten passenden Schritt für heute."
      />
    </div>
  )
}
