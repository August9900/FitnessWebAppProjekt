import { AppShell } from '@/components/shell/app-shell'
import { navAreasFor } from '@/components/shell/navigation.rules'
import { requireUser } from '@/features/account/account.data'
import { getWeightAccess } from '@/features/weight/weight.data'
import { weightVisible } from '@/features/weight/weight.rules'

/** "Gewicht" in the navigation only for "ab 16" with the setting on (PROJ-11, PROJ-2 AC-19). */
async function showsWeight(userId: string): Promise<boolean> {
  try {
    const access = await getWeightAccess(userId)
    return access !== null && weightVisible(access)
  } catch {
    // A failed read must not break every page: the frame shows the five areas (design → Entscheidungen).
    return false
  }
}

// Every page below this layout needs a session confirmed by the auth server (PROJ-1: AC-1, AC-12)
// and sits inside the shared app frame (PROJ-2), with the areas this person has.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return <AppShell areas={navAreasFor({ showWeight: await showsWeight(user.id) })}>{children}</AppShell>
}
