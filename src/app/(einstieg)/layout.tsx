import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/shell/brand-mark'
import { requireUser } from '@/features/account/account.data'
import { signOut } from '@/features/account/auth.actions'

// The onboarding sits outside the app frame: no main navigation (PROJ-3, AC-10), but account
// management and sign-out stay one click away.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireUser()

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-2 px-4 pt-6">
        <BrandMark />
        <nav aria-label="Konto" className="flex items-center gap-1">
          <Button asChild variant="ghost" className="px-3">
            <Link href="/profil">Konto verwalten</Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="px-3">
              Abmelden
            </Button>
          </form>
        </nav>
      </header>
      <main id="inhalt" className="mx-auto w-full max-w-xl px-4 pb-16 pt-10">
        {children}
      </main>
    </div>
  )
}
