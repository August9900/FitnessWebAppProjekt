// Server-side access to the person's PROJ-3 answers. Every query runs with the person's own
// session, so Row Level Security and the column grants of the database apply (AC-16).
import 'server-only'
import { redirect } from 'next/navigation'
import { requireUser, type AccountUser } from '@/features/account/account.data'
import { createClient } from '@/lib/supabase/server'
import { EMPTY_ANSWERS, isComplete, type ProfileAnswers } from './profile.rules'
import { dietSchema, experienceSchema, goalSchema, homeEquipmentSchema, placesSchema } from './profile.schema'

const COLUMNS = 'goal, experience, places, home_equipment, diet'

type AnswerRow = {
  goal: string | null
  experience: string | null
  places: string[] | null
  home_equipment: string[] | null
  diet: string | null
}

/** Stored values are trusted only as far as the schema allows; anything unexpected counts as unanswered. */
function fromRow(row: AnswerRow | null): ProfileAnswers {
  if (!row) return EMPTY_ANSWERS
  return {
    goal: goalSchema.safeParse(row.goal).data ?? null,
    experience: experienceSchema.safeParse(row.experience).data ?? null,
    places: placesSchema.safeParse(row.places).data ?? null,
    homeEquipment: homeEquipmentSchema.safeParse(row.home_equipment).data ?? null,
    diet: dietSchema.safeParse(row.diet).data ?? null,
  }
}

export function toRow(answers: Partial<ProfileAnswers>): Partial<AnswerRow> {
  const row: Partial<AnswerRow> = {}
  if ('goal' in answers) row.goal = answers.goal ?? null
  if ('experience' in answers) row.experience = answers.experience ?? null
  if ('places' in answers) row.places = answers.places ?? null
  if ('homeEquipment' in answers) row.home_equipment = answers.homeEquipment ?? null
  if ('diet' in answers) row.diet = answers.diet ?? null
  return row
}

export class ProfileSaveError extends Error {}

export async function getOwnAnswers(userId: string): Promise<ProfileAnswers> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select(COLUMNS).eq('user_id', userId).maybeSingle()
  if (error) throw new Error(`Profile answers could not be read (${error.code ?? 'unknown'}).`)
  return fromRow(data as AnswerRow | null)
}

/**
 * Writes the given answers in ONE update of the person's row — so saving the whole profile form
 * replaces it as a whole and concurrent saves never mix (EC-2). Throws when nothing was saved.
 */
export async function saveAnswers(userId: string, answers: Partial<ProfileAnswers>): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(toRow(answers))
    .eq('user_id', userId)
    .select('user_id')
  if (error || !data || data.length !== 1) {
    throw new ProfileSaveError(`Profile answers could not be saved (${error?.code ?? 'no row updated'}).`)
  }
}

/**
 * For the main areas (Heute, Bewegung, Essen, Wochenblick): the signed-in person with complete
 * answers, or a redirect to the onboarding (AC-1, EC-6).
 */
export async function requireCompletedProfile(): Promise<{ user: AccountUser; answers: ProfileAnswers }> {
  const user = await requireUser()
  const answers = await getOwnAnswers(user.id)
  if (!isComplete(answers)) redirect('/einstieg')
  return { user, answers }
}
