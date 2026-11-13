import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MealDetail } from '@/features/meals/components/meal-detail'
import { getMeal } from '@/features/meals/meals.data'
import { mealFits } from '@/features/meals/meals.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'

export const metadata: Metadata = { title: 'Mahlzeit · PULSE' }

// Unknown or no longer offered meals end in this segment's not-found view (EC-2). A meal that does
// not fit the person's diet is still shown, with a note (EC-3).
export default async function MealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ answers }, meal] = await Promise.all([requireCompletedProfile(), getMeal(id)])
  if (!meal) notFound()
  return <MealDetail meal={meal} fits={mealFits(meal, answers.diet)} />
}
