'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'

// Unexpected error inside an area (AC-18): understandable message and a retry, inside the frame,
// so the navigation stays usable. No technical details are shown.
export default function AreaError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Da ist etwas schiefgelaufen" />
      <Alert variant="destructive" role="alert" className="max-w-xl">
        <AlertDescription>Dieser Bereich konnte gerade nicht angezeigt werden. Bitte versuche es erneut.</AlertDescription>
      </Alert>
      <Button type="button" onClick={() => retry()}>
        Erneut versuchen
      </Button>
    </div>
  )
}
