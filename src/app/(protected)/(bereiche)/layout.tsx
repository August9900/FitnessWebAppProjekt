import { requireCompletedProfile } from '@/features/profile/profile.data'

// Heute, Bewegung, Essen and Wochenblick open only with complete answers; otherwise the person
// is led to the onboarding (PROJ-3, AC-1, EC-6). Profil lies outside this group and stays open.
export default async function AreasLayout({ children }: { children: React.ReactNode }) {
  await requireCompletedProfile()
  return children
}
