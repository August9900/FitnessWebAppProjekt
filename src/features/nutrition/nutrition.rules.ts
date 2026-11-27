/**
 * Pure rules for PROJ-12 Nährwertübersicht: approximate values per portion of a meal — all four or
 * none (AC-6, AC-8) — and the four lines the detail shows, in a fixed order, as whole numbers with
 * their unit and without any judgement (AC-2, AC-3, EC-1). No IO, no framework.
 */

export const MAX_KCAL = 2000
export const MAX_GRAMS = 200

/** Per portion; whole numbers. */
export type Nutrition = {
  energyKcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

export const NUTRITION_TEXTS = {
  title: 'Nährwerte pro Portion',
  note: 'Ungefähre Werte – sie hängen von den genauen Zutaten ab.',
} as const

function isWhole(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max
}

/**
 * Nutrition from the four stored values, or null when any is missing or out of range — a meal is
 * then shown without values, never with only some of them (AC-6, AC-8).
 */
export function toNutrition(values: { energyKcal: unknown; proteinG: unknown; carbsG: unknown; fatG: unknown }): Nutrition | null {
  const { energyKcal, proteinG, carbsG, fatG } = values
  if (!isWhole(energyKcal, MAX_KCAL) || !isWhole(proteinG, MAX_GRAMS) || !isWhole(carbsG, MAX_GRAMS) || !isWhole(fatG, MAX_GRAMS)) {
    return null
  }
  return { energyKcal, proteinG, carbsG, fatG }
}

export type NutritionLine = { label: string; value: string }

/** „Energie: 450 kcal“, „Eiweiß: 22 g“, „Kohlenhydrate: 55 g“, „Fett: 14 g“ — 0 stays „0 g“ (AC-2, EC-1). */
export function nutritionLines(nutrition: Nutrition): NutritionLine[] {
  return [
    { label: 'Energie', value: `${nutrition.energyKcal} kcal` },
    { label: 'Eiweiß', value: `${nutrition.proteinG} g` },
    { label: 'Kohlenhydrate', value: `${nutrition.carbsG} g` },
    { label: 'Fett', value: `${nutrition.fatG} g` },
  ]
}
