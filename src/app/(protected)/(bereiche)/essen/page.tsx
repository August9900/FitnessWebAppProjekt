import type { Metadata } from 'next'
import { PageHeader } from '@/components/shell/page-header'
import { MealList, type MealListItem } from '@/features/meals/components/meal-list'
import { getOfferedMeals } from '@/features/meals/meals.data'
import { mealFits } from '@/features/meals/meals.rules'
import { requireCompletedProfile } from '@/features/profile/profile.data'

export const metadata: Metadata = { title: 'Essen · PULSE' }

// Reads the offered meals and the person's current diet on every visit, so a changed profile
// shows up right away (EC-1). Only fitting meals go to the browser (AC-2).
export default async function EssenPage() {
  const [{ answers }, meals] = await Promise.all([requireCompletedProfile(), getOfferedMeals()])

  const items: MealListItem[] = meals
    .filter((meal) => mealFits(meal, answers.diet))
    .map((meal) => ({
      id: meal.id,
      title: meal.title,
      diet: meal.diet,
      effort: meal.effort,
      minutes: meal.minutes,
      reviewStatus: meal.reviewStatus,
    }))

  return (
    <div className="space-y-8">
      <PageHeader title="Essen" description="Einfache Mahlzeiten, die zu deiner Essensweise passen." />
      <MealList items={items} />
    </div>
  )
}
