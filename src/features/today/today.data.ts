// Server-side access to the person's PROJ-6 check-ins and actions. Every query runs with the
// person's own session, so Row Level Security and the column grants apply (AC-17); the user id is
// filtered in addition, never instead. Time windows use the server clock, never the device's.
import 'server-only'
import { z } from 'zod'
import type { ExportDailyDecisions } from '@/features/account/account.rules'
import { createClient } from '@/lib/supabase/server'
import { ACTION_STATUSES, KINDS, canUndo, openSince, recentSince, type ActionStatus, type CheckInAnswers, type EatAnswers, type Kind, type MoveAnswers } from './today.rules'
import { eatCheckInSchema, moveCheckInSchema } from './today.schema'

const CHECK_IN_COLUMNS = 'id, kind, minutes, energy, place, effort, suggested_ids, created_at'
const ACTION_COLUMNS = 'id, check_in_id, kind, workout_id, meal_id, status, started_at, concluded_at'
const ACTION_WITH_TITLE_COLUMNS = `${ACTION_COLUMNS}, workout:workouts(title), meal:meals(title)`

/** Postgres: unique violation (a second action for the same check-in, EC-4). */
const UNIQUE_VIOLATION = '23505'
/** Postgres: Row Level Security refused the row (content not suggested or no longer offered). */
const RLS_VIOLATION = '42501'

export type CheckIn = {
  id: string
  answers: CheckInAnswers
  /** Rank order, first = main suggestion; empty = nothing fitted (EC-1). */
  suggestedIds: string[]
  createdAt: Date
}

export type Action = {
  id: string
  checkInId: string
  kind: Kind
  /** The workout id for "move", the meal id for "eat". */
  itemId: string
  status: ActionStatus
  startedAt: Date
  concludedAt: Date | null
}

/** An action with the title of its content; null when the content is no longer offered. */
export type ActionWithTitle = Action & { title: string | null }

/** Result of "Geschafft" / "Heute nicht": the actual state, whether this call changed it (EC-5). */
export type ConcludeResult = { changed: boolean; action: Action }
/** Result of "Rückgängig": the actual state, whether this call reverted it (AC-15). */
export type UndoResult = { undone: boolean; action: Action }

/** Reading or writing failed (EC-9). The message carries the database code only, never answers. */
export class TodayDataError extends Error {}
/** The database refused the action: content not in the suggestion or no longer offered (EC-6). */
export class ActionRejectedError extends Error {}

const checkInRow = z.object({
  id: z.string(),
  kind: z.enum(KINDS),
  minutes: z.number().nullable(),
  energy: z.string().nullable(),
  place: z.string().nullable(),
  effort: z.string().nullable(),
  suggested_ids: z.array(z.string()),
  created_at: z.string(),
})

const actionRow = z.object({
  id: z.string(),
  check_in_id: z.string(),
  kind: z.enum(KINDS),
  workout_id: z.string().nullable(),
  meal_id: z.string().nullable(),
  status: z.enum(ACTION_STATUSES),
  started_at: z.string(),
  concluded_at: z.string().nullable(),
})

const titleEmbed = z.object({ title: z.string() }).nullable().optional()
const actionWithTitleRow = actionRow.extend({ workout: titleEmbed, meal: titleEmbed })

function answersOf(row: z.infer<typeof checkInRow>): CheckInAnswers | null {
  if (row.kind === 'eat') return eatCheckInSchema.safeParse({ kind: 'eat', effort: row.effort }).data ?? null
  return (
    moveCheckInSchema.safeParse({ kind: 'move', minutes: row.minutes, energy: row.energy, place: row.place }).data ??
    null
  )
}

/** Database row → check-in. The database enforces these values; a row that still does not fit is null. */
export function toCheckIn(row: unknown): CheckIn | null {
  const parsed = checkInRow.safeParse(row)
  if (!parsed.success) return null
  const answers = answersOf(parsed.data)
  if (!answers) return null
  return {
    id: parsed.data.id,
    answers,
    suggestedIds: parsed.data.suggested_ids,
    createdAt: new Date(parsed.data.created_at),
  }
}

function fromActionRow(data: z.infer<typeof actionRow>): Action | null {
  const itemId = data.kind === 'move' ? data.workout_id : data.meal_id
  if (!itemId) return null
  return {
    id: data.id,
    checkInId: data.check_in_id,
    kind: data.kind,
    itemId,
    status: data.status,
    startedAt: new Date(data.started_at),
    concludedAt: data.concluded_at ? new Date(data.concluded_at) : null,
  }
}

