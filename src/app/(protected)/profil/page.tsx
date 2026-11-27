import type { Metadata } from 'next'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'
import { getOwnProfile, requireUser } from '@/features/account/account.data'
import { ageBandLabel } from '@/features/account/account.rules'
import { signOut } from '@/features/account/auth.actions'
import { DeleteAccountDialog } from '@/features/account/components/delete-account-dialog'
import { ExportButton } from '@/features/account/components/export-button'
import { PasswordChangeForm } from '@/features/account/components/password-change-form'
import { AppearanceSettings } from '@/features/appearance/appearance-settings'
import { AnswersForm } from '@/features/profile/components/answers-form'
import { getOwnAnswers } from '@/features/profile/profile.data'
import { isComplete } from '@/features/profile/profile.rules'
import { WeightVisibilitySwitch } from '@/features/weight/components/weight-visibility-switch'
import { WEIGHT_TEXTS, canUseWeight } from '@/features/weight/weight.rules'

export const metadata: Metadata = { title: 'Profil · PULSE' }

const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' })

async function loadAnswers(userId: string) {
  try {
    return { answers: await getOwnAnswers(userId), failed: false }
  } catch {
    return { answers: null, failed: true }
  }
}

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
  const answersState = await loadAnswers(user.id)

  return (
    <div>
      <PageHeader title="Profil" />

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

      <section aria-labelledby="angaben" className="mt-12 space-y-4">
        <h2 id="angaben" className="text-xl font-semibold">
          Meine Angaben
        </h2>
        {answersState.failed ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Deine Angaben konnten gerade nicht geladen werden. Lade die Seite neu.</AlertDescription>
          </Alert>
        ) : answersState.answers && isComplete(answersState.answers) ? (
          <AnswersForm initialAnswers={answersState.answers} />
        ) : (
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <p>Deine Angaben sind noch nicht vollständig.</p>
            <Button asChild>
              <Link href="/einstieg">Einstieg fortsetzen</Link>
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="darstellung" className="mt-12 space-y-4">
        <h2 id="darstellung" className="text-xl font-semibold">
          Darstellung
        </h2>
        <AppearanceSettings />
      </section>

      {/* PROJ-11: only "ab 16" has the area at all (AC-2, AC-14). */}
      {canUseWeight(profile?.age_band_at_signup) && (
        <section aria-labelledby="gewicht" className="mt-12 space-y-4">
          <h2 id="gewicht" className="text-xl font-semibold">
            {WEIGHT_TEXTS.sectionTitle}
          </h2>
          <WeightVisibilitySwitch initial={profile?.show_weight_in_nav !== false} />
        </section>
      )}

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
          <Button type="submit" variant="outline">
            Abmelden
          </Button>
        </form>
      </section>
    </div>
  )
}
