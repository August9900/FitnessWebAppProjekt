import { requireUser } from '@/features/account/account.data'

// Every page below this layout needs a session confirmed by the auth server (AC-1, AC-12).
// PROJ-2 places the shared app frame (navigation, header) here.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return <div className="min-h-dvh">{children}</div>
}
