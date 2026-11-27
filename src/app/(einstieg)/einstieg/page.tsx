import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireUser } from '@/features/account/account.data'
import { OnboardingFlow } from '@/features/profile/components/onboarding-flow'
import { getOwnAnswers } from '@/features/profile/profile.data'
import { firstOpenQuestion } from '@/features/profile/profile.rules'

export const metadata: Metadata = { title: 'Einstieg · PULSE' }

// Starts at the first unanswered question (EC-1); with complete answers the onboarding is over
// and "Heute" opens instead (EC-4).
export default async function OnboardingPage() {
  const user = await requireUser()
  const answers = await getOwnAnswers(user.id)
  const firstOpen = firstOpenQuestion(answers)
  if (!firstOpen) redirect('/heute')

  return <OnboardingFlow initialAnswers={answers} initialQuestion={firstOpen} />
}
