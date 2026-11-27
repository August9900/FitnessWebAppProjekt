/**
 * Checking a weight entry before it is saved — in the browser and again in the server action (AC-5,
 * EC-5). Returns the value to save or one message per field.
 */
import { z } from 'zod'
import { isFuture, isIsoDate, parseWeight } from './weight.rules'

export const WEIGHT_MESSAGES = {
  weightMissing: 'Bitte gib dein Gewicht ein.',
  weightFormat: 'Bitte gib eine Zahl mit höchstens einer Nachkommastelle ein, z. B. 72,4.',
  weightRange: 'Bitte gib einen Wert zwischen 30 und 300 kg ein.',
  dateMissing: 'Bitte wähl ein Datum.',
  dateFuture: 'Das Datum darf nicht in der Zukunft liegen.',
} as const

const WEIGHT_REASON_MESSAGES = {
  missing: WEIGHT_MESSAGES.weightMissing,
  format: WEIGHT_MESSAGES.weightFormat,
  range: WEIGHT_MESSAGES.weightRange,
} as const

/** What the form or the action receives. `weight` is the typed text ("72,4"). */
export const weightEntryInputSchema = z.object({
  date: z.unknown(),
  weight: z.unknown(),
  previousDate: z.unknown().optional(),
  replace: z.unknown().optional(),
})

export type WeightEntryInput = z.input<typeof weightEntryInputSchema>

export type ValidWeightEntry = {
  date: string
  weightKg: number
  /** Set when an existing entry is changed (AC-11). */
  previousDate: string | null
  replace: boolean
}

export type WeightFieldErrors = { date?: string; weight?: string }

export type WeightValidation = { ok: true; value: ValidWeightEntry } | { ok: false; errors: WeightFieldErrors }

/** Every rule of AC-5, with "today" in the device's time zone (EC-5). */
export function validateWeightEntry(input: unknown, today: string): WeightValidation {
  const parsed = weightEntryInputSchema.safeParse(input)
  const raw = parsed.success ? parsed.data : { date: undefined, weight: undefined }
  const errors: WeightFieldErrors = {}

  const date = typeof raw.date === 'string' ? raw.date.trim() : ''
  if (!isIsoDate(date)) errors.date = WEIGHT_MESSAGES.dateMissing
  else if (isFuture(date, today)) errors.date = WEIGHT_MESSAGES.dateFuture

  const weight = parseWeight(raw.weight)
  if (!weight.ok) errors.weight = WEIGHT_REASON_MESSAGES[weight.reason]

  const previous = parsed.success ? parsed.data.previousDate : undefined
  const previousDate = previous === undefined || previous === null || previous === '' ? null : previous
  if (previousDate !== null && !isIsoDate(previousDate)) errors.date ??= WEIGHT_MESSAGES.dateMissing

  if (errors.date || errors.weight || !weight.ok) return { ok: false, errors }
  return {
    ok: true,
    value: {
      date,
      weightKg: weight.weightKg,
      previousDate: previousDate as string | null,
      replace: parsed.success && parsed.data.replace === true,
    },
  }
}
