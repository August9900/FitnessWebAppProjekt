/**
 * Pure rules for PROJ-6 Tagesentscheidung: check-in answers and labels, the selection of the main
 * suggestion and up to two alternatives (AC-7, AC-8), the "Passt zu" line (AC-9), "Wie letztes Mal"
 * (AC-5, EC-7) and which actions are open or can still be undone (AC-13, AC-15, EC-8).
 * PROJ-7 adds the feedback signals to the selection: "Lieber nicht" ranks last, the latest effort
 * feedback shifts the aimed intensity, and a note explains a changed main suggestion.
 * No IO, no framework; the current time is always passed in.
 */
import { adjustmentNote, type IntensityShift } from '@/features/feedback/feedback.rules'
import { mealFits, type Effort, type Meal } from '@/features/meals/meals.rules'
import type { ProfileAnswers } from '@/features/profile/profile.rules'
import { PLACES, type Diet, type Place } from '@/features/profile/profile.schema'
import {
  DURATIONS,
  PLACE_LABELS,
  durationLabel,
  fitOf,
  guidedHref,
  workoutEquipment,
  type Intensity,
  type Workout,
} from '@/features/workouts/workouts.rules'

export const KINDS = ['move', 'eat'] as const
export const MINUTES_OPTIONS = DURATIONS
export const ENERGIES = ['low', 'medium', 'high'] as const
export const ACTION_STATUSES = ['started', 'done', 'skipped'] as const

export type Kind = (typeof KINDS)[number]
export type Minutes = (typeof MINUTES_OPTIONS)[number]
export type Energy = (typeof ENERGIES)[number]
export type ActionStatus = (typeof ACTION_STATUSES)[number]

export type MoveAnswers = { kind: 'move'; minutes: Minutes; energy: Energy; place: Place }
export type EatAnswers = { kind: 'eat'; effort: Effort }
export type CheckInAnswers = MoveAnswers | EatAnswers

type ProfileForToday = Pick<ProfileAnswers, 'experience' | 'places' | 'homeEquipment'>

export const KIND_LABELS = { move: 'Bewegen', eat: 'Essen' } satisfies Record<Kind, string>
export const ENERGY_LABELS = { low: 'wenig', medium: 'mittel', high: 'viel' } satisfies Record<Energy, string>

/** How the energy reads in a summary: "wenig Energie", "mittlere Energie", "viel Energie". */
const ENERGY_SUMMARY = { low: 'wenig Energie', medium: 'mittlere Energie', high: 'viel Energie' } satisfies Record<Energy, string>
export const EAT_EFFORT_ANSWER_LABELS = {
  no_cook: 'Gar nicht kochen',
  quick: 'Kurz kochen',
  up_to_20: 'Bis 20 Min',
} satisfies Record<Effort, string>
export const CONCLUSION_MESSAGES = {
  done: 'Geschafft. Gut gemacht.',
  skipped: 'Okay. Vielleicht ein andermal.',
} satisfies Record<Exclude<ActionStatus, 'started'>, string>

/** Calm, neutral texts shared by the flow and the open actions (EC-1, EC-6, EC-9). */
export const TODAY_MESSAGES = {
  failed: 'Das hat gerade nicht geklappt. Bitte versuch es noch einmal.',
  gone: 'Das gibt es leider nicht mehr.',
  nothingFits: 'Gerade passt nichts genau.',
} as const

export { PLACE_LABELS }
export const minutesLabel = durationLabel

export const OPEN_WINDOW_HOURS = 12
export const RECENT_WINDOW_HOURS = 72
const HOUR_MS = 60 * 60 * 1000

const MAX_SUGGESTIONS = 3

const INTENSITY_INDEX = { gentle: 0, moderate: 1, vigorous: 2 } satisfies Record<Intensity, number>
const ENERGY_INDEX = { low: 0, medium: 1, high: 2 } satisfies Record<Energy, number>

