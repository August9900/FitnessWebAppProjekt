'use server'

// PROJ-6 server actions. Each checks the session and validates its input on the server; the
// database checks ownership, suggestion and offer once more (AC-17). Every action returns a
// result instead of throwing; failures are logged with the action name and a database code only —
// no answers, no user id (EC-9).
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/features/account/account.data'
import { getFeedbackSignalRows } from '@/features/feedback/feedback.data'
import { dislikedIds, intensityShift } from '@/features/feedback/feedback.rules'
import { getMeal, getOfferedMeals } from '@/features/meals/meals.data'
import { EFFORT_LABELS, type Meal } from '@/features/meals/meals.rules'
import { getOwnAnswers } from '@/features/profile/profile.data'
import { isComplete } from '@/features/profile/profile.rules'
import { getOfferedWorkouts, getWorkout } from '@/features/workouts/workouts.data'
import { durationLabel, type Workout } from '@/features/workouts/workouts.rules'
import {
  ActionRejectedError,
  concludeAction as concludeOwnAction,
  createCheckIn,
  getOwnCheckIn,
  getRecentlyStartedIds,
  startAction as startOwnAction,
  undoConclusion as undoOwnConclusion,
} from './today.data'
import {
  continueHref,
  detailHref,
  fitsLine,
  placesToAsk,
  selectMeals,
  suggestWorkouts,
  type ActionStatus,
  type Kind,
} from './today.rules'
import { checkInSchema, concludeActionSchema, startActionSchema, undoConclusionSchema } from './today.schema'

const TODAY_PATH = '/heute'

export type SuggestionItem = {
  id: string
  title: string
  /** "10 Min" for a workout, the effort level for a meal (AC-9). */
  detail: string
  /** "unreviewed" shows "Beispielinhalt – noch nicht fachlich geprüft" (AC-9). */
  reviewStatus: 'unreviewed' | 'reviewed'
  /** The detail view; opening it starts nothing (AC-10). */
  href: string
}

/**
 * `items` empty = "Gerade passt nichts genau." (EC-1); otherwise main suggestion first (AC-9).
 * `note` explains a main suggestion changed by the latest effort feedback (PROJ-7 AC-15), else null.
 */
export type SuggestionResult =
  | { ok: true; checkInId: string; kind: Kind; fitsLine: string; note: string | null; items: SuggestionItem[] }
  | { ok: false; reason: 'invalid' | 'failed' }

/** `href` leads to the guided run or the meal detail (AC-12); "gone" = no longer offered (EC-6). */
export type StartResult = { ok: true; href: string } | { ok: false; reason: 'invalid' | 'gone' | 'failed' }

/** The actual state after "Geschafft" / "Heute nicht"; `changed` is false when another marking was first (EC-5). */
export type ConcludeResult =
  | { ok: true; changed: boolean; status: ActionStatus }
  | { ok: false; reason: 'invalid' | 'failed' }

/** "not_possible" = a new check-in was started since the marking; `status` is the actual state (AC-15). */
export type UndoResult =
  | { ok: true; status: ActionStatus }
  | { ok: false; reason: 'not_possible'; status: ActionStatus }
  | { ok: false; reason: 'invalid' | 'failed' }

function logFailure(action: string, error: unknown) {
  console.error(`[today] ${action} failed`, { reason: error instanceof Error ? error.message : 'unknown' })
}

function workoutItem(workout: Workout): SuggestionItem {
  return {
    id: workout.id,
    title: workout.title,
    detail: durationLabel(workout.durationMinutes),
    reviewStatus: workout.reviewStatus,
    href: detailHref('move', workout.id),
  }
}

function mealItem(meal: Meal): SuggestionItem {
  return {
    id: meal.id,
    title: meal.title,
    detail: EFFORT_LABELS[meal.effort],
    reviewStatus: meal.reviewStatus,
    href: detailHref('eat', meal.id),
  }
}

/**
 * The check-in's answers → main suggestion and up to two alternatives (AC-7, AC-8). Check-in and
 * suggestion are saved together once the suggestion is ready (AC-11), also when nothing fits (EC-1).
 */
