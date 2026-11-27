// Server-side access to the shared PROJ-5 content. Queries run with the person's own session,
// so Row Level Security applies: only signed-in people read, and only offered meals (EC-2).
import 'server-only'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { toNutrition } from '@/features/nutrition/nutrition.rules'
import { ALLERGENS, EFFORTS, MEAL_DIETS, REVIEW_STATUSES, type Meal } from './meals.rules'

const ID_PATTERN = /^[a-z0-9_]{3,40}$/

const COLUMNS =
  'id, title, diet, effort, minutes, ingredients, steps, easier_hint, allergens, review_status, energy_kcal, protein_g, carbs_g, fat_g'

const mealRow = z.object({
  id: z.string(),
  title: z.string(),
  diet: z.enum(MEAL_DIETS),
  effort: z.enum(EFFORTS),
  minutes: z.number().int().positive(),
  ingredients: z.array(z.string()).min(1),
  steps: z.array(z.string()).min(1),
  easier_hint: z.string(),
  allergens: z.array(z.enum(ALLERGENS)),
  review_status: z.enum(REVIEW_STATUSES),
  // PROJ-12: checked by the nutrition rule — unfitting values mean "no values", not a hidden meal.
  energy_kcal: z.unknown().optional(),
  protein_g: z.unknown().optional(),
  carbs_g: z.unknown().optional(),
  fat_g: z.unknown().optional(),
})

/**
 * Database row → the rules' type. The database already enforces these values; a row that still
 * does not fit is left out instead of breaking the view.
 */
export function toMeal(row: unknown): Meal | null {
  const parsed = mealRow.safeParse(row)
  if (!parsed.success) return null
  const data = parsed.data
  return {
    id: data.id,
    title: data.title,
    diet: data.diet,
    effort: data.effort,
    minutes: data.minutes,
    ingredients: data.ingredients,
    steps: data.steps,
    easierHint: data.easier_hint,
    allergens: data.allergens,
    reviewStatus: data.review_status,
    nutrition: toNutrition({ energyKcal: data.energy_kcal, proteinG: data.protein_g, carbsG: data.carbs_g, fatG: data.fat_g }),
  }
}

/** All offered meals in list order (AC-1). Throws when reading fails — the error state shows. */
export async function getOfferedMeals(): Promise<Meal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('meals')
    .select(COLUMNS)
    .eq('is_offered', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(`Meals could not be read (${error.code ?? 'unknown'}).`)
  return (data ?? []).map(toMeal).filter((meal): meal is Meal => meal !== null)
}

/** One offered meal, or null when it does not exist (anymore) or the id is invalid (AC-5, EC-2). */
export async function getMeal(id: string): Promise<Meal | null> {
  if (!ID_PATTERN.test(id)) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from('meals').select(COLUMNS).eq('id', id).eq('is_offered', true).maybeSingle()
  if (error) throw new Error(`Meal could not be read (${error.code ?? 'unknown'}).`)
  return data ? toMeal(data) : null
}
