'use server'

// PROJ-3 server actions. Each checks the session and validates its input on the server; the
// database checks values and ownership once more (EC-5, AC-16).
import { requireUser } from '@/features/account/account.data'
import { getOwnAnswers, saveAnswers } from './profile.data'
import { applyAnswer, isComplete, type ProfileAnswers } from './profile.rules'
import { MESSAGES, answerSchema, fieldErrorsOf, profileAnswersSchema } from './profile.schema'

const SAVE_FAILED = 'Deine Antwort konnte gerade nicht gespeichert werden. Bitte versuche es erneut.'
const PROFILE_SAVE_FAILED = 'Deine Angaben konnten gerade nicht gespeichert werden. Bitte versuche es erneut.'
const PROFILE_SAVED = 'Gespeichert.'

export type AnswerResult =
  | { ok: true; answers: ProfileAnswers; complete: boolean }
  | { ok: false; fieldError?: string; message?: string }

export type ProfileFormResult =
  | { ok: true; message: string }
  | { ok: false; fieldErrors?: Partial<Record<string, string>>; message?: string }

function logFailure(action: string, error: unknown) {
  console.error(`[profile] ${action} failed`, { reason: error instanceof Error ? error.message : 'unknown' })
}

/**
 * Saves one onboarding answer right away, so an interrupted onboarding continues where it
 * stopped (EC-1). Returns the answers afterwards and whether they are now complete (AC-9).
 * Saving the same answer twice has no further effect (EC-3).
 */
export async function saveOnboardingAnswer(input: unknown): Promise<AnswerResult> {
  const user = await requireUser()
  const parsed = answerSchema.safeParse(input)
  if (!parsed.success) {
    const errors = fieldErrorsOf(parsed.error)
    return { ok: false, fieldError: errors.value ?? Object.values(errors)[0] }
  }

  try {
    const current = await getOwnAnswers(user.id)
    const { question, value } = parsed.data
    if (question === 'homeEquipment' && !current.places?.includes('home')) {
      return { ok: false, fieldError: MESSAGES.equipmentWithoutHome }
    }

    const next = applyAnswer(current, question, value)
    const changes: Partial<ProfileAnswers> = { [question]: value }
    // Without "home" the equipment at home goes in the same change (AC-14).
    if (question === 'places') changes.homeEquipment = next.homeEquipment
    await saveAnswers(user.id, changes)

    return { ok: true, answers: next, complete: isComplete(next) }
  } catch (error) {
    logFailure('saveOnboardingAnswer', error)
    return { ok: false, message: SAVE_FAILED }
  }
}

/** Saves the whole profile form as one change; the last save wins completely (EC-2). */
export async function updateProfileAnswers(input: unknown): Promise<ProfileFormResult> {
  const user = await requireUser()
  const parsed = profileAnswersSchema.safeParse(input)
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) }

  try {
    await saveAnswers(user.id, parsed.data)
    return { ok: true, message: PROFILE_SAVED }
  } catch (error) {
    logFailure('updateProfileAnswers', error)
    return { ok: false, message: PROFILE_SAVE_FAILED }
  }
}
