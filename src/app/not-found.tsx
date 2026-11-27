import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/shell/app-shell'
import { BrandMark } from '@/components/shell/brand-mark'
import { PageHeader } from '@/components/shell/page-header'
import { getCurrentUser } from '@/features/account/account.data'

export const metadata: Metadata = { title: 'Seite nicht gefunden · PULSE' }

// Unknown address (AC-16): signed-in people see it inside the frame with a way to "Heute",
// everyone else sees the brand without navigation and a way to the start page.
export default async function NotFound() {
  const user = await getCurrentUser()

  const content = (
    <div className="space-y-6">
      <PageHeader title="Seite nicht gefunden" description="Diese Adresse gibt es in PULSE nicht." />
      <Button asChild>
        <Link href={user ? '/heute' : '/'}>{user ? 'Zu Heute' : 'Zum Einstieg'}</Link>
      </Button>
    </div>
  )

  if (user) return <AppShell>{content}</AppShell>

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <BrandMark href="/" className="mb-8 self-start" />
      {content}
    </main>
  )
}
