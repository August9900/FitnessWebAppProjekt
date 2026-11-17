// Server-side access to the person's PROJ-7 feedback. Every query runs with the person's own
// session, so Row Level Security and the column grants apply (AC-16): feedback only to their own
// action marked "done", only while no newer check-in exists, only the two answers changeable.
// The user id is filtered in addition, never instead.
import 'server-only'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Kind } from '@/features/today/today.rules'
import {
  EFFORT_RATINGS,
  SUGGEST_AGAIN_ANSWERS,
  type EffortRating,
  type FeedbackAnswers,
  type FeedbackQuestion,
  type FeedbackSignalRow,
  type SuggestAgain,
} from './feedback.rules'

/** Postgres: unique violation — the action already has feedback, so only the answer changes. */
const UNIQUE_VIOLATION = '23505'
/** Postgres: Row Level Security refused the row (not own, not "done", or a newer check-in). */
const RLS_VIOLATION = '42501'
/** Postgres: foreign key violation — the action does not exist (anymore). */
const FOREIGN_KEY_VIOLATION = '23503'

const COLUMN_OF = { effort: 'effort', suggestAgain: 'suggest_again' } satisfies Record<FeedbackQuestion, string>

/** Reading or writing failed (EC-3). The message carries the database code only, never answers. */
export class FeedbackDataError extends Error {}

export type SaveOutcome = 'saved' | 'not_possible'

function failed(what: string, error: { code?: string } | null | undefined): FeedbackDataError {
  return new FeedbackDataError(`${what} (${error?.code ?? 'unknown'}).`)
}

/**
 * Saves one answer to one question (AC-3, AC-6). The first answer creates the row; later answers
 * change only the column of their question, so answers to the other question are never
 * overwritten (EC-2). "not_possible" when the database refuses: not the person's action, not
 * "done", or a newer check-in exists (AC-7, AC-16, EC-4).
 */
export async function saveFeedbackAnswer(
  userId: string,
  actionId: string,
  question: FeedbackQuestion,
  value: EffortRating | SuggestAgain
): Promise<SaveOutcome> {
  const column = COLUMN_OF[question]
  const supabase = await createClient()

  const { error } = await supabase.from('action_feedback').insert({ action_id: actionId, user_id: userId, [column]: value })
  if (!error) return 'saved'
  if (error.code === RLS_VIOLATION || error.code === FOREIGN_KEY_VIOLATION) return 'not_possible'
  if (error.code !== UNIQUE_VIOLATION) throw failed('Feedback could not be saved', error)

  const { data, error: updateError } = await supabase
    .from('action_feedback')
    .update({ [column]: value })
    .eq('action_id', actionId)
    .eq('user_id', userId)
    .select('action_id')
  if (updateError) {
    if (updateError.code === RLS_VIOLATION) return 'not_possible'
    throw failed('Feedback could not be saved', updateError)
  }
  // No row changed: the card is gone (newer check-in, "Rückgängig") or the row is not theirs.
  return data && data.length === 1 ? 'saved' : 'not_possible'
}

const answersRow = z.object({
  effort: z.enum(EFFORT_RATINGS).nullable(),
  suggest_again: z.enum(SUGGEST_AGAIN_ANSWERS).nullable(),
})

/** The stored answers of one of the person's actions, or null without feedback (AC-5). */
export async function getOwnFeedback(userId: string, actionId: string): Promise<FeedbackAnswers | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_feedback')
    .select('effort, suggest_again')
    .eq('action_id', actionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw failed('Feedback could not be read', error)
  const parsed = data ? answersRow.safeParse(data) : null
  return parsed?.success ? { effort: parsed.data.effort, suggestAgain: parsed.data.suggest_again } : null
}

const signalRow = z.object({
  effort: z.enum(EFFORT_RATINGS).nullable(),
  effort_at: z.string().nullable(),
  suggest_again: z.enum(SUGGEST_AGAIN_ANSWERS).nullable(),
  suggest_again_at: z.string().nullable(),
  actions: z.object({ kind: z.enum(['move', 'eat']), workout_id: z.string().nullable(), meal_id: z.string().nullable() }),
})

/** Database row with its action → signal row, or null when it does not fit. */
export function toSignalRow(row: unknown): FeedbackSignalRow | null {
  const parsed = signalRow.safeParse(row)
  if (!parsed.success) return null
  const { actions: action, ...data } = parsed.data
  const itemId = action.kind === 'move' ? action.workout_id : action.meal_id
  if (!itemId) return null
  return {
    itemId,
    effort: data.effort,
    effortAt: data.effort_at ? new Date(data.effort_at) : null,
    suggestAgain: data.suggest_again,
    suggestAgainAt: data.suggest_again_at ? new Date(data.suggest_again_at) : null,
  }
}

/**
 * All of the person's feedback on actions of one kind, with the content of each action — the raw
 * input of "Lieber nicht" and the intensity shift (AC-9 to AC-14). Throws when reading fails.
 */
export async function getFeedbackSignalRows(userId: string, kind: Kind): Promise<FeedbackSignalRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_feedback')
    .select('effort, effort_at, suggest_again, suggest_again_at, actions!inner(kind, workout_id, meal_id)')
    .eq('user_id', userId)
    .eq('actions.kind', kind)
  if (error) throw failed('Feedback signals could not be read', error)
  return (data ?? []).map(toSignalRow).filter((row): row is FeedbackSignalRow => row !== null)
}

export type FeedbackExportRow = {
  action_id: string
  effort: string | null
  effort_at: string | null
  suggest_again: string | null
  suggest_again_at: string | null
  created_at: string
  updated_at: string
}

/** All of the person's feedback as stored, oldest first, for the data export (AC-17). Throws instead of a partial export. */
export async function getOwnFeedbackExport(userId: string): Promise<FeedbackExportRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_feedback')
    .select('action_id, effort, effort_at, suggest_again, suggest_again_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw failed('Feedback could not be read', error)
  return (data ?? []) as FeedbackExportRow[]
}
