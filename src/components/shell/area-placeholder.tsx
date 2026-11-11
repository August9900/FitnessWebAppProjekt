import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { NAV_AREAS, type NavAreaKey } from './navigation.rules'
import { PageHeader } from './page-header'

type PlaceholderArea = Extract<NavAreaKey, 'bewegung' | 'essen' | 'wochenblick'>

/** What each not-yet-built area will offer. One place for these texts (design.md). */
export const PLACEHOLDER_TEXTS: Record<PlaceholderArea, string> = {
  bewegung: 'Hier findest du bald kurze Bewegungsideen, die zu deiner Zeit und Energie passen.',
  essen: 'Hier findest du bald einfache Mahlzeitenideen, die sich schnell umsetzen lassen.',
  wochenblick:
    'Hier siehst du bald, was du diese Woche begonnen und geschafft hast – ohne Druck und ohne Strafpunkte.',
}

/** Calm placeholder for an area whose feature is not built yet (AC-5): no error, no empty page. */
export function AreaPlaceholder({ area }: { area: PlaceholderArea }) {
  const title = NAV_AREAS.find((entry) => entry.key === area)?.label ?? ''

  return (
    <div className="space-y-8">
      <PageHeader title={title} />
      <section className="max-w-xl rounded-lg border bg-card p-6">
        <p className="text-base">{PLACEHOLDER_TEXTS[area]}</p>
        <p className="mt-2 text-muted-foreground">Bis dahin wartet dein nächster Schritt unter „Heute“.</p>
        <Button asChild className="mt-6">
          <Link href="/heute">Zu Heute</Link>
        </Button>
      </section>
    </div>
  )
}