/** Which intensities a given energy allows (AC-7); experience is limited separately via `fitOf`. */
const ALLOWED_BY_ENERGY = {
  low: ['gentle'],
  medium: ['gentle', 'moderate'],
  high: ['gentle', 'moderate', 'vigorous'],
} satisfies Record<Energy, Intensity[]>

/** Sorts by the given keys in order; equal keys keep the input order (= the offer's sort order). */
function rankBy<T>(items: T[], keys: ((item: T) => number)[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      for (const key of keys) {
        const diff = key(a.item) - key(b.item)
        if (diff !== 0) return diff
      }
      return a.index - b.index
    })
    .map(({ item }) => item)
}

/** What PROJ-7 feedback contributes to a suggestion; without feedback nothing changes. */
export type SuggestionSignals = { dislikedIds: string[]; intensityShift: IntensityShift }
export const NO_SIGNALS: SuggestionSignals = { dislikedIds: [], intensityShift: 0 }

/**
 * Main suggestion and alternatives for "Bewegen" (AC-7): fits the profile (PROJ-4 rule), doable at
 * the chosen place (at home with the equipment from the profile), at most the chosen time, an
 * intensity the energy allows. Sorted by "Lieber nicht" last (PROJ-7), duration (exact first, then
 * shorter ones longest first), closeness of intensity to the aimed level (the energy, shifted by
 * the latest effort feedback and kept within gentle…vigorous), not recently started, offer order.
 * The shift only changes the order, never which workouts qualify. At most three.
 */
export function selectWorkouts(
  answers: MoveAnswers,
  profile: ProfileForToday,
  workouts: Workout[],
  recentIds: string[],
  signals: SuggestionSignals = NO_SIGNALS
): Workout[] {
  const atHome = (profile.homeEquipment ?? []) as string[]
  const allowed: Intensity[] = ALLOWED_BY_ENERGY[answers.energy]
  const aimed = Math.min(2, Math.max(0, ENERGY_INDEX[answers.energy] + signals.intensityShift))

  const candidates = workouts.filter(
    (workout) =>
      fitOf(workout, profile).fits &&
      workout.places.includes(answers.place) &&
      (answers.place !== 'home' || workoutEquipment(workout).every((code) => atHome.includes(code))) &&
      workout.durationMinutes <= answers.minutes &&
      allowed.includes(workout.intensity)
  )

  return rankBy(candidates, [
    (workout) => (signals.dislikedIds.includes(workout.id) ? 1 : 0),
    (workout) => answers.minutes - workout.durationMinutes,
    (workout) => Math.abs(INTENSITY_INDEX[workout.intensity] - aimed),
    (workout) => (recentIds.includes(workout.id) ? 1 : 0),
  ]).slice(0, MAX_SUGGESTIONS)
}

/**
 * The workout suggestion with its explanation (PROJ-7 AC-15): the note appears only when the
 * intensity shift gave a different main suggestion than the PROJ-6 rule alone (EC-7).
 */
export function suggestWorkouts(
  answers: MoveAnswers,
  profile: ProfileForToday,
  workouts: Workout[],
  recentIds: string[],
  signals: SuggestionSignals
): { workouts: Workout[]; note: string | null } {
  const shifted = selectWorkouts(answers, profile, workouts, recentIds, signals)
  const unshifted = selectWorkouts(answers, profile, workouts, recentIds, { ...signals, intensityShift: 0 })
  const changed = shifted[0]?.id !== unshifted[0]?.id
  return { workouts: shifted, note: changed ? adjustmentNote(signals.intensityShift) : null }
}

/** For a chosen effort level: the level itself, then the easier ones used to fill up (AC-8). */
const EFFORT_FILL_ORDER = {
  up_to_20: ['up_to_20', 'quick', 'no_cook'],
  quick: ['quick', 'no_cook'],
  no_cook: ['no_cook'],
} satisfies Record<Effort, Effort[]>