/** Database row → action, or null when it does not fit. */
export function toAction(row: unknown): Action | null {
  const parsed = actionRow.safeParse(row)
  return parsed.success ? fromActionRow(parsed.data) : null
}

/** Database row with embedded content titles → action with title, or null when it does not fit. */
export function toActionWithTitle(row: unknown): ActionWithTitle | null {
  const parsed = actionWithTitleRow.safeParse(row)
  if (!parsed.success) return null
  const action = fromActionRow(parsed.data)
  if (!action) return null
  const title = (action.kind === 'move' ? parsed.data.workout : parsed.data.meal)?.title ?? null
  return { ...action, title }
}

function answerColumns(answers: CheckInAnswers) {
  if (answers.kind === 'move') {
    return { kind: 'move', minutes: answers.minutes, energy: answers.energy, place: answers.place, effort: null }
  }
  return { kind: 'eat', minutes: null, energy: null, place: null, effort: answers.effort }
}

function failed(what: string, error: { code?: string } | null | undefined): TodayDataError {
  return new TodayDataError(`${what} (${error?.code ?? 'unknown'}).`)
}

/**
 * Saves answers and suggestion in ONE row, only once the suggestion is ready — an abandoned
 * check-in leaves nothing behind (AC-11). Also saved when nothing fitted (EC-1).
 */
export async function createCheckIn(userId: string, answers: CheckInAnswers, suggestedIds: string[]): Promise<CheckIn> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('check_ins')
    .insert({ user_id: userId, ...answerColumns(answers), suggested_ids: suggestedIds })
    .select(CHECK_IN_COLUMNS)
    .single()
  const checkIn = error ? null : toCheckIn(data)
  if (!checkIn) throw failed('Check-in could not be saved', error)
  return checkIn
}

/** One of the person's own check-ins, or null when it does not exist or is not theirs. */
export async function getOwnCheckIn(userId: string, checkInId: string): Promise<CheckIn | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('check_ins')
    .select(CHECK_IN_COLUMNS)
    .eq('id', checkInId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw failed('Check-in could not be read', error)
  return data ? toCheckIn(data) : null
}

/** The answers of the latest check-in of each kind, for the preselection and "Wie letztes Mal" (AC-5). */
export async function getLastAnswers(userId: string): Promise<{ move: MoveAnswers | null; eat: EatAnswers | null }> {
  const supabase = await createClient()
  const latest = (kind: Kind) =>
    supabase
      .from('check_ins')
      .select(CHECK_IN_COLUMNS)
      .eq('user_id', userId)
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  const [move, eat] = await Promise.all([latest('move'), latest('eat')])
  if (move.error || eat.error) throw failed('Last answers could not be read', move.error ?? eat.error)
  const moveAnswers = move.data ? toCheckIn(move.data)?.answers : null
  const eatAnswers = eat.data ? toCheckIn(eat.data)?.answers : null
  return {
    move: moveAnswers?.kind === 'move' ? moveAnswers : null,
    eat: eatAnswers?.kind === 'eat' ? eatAnswers : null,
  }
}

/** Content of the given kind the person started in the last 72 hours, whatever its state (AC-7, AC-8). */
export async function getRecentlyStartedIds(userId: string, kind: Kind, now: Date): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .select('workout_id, meal_id')
    .eq('user_id', userId)
    .eq('kind', kind)
    .gt('started_at', recentSince(now).toISOString())
  if (error) throw failed('Recent actions could not be read', error)
  const ids = (data ?? []).map((row: { workout_id: string | null; meal_id: string | null }) =>
    kind === 'move' ? row.workout_id : row.meal_id
  )
  return [...new Set(ids.filter((id): id is string => typeof id === 'string'))]
}

async function getOwnAction(userId: string, actionId: string): Promise<Action | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .select(ACTION_COLUMNS)
    .eq('id', actionId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw failed('Action could not be read', error)
  return data ? toAction(data) : null
}

async function getActionOfCheckIn(userId: string, checkInId: string): Promise<Action | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .select(ACTION_COLUMNS)
    .eq('check_in_id', checkInId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw failed('Action could not be read', error)
  return data ? toAction(data) : null
}

/**
 * Starts the chosen item of the check-in (AC-12). The database allows one action per check-in, so
 * a second attempt — a double tap, or another item after the start — returns the existing one
 * (EC-4). Throws `ActionRejectedError` when the database refuses the item (EC-6).
 */
