import { AppShell } from '@/components/shell/app-shell'
import { requireUser } from '@/features/account/account.data'

// Every page below this layout needs a session confirmed by the auth server (PROJ-1: AC-1, AC-12)
// and sits inside the shared app frame (PROJ-2).
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return <AppShell>{children}</AppShell>
}