export async function requestSuggestion(input: unknown): Promise<SuggestionResult> {
  const user = await requireUser()
  const parsed = checkInSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid' }
  const answers = parsed.data

  try {
    const profile = await getOwnAnswers(user.id)
    if (!isComplete(profile)) return { ok: false, reason: 'invalid' }
    // Only the places from the person's own profile can be chosen (AC-2).
    if (answers.kind === 'move' && !placesToAsk(profile).includes(answers.place)) return { ok: false, reason: 'invalid' }

    const now = new Date()
    let items: SuggestionItem[]
    let note: string | null = null
    if (answers.kind === 'move') {
      const [workouts, recentIds, feedback] = await Promise.all([
        getOfferedWorkouts(),
        getRecentlyStartedIds(user.id, 'move', now),
        getFeedbackSignalRows(user.id, 'move'),
      ])
      // PROJ-7: "Lieber nicht" ranks last; the latest effort feedback shifts the aimed intensity (AC-9, AC-11 to AC-13).
      const signals = { dislikedIds: dislikedIds(feedback), intensityShift: intensityShift(feedback, now) }
      const suggestion = suggestWorkouts(answers, profile, workouts, recentIds, signals)
      items = suggestion.workouts.map(workoutItem)
      note = suggestion.note
    } else {
      const [meals, recentIds, feedback] = await Promise.all([
        getOfferedMeals(),
        getRecentlyStartedIds(user.id, 'eat', now),
        getFeedbackSignalRows(user.id, 'eat'),
      ])
      // Meal effort feedback is only stored; only "Lieber nicht" changes the order (AC-9, AC-14).
      items = selectMeals(answers, profile.diet, meals, recentIds, dislikedIds(feedback)).map(mealItem)
    }

    const checkIn = await createCheckIn(
      user.id,
      answers,
      items.map((item) => item.id)
    )
    // A new check-in ends "Rückgängig" for the last marking (AC-15).
    revalidatePath(TODAY_PATH)
    return { ok: true, checkInId: checkIn.id, kind: answers.kind, fitsLine: fitsLine(answers), note, items }
  } catch (error) {
    logFailure('requestSuggestion', error)
    return { ok: false, reason: 'failed' }
  }
}

/**
 * "Los geht's" / "Das mach ich" / "Stattdessen das" (AC-12): starts exactly this item of the
 * person's own check-in. A second attempt returns the action that already exists (EC-4).
 */
export async function startAction(input: unknown): Promise<StartResult> {
  const user = await requireUser()
  const parsed = startActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid' }
  const { checkInId, itemId } = parsed.data

  try {
    const checkIn = await getOwnCheckIn(user.id, checkInId)
    if (!checkIn || !checkIn.suggestedIds.includes(itemId)) return { ok: false, reason: 'invalid' }

    const kind = checkIn.answers.kind
    const offered = kind === 'move' ? await getWorkout(itemId) : await getMeal(itemId)
    if (!offered) return { ok: false, reason: 'gone' }

    const action = await startOwnAction(user.id, checkIn, itemId)
    revalidatePath(TODAY_PATH)
    return { ok: true, href: continueHref(action.kind, action.itemId) }
  } catch (error) {
    // Taken out of the offer between the check above and the insert (EC-6).
    if (error instanceof ActionRejectedError) return { ok: false, reason: 'gone' }
    logFailure('startAction', error)
    return { ok: false, reason: 'failed' }
  }
}

/** "Geschafft" or "Heute nicht" (AC-14). The first marking wins; the result is the actual state (EC-5). */
export async function concludeAction(input: unknown): Promise<ConcludeResult> {
  const user = await requireUser()
  const parsed = concludeActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid' }

  try {
    const result = await concludeOwnAction(user.id, parsed.data.actionId, parsed.data.status, new Date())
    if (!result) return { ok: false, reason: 'invalid' }
    revalidatePath(TODAY_PATH)
    return { ok: true, changed: result.changed, status: result.action.status }
  } catch (error) {
    logFailure('concludeAction', error)
    return { ok: false, reason: 'failed' }
  }
}

/** "Rückgängig" (AC-15): the action counts as started again, until a new check-in is started. */
export async function undoConclusion(input: unknown): Promise<UndoResult> {
  const user = await requireUser()
  const parsed = undoConclusionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid' }

  try {
    const result = await undoOwnConclusion(user.id, parsed.data.actionId)
    if (!result) return { ok: false, reason: 'invalid' }
    revalidatePath(TODAY_PATH)
    if (!result.undone) return { ok: false, reason: 'not_possible', status: result.action.status }
    return { ok: true, status: result.action.status }
  } catch (error) {
    logFailure('undoConclusion', error)
    return { ok: false, reason: 'failed' }
  }
}