/**
 * Main suggestion and alternatives for "Essen" (AC-8): fits the diet, chosen effort level first;
 * with fewer than three there, filled with the easier levels in order. Meals the person said
 * "Lieber nicht" to come after all others, also after the filled-up levels (PROJ-7 AC-9). Within a
 * level: not recently started first, then offer order. At most three.
 */
export function selectMeals(
  answers: EatAnswers,
  diet: Diet | null | undefined,
  meals: Meal[],
  recentIds: string[],
  dislikedIds: string[] = []
): Meal[] {
  const levels: Effort[] = EFFORT_FILL_ORDER[answers.effort]
  const candidates = meals.filter((meal) => mealFits(meal, diet) && levels.includes(meal.effort))

  return rankBy(candidates, [
    (meal) => (dislikedIds.includes(meal.id) ? 1 : 0),
    (meal) => levels.indexOf(meal.effort),
    (meal) => (recentIds.includes(meal.id) ? 1 : 0),
  ]).slice(0, MAX_SUGGESTIONS)
}

/** "10 Min · wenig Energie · Zuhause" or "Kurz kochen" (AC-5, AC-9). */
export function answersSummary(answers: CheckInAnswers): string {
  if (answers.kind === 'eat') return EAT_EFFORT_ANSWER_LABELS[answers.effort]
  return `${minutesLabel(answers.minutes)} · ${ENERGY_SUMMARY[answers.energy]} · ${PLACE_LABELS[answers.place]}`
}

export function fitsLine(answers: CheckInAnswers): string {
  return `Passt zu: ${answersSummary(answers)}`
}

/** The places the check-in offers; with only one the question is skipped (AC-2). */
export function placesToAsk(profile: Pick<ProfileAnswers, 'places'>): Place[] {
  const own = profile.places ?? []
  return PLACES.filter((place) => own.includes(place))
}

/** Whether last time's answers can still be offered as "Wie letztes Mal" (AC-5, EC-7). */
export function isAnswersStillValid(answers: CheckInAnswers, profile: Pick<ProfileAnswers, 'places'>): boolean {
  if (answers.kind === 'eat') return true
  return (
    (MINUTES_OPTIONS as readonly number[]).includes(answers.minutes) &&
    (ENERGIES as readonly string[]).includes(answers.energy) &&
    placesToAsk(profile).includes(answers.place)
  )
}

/** A started action shows on "Heute" for 12 hours, then it is no longer shown or nagged (AC-13, EC-8). */
export function isOpenOnToday(action: { status: ActionStatus; startedAt: Date }, now: Date): boolean {
  return action.status === 'started' && action.startedAt.getTime() > openSince(now).getTime()
}

/** Start of the 12-hour window in which a started action shows on "Heute" (AC-13, EC-8). */
export function openSince(now: Date): Date {
  return new Date(now.getTime() - OPEN_WINDOW_HOURS * HOUR_MS)
}

/** Start of the 72-hour window used for variety (AC-7, AC-8). */
export function recentSince(now: Date): Date {
  return new Date(now.getTime() - RECENT_WINDOW_HOURS * HOUR_MS)
}

export function isRecent(startedAt: Date, now: Date): boolean {
  return startedAt.getTime() > recentSince(now).getTime()
}

/** "Rückgängig" works until the person starts a new check-in (AC-15). */
export function canUndo(action: { status: ActionStatus; concludedAt: Date | null }, latestCheckInAt: Date | null): boolean {
  if (action.status === 'started' || !action.concludedAt) return false
  return latestCheckInAt === null || latestCheckInAt.getTime() <= action.concludedAt.getTime()
}

/** The detail view of a suggested item; opening it starts nothing (AC-10). */
export function detailHref(kind: Kind, itemId: string): string {
  return `${kind === 'move' ? '/bewegung' : '/essen'}/${encodeURIComponent(itemId)}`
}

/** Where a started action leads: the guided run without "leichter", or the meal detail (AC-12, AC-13). */
export function continueHref(kind: Kind, itemId: string): string {
  return kind === 'move' ? guidedHref(itemId, []) : detailHref('eat', itemId)
}
