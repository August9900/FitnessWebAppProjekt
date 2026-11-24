/**
 * Pure rules for PROJ-7 Abschlussfeedback: answers and labels of the two questions after
 * "Geschafft" (AC-1), and the two signals they give the daily suggestion — which content the
 * person said "Lieber nicht" to (AC-9, AC-10) and how far the workout intensity shifts after the
 * latest effort feedback (AC-11 to AC-14, EC-8). No IO, no framework; the current time is passed in.
 */

export const EFFORT_RATINGS = ['too_little', 'just_right', 'too_much'] as const
export const SUGGEST_AGAIN_ANSWERS = ['yes', 'no'] as const
export const FEEDBACK_QUESTIONS = ['effort', 'suggestAgain'] as const

export type EffortRating = (typeof EFFORT_RATINGS)[number]
export type SuggestAgain = (typeof SUGGEST_AGAIN_ANSWERS)[number]
export type FeedbackQuestion = (typeof FEEDBACK_QUESTIONS)[number]

/** The stored answers of one action; either may be missing — both questions are optional (AC-4). */
export type FeedbackAnswers = { effort: EffortRating | null; suggestAgain: SuggestAgain | null }

export const NO_FEEDBACK: FeedbackAnswers = { effort: null, suggestAgain: null }

export const QUESTION_TITLES = {
  effort: 'Wie war der Aufwand?',
  suggestAgain: 'Wieder vorschlagen?',
} satisfies Record<FeedbackQuestion, string>

export const EFFORT_LABELS = {
  too_little: 'Zu wenig',
  just_right: 'Passte',
  too_much: 'Zu viel',
} satisfies Record<EffortRating, string>

export const SUGGEST_AGAIN_LABELS = {
  yes: 'Gern wieder',
  no: 'Lieber nicht',
} satisfies Record<SuggestAgain, string>

/** One stored feedback with the content of its action — the raw input of both signals. */
export type FeedbackSignalRow = {
  /** The workout id for "Bewegen", the meal id for "Essen". */
  itemId: string
  effort: EffortRating | null
  effortAt: Date | null
  suggestAgain: SuggestAgain | null
  suggestAgainAt: Date | null
}

/**
 * −1 aims one intensity level gentler, 0 leaves the PROJ-6 rule as it is. There is no shift up:
 * "Zu wenig" is only stored — the energy of the moment already caps the intensity (AC-12).
 */
export type IntensityShift = -1 | 0

export const EFFORT_WINDOW_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

/** Only "Zu viel" shifts; "Zu wenig" and "Passte" give 0, so either lifts an earlier "Zu viel" (AC-11 to AC-13). */
const SHIFT_BY_EFFORT = { too_little: 0, just_right: 0, too_much: -1 } satisfies Record<EffortRating, IntensityShift>

/**
 * Content the person last answered "Lieber nicht" for (AC-9). Per content only the most recently
 * saved answer counts, so a later "Gern wieder" lifts it again (AC-10).
 */
export function dislikedIds(rows: FeedbackSignalRow[]): string[] {
  const latest = new Map<string, { answer: SuggestAgain; at: number }>()
  for (const row of rows) {
    if (!row.suggestAgain || !row.suggestAgainAt) continue
    const at = row.suggestAgainAt.getTime()
    const known = latest.get(row.itemId)
    if (!known || at > known.at) latest.set(row.itemId, { answer: row.suggestAgain, at })
  }
  return [...latest].filter(([, entry]) => entry.answer === 'no').map(([itemId]) => itemId)
}

/**
 * The shift from the latest saved effort feedback on a workout, if it is at most 14 days old
 * (AC-11 to AC-13, EC-8). Pass only "Bewegen" rows — meal feedback never shifts anything (AC-14).
 */
export function intensityShift(workoutRows: FeedbackSignalRow[], now: Date): IntensityShift {
  let latest: { effort: EffortRating; at: number } | null = null
  for (const row of workoutRows) {
    if (!row.effort || !row.effortAt) continue
    const at = row.effortAt.getTime()
    if (!latest || at > latest.at) latest = { effort: row.effort, at }
  }
  if (!latest || now.getTime() - latest.at > EFFORT_WINDOW_DAYS * DAY_MS) return 0
  return SHIFT_BY_EFFORT[latest.effort]
}

/** The line under "Passt zu: …" when the shift changed the main suggestion (AC-15). */
export const ADJUSTMENT_NOTE = 'Etwas sanfter, weil es letztes Mal zu viel war.'

export function adjustmentNote(shift: IntensityShift): string | null {
  return shift < 0 ? ADJUSTMENT_NOTE : null
}