export async function startAction(userId: string, checkIn: Pick<CheckIn, 'id' | 'answers'>, itemId: string): Promise<Action> {
  const kind = checkIn.answers.kind
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .insert({
      user_id: userId,
      check_in_id: checkIn.id,
      kind,
      workout_id: kind === 'move' ? itemId : null,
      meal_id: kind === 'eat' ? itemId : null,
    })
    .select(ACTION_COLUMNS)
    .single()

  if (error?.code === UNIQUE_VIOLATION) {
    const existing = await getActionOfCheckIn(userId, checkIn.id)
    if (existing) return existing
  }
  if (error?.code === RLS_VIOLATION) throw new ActionRejectedError('Action was refused by the database.')
  const action = error ? null : toAction(data)
  if (!action) throw failed('Action could not be saved', error)
  return action
}

/**
 * "Geschafft" or "Heute nicht" (AC-14): changes the state only while the action is still started,
 * so the first marking wins and double taps change it once (EC-4, EC-5). Returns the actual state,
 * or null when the action does not exist or is not the person's.
 */
export async function concludeAction(
  userId: string,
  actionId: string,
  status: Exclude<ActionStatus, 'started'>,
  now: Date
): Promise<ConcludeResult | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .update({ status, concluded_at: now.toISOString() })
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'started')
    .select(ACTION_COLUMNS)
  if (error) throw failed('Action could not be marked', error)
  const changed = data && data.length === 1 ? toAction(data[0]) : null
  if (changed) return { changed: true, action: changed }
  const current = await getOwnAction(userId, actionId)
  return current ? { changed: false, action: current } : null
}

async function getLatestCheckInAt(userId: string): Promise<Date | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw failed('Latest check-in could not be read', error)
  return data ? new Date((data as { created_at: string }).created_at) : null
}

/**
 * "Rückgängig" (AC-15): back to started, only while the person has not started a new check-in
 * since the marking. Conditional on the state that was checked, so it reverts at most once.
 * Returns the actual state, or null when the action does not exist or is not the person's.
 */
export async function undoConclusion(userId: string, actionId: string): Promise<UndoResult | null> {
  const [action, latestCheckInAt] = await Promise.all([getOwnAction(userId, actionId), getLatestCheckInAt(userId)])
  if (!action) return null
  if (!canUndo(action, latestCheckInAt)) return { undone: false, action }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .update({ status: 'started', concluded_at: null })
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', action.status)
    .select(ACTION_COLUMNS)
  if (error) throw failed('Marking could not be undone', error)
  const reverted = data && data.length === 1 ? toAction(data[0]) : null
  if (reverted) return { undone: true, action: reverted }
  const current = await getOwnAction(userId, actionId)
  return current ? { undone: false, action: current } : null
}

/** Started, not concluded and begun within 12 hours, newest first, with titles (AC-13, EC-8). */
export async function getOpenActions(userId: string, now: Date): Promise<ActionWithTitle[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('actions')
    .select(ACTION_WITH_TITLE_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'started')
    .gt('started_at', openSince(now).toISOString())
    .order('started_at', { ascending: false })
  if (error) throw failed('Open actions could not be read', error)
  return (data ?? []).map(toActionWithTitle).filter((action): action is ActionWithTitle => action !== null)
}

/** The latest marking, while it can still be undone (AC-15); otherwise null. */
export async function getUndoableConclusion(userId: string): Promise<ActionWithTitle | null> {
  const supabase = await createClient()
  const latestConcluded = supabase
    .from('actions')
    .select(ACTION_WITH_TITLE_COLUMNS)
    .eq('user_id', userId)
    .in('status', ['done', 'skipped'])
    .order('concluded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const [{ data, error }, latestCheckInAt] = await Promise.all([latestConcluded, getLatestCheckInAt(userId)])
  if (error) throw failed('Latest marking could not be read', error)
  const action = data ? toActionWithTitle(data) : null
  return action && canUndo(action, latestCheckInAt) ? action : null
}

/**
 * Everything stored about the person's check-ins and actions, oldest first, for the data export
 * (AC-18). Rows are passed on as stored. Throws instead of returning a partial export.
 */
export async function getOwnTodayExport(userId: string): Promise<ExportDailyDecisions> {
  const supabase = await createClient()
  const [checkIns, actions] = await Promise.all([
    supabase
      .from('check_ins')
      .select('id, kind, minutes, energy, place, effort, suggested_ids, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('actions')
      .select('id, check_in_id, kind, workout_id, meal_id, status, started_at, concluded_at, updated_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: true }),
  ])
  if (checkIns.error || actions.error) throw failed('Daily decisions could not be read', checkIns.error ?? actions.error)
  return {
    checkIns: (checkIns.data ?? []) as ExportDailyDecisions['checkIns'],
    actions: (actions.data ?? []) as ExportDailyDecisions['actions'],
  }
}
