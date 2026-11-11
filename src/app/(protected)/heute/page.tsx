import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/features/account/account.data'
import { signOut } from '@/features/account/auth.actions'

export const metadata: Metadata = { title: 'Heute · PULSE' }

// Placeholder until PROJ-6 (Tagesentscheidung) fills "Heute" and PROJ-2 adds the app frame.
export default async function TodayPage() {
  await requireUser()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-[28px] font-bold leading-tight">Heute</h1>
      <p className="mt-4 text-muted-foreground">
        Du bist angemeldet. Hier findest du bald deinen nächsten passenden Schritt für heute.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="h-12">
          <Link href="/profil">Zum Profil</Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="h-12 w-full sm:w-auto">
            Abmelden
          </Button>
        </form>
      </div>
    </main>
  )
}
