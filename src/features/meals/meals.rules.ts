/**
 * Pure rules for PROJ-5 Einfache Mahlzeiten: the content types, labels, the "passt"-rule by diet
 * (AC-2), the effort filter (AC-3) and the allergen text (AC-7, EC-4). No IO, no framework.
 */
import type { Diet } from '@/features/profile/profile.schema'
import type { Nutrition } from '@/features/nutrition/nutrition.rules'

export const MEAL_DIETS = ['vegan', 'vegetarian', 'meat_fish'] as const
export const EFFORTS = ['no_cook', 'quick', 'up_to_20'] as const
export const REVIEW_STATUSES = ['unreviewed', 'reviewed'] as const
/** The 14 main allergens of the EU food information regulation (LMIV, Anhang II). */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const

export type MealDiet = (typeof MEAL_DIETS)[number]
export type Effort = (typeof EFFORTS)[number]
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]
export type Allergen = (typeof ALLERGENS)[number]

export type Meal = {
  id: string
  title: string
  diet: MealDiet
  effort: Effort
  minutes: number
  ingredients: string[]
  steps: string[]
  easierHint: string
  allergens: Allergen[]
  reviewStatus: ReviewStatus
  /** PROJ-12: approximate values per portion — all four or none. Missing = none. */
  nutrition?: Nutrition | null
}

export const MEAL_DIET_LABELS = {
  vegan: 'vegan',
  vegetarian: 'vegetarisch',
  meat_fish: 'mit Fleisch oder Fisch',
} satisfies Record<MealDiet, string>

export const EFFORT_LABELS = {
  no_cook: 'Ohne Kochen',
  quick: 'Schnell gekocht',
  up_to_20: 'Bis 20 Min',
} satisfies Record<Effort, string>

export const ALLERGEN_LABELS = {
  gluten: 'Gluten',
  crustaceans: 'Krebstiere',
  eggs: 'Eier',
  fish: 'Fisch',
  peanuts: 'Erdnüsse',
  soy: 'Soja',
  milk: 'Milch',
  nuts: 'Schalenfrüchte',
  celery: 'Sellerie',
  mustard: 'Senf',
  sesame: 'Sesam',
  sulphites: 'Sulfite',
  lupin: 'Lupinen',
  molluscs: 'Weichtiere',
} satisfies Record<Allergen, string>

export const ALLERGEN_PACKAGING_NOTE = 'Bei Allergien prüfe bitte auch die Angaben auf der Verpackung deiner Zutaten.'
export const NOT_FITTING_NOTE = 'Passt nicht zu deiner Essensweise'

export function minutesLabel(minutes: number): string {
  return `${minutes} Min`
}

/** Which meal diets a person's diet allows (AC-2). */
const ALLOWED_MEAL_DIETS = {
  omnivore: ['vegan', 'vegetarian', 'meat_fish'],
  vegetarian: ['vegan', 'vegetarian'],
  vegan: ['vegan'],
} satisfies Record<Diet, MealDiet[]>

/** Whether a meal fits a person's diet (AC-2). Without a diet nothing fits. */
export function mealFits(meal: Pick<Meal, 'diet'>, personDiet: Diet | null | undefined): boolean {
  if (!personDiet) return false
  return (ALLOWED_MEAL_DIETS[personDiet] as MealDiet[]).includes(meal.diet)
}

export const EFFORT_FILTERS = ['all', ...EFFORTS] as const
export type EffortFilter = (typeof EFFORT_FILTERS)[number]

export function effortFilterLabel(filter: EffortFilter): string {
  return filter === 'all' ? 'Alle' : EFFORT_LABELS[filter]
}

/** Only the meals of the chosen effort level (AC-3). */
export function filterByEffort<T extends Pick<Meal, 'effort'>>(meals: T[], filter: EffortFilter): T[] {
  return filter === 'all' ? meals : meals.filter((meal) => meal.effort === filter)
}

/**
 * "Enthält: Gluten, Milch" in the fixed EU order, or the explicit "none" sentence — the statement
 * never goes missing silently (AC-7, EC-4).
 */
export function allergenText(allergens: Allergen[]): string {
  const present = ALLERGENS.filter((code) => allergens.includes(code))
  if (present.length === 0) return 'Enthält keines der 14 Hauptallergene.'
  return `Enthält: ${present.map((code) => ALLERGEN_LABELS[code]).join(', ')}`
}
