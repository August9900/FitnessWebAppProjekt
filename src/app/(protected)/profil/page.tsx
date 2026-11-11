import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getOwnProfile, requireUser } from '@/features/account/account.data'
import { ageBandLabel } from '@/features/account/account.rules'
import { signOut } from '@/features/account/auth.actions'
import { DeleteAccountDialog } from '@/features/account/components/delete-account-dialog'
import { ExportButton } from '@/features/account/components/export-button'
import { PasswordChangeForm } from '@/features/account/components/password-change-form'

export const metadata: Metadata = { title: 'Profil · PULSE' }

const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' })

async function loadProfile(userId: string) {
  try {
    return { profile: await getOwnProfile(userId), failed: false }
  } catch {
    return { profile: null, failed: true }
  }
}

export default async function ProfilePage() {
  const user = await requireUser()
  const { profile, failed } = await loadProfile(user.id)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/heute" className="text-sm underline underline-offset-4">
        Zu Heute
      </Link>
      <h1 className="mt-4 text-[28px] font-bold leading-tight">Profil</h1>

      <section aria-labelledby="konto" className="mt-10 space-y-4">
        <h2 id="konto" className="text-xl font-semibold">
          Konto
        </h2>
        {failed && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Deine Kontodaten konnten gerade nicht geladen werden. Lade die Seite neu.</AlertDescription>
          </Alert>
        )}
        <dl className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted-foreground">E-Mail-Adresse</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-muted-foreground">Altersgruppe</dt>
          <dd>{ageBandLabel(profile?.age_band_at_signup)}</dd>
          <dt className="text-muted-foreground">Konto seit</dt>
          <dd>{dateFormat.format(new Date(user.created_at))}</dd>
        </dl>
      </section>

      <section aria-labelledby="passwort" className="mt-12 space-y-4">
        <h2 id="passwort" className="text-xl font-semibold">
          Passwort ändern
        </h2>
        <PasswordChangeForm />
      </section>

      <section aria-labelledby="daten" className="mt-12 space-y-4">
        <h2 id="daten" className="text-xl font-semibold">
          Meine Daten
        </h2>
        <p className="text-muted-foreground">Lade alle gespeicherten Angaben zu deinem Konto als Datei herunter.</p>
        <ExportButton />
      </section>

      <section aria-labelledby="loeschen" className="mt-12 space-y-4">
        <h2 id="loeschen" className="text-xl font-semibold">
          Konto löschen
        </h2>
        <p className="text-muted-foreground">
          Löscht dein Konto und alle zugehörigen Daten sofort und endgültig.
        </p>
        <DeleteAccountDialog />
      </section>

      <section aria-label="Abmelden" className="mt-12 border-t pt-8">
        <form action={signOut}>
          <Button type="submit" variant="outline" className="h-12">
            Abmelden
          </Button>
        </form>
      </section>
    </main>
  )
}
