import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/features/account/account.data'
import { BrandMark } from '@/components/shell/brand-mark'

export default async function Home({ searchParams }: { searchParams: Promise<{ konto?: string }> }) {
  if (await getCurrentUser()) redirect('/heute')
  const { konto } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <BrandMark className="self-start" />
      <h1 className="mt-8 font-display text-[28px] font-bold leading-tight">Der nächste machbare Schritt – auch an unruhigen Tagen.</h1>
      <p className="mt-4 text-muted-foreground">
        PULSE schlägt dir eine passende Bewegung oder Mahlzeit vor, ohne perfekten Wochenplan.
      </p>

      {konto === 'geloescht' && (
        <Alert role="status" className="mt-8">
          <AlertDescription>Dein Konto wurde gelöscht. Alle zugehörigen Daten wurden entfernt.</AlertDescription>
        </Alert>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <Button asChild>
          <Link href="/registrieren">Konto erstellen</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/anmelden">Anmelden</Link>
        </Button>
      </div>
    </main>
  )
}
