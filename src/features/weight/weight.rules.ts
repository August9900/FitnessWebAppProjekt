/**
 * Pure rules for PROJ-11 Gewichtsverlauf: who sees the area (AC-1, AC-2, AC-14), reading and showing
 * kilograms (AC-4, AC-5, AC-9), "not in the future" in the device's time zone (EC-5), the time
 * ranges and the points of the curve (AC-7, AC-8) and the texts. No IO, no framework.
 */
import type { StoredAgeBand } from '@/features/account/account.schema'
import { localDate } from '@/features/week/week.rules'

export const WEIGHT_PATH = '/gewicht'
export const RANGE_PARAM = 'zeitraum'

export const MIN_KG = 30
export const MAX_KG = 300

export const WEIGHT_RANGES = ['1m', '3m', '1j'] as const
export type WeightRange = (typeof WEIGHT_RANGES)[number]
export const DEFAULT_RANGE: WeightRange = '3m'

export const RANGE_LABELS = {
  '1m': '1 Monat',
  '3m': '3 Monate',
  '1j': '1 Jahr',
} satisfies Record<WeightRange, string>

const RANGE_MONTHS = { '1m': 1, '3m': 3, '1j': 12 } satisfies Record<WeightRange, number>

export const WEIGHT_TEXTS = {
  title: 'Gewicht',
  add: 'Eintragen',
  addTitle: 'Eintragen',
  editTitle: 'Eintrag ändern',
  dateLabel: 'Datum',
  weightLabel: 'Gewicht in kg',
  save: 'Speichern',
  cancel: 'Abbrechen',
  replace: 'Ersetzen',
  edit: 'Ändern',
  delete: 'Löschen',
  deleteAll: 'Alle Einträge löschen',
  deleteAllQuestion: 'Alle Gewichtseinträge löschen? Das lässt sich nicht rückgängig machen.',
  listTitle: 'Deine Einträge',
  rangeLabel: 'Zeitraum',
  empty: 'Hier siehst du deinen Verlauf, sobald du etwas einträgst.',
  tooFew: 'Zu wenige Einträge für eine Kurve.',
  gone: 'Diesen Eintrag gibt es nicht mehr.',
  failed: 'Das hat gerade nicht geklappt. Bitte versuch es noch einmal.',
  sectionTitle: 'Gewicht',
  visibilityLabel: 'Gewicht in der Navigation zeigen',
} as const

export type WeightEntry = { date: string; weightKg: number }

export type WeightAccessInput = { ageBand: StoredAgeBand | string | null | undefined; showWeightInNav: boolean | null | undefined }

/** Only the age band "ab 16" may use weight entries at all (AC-2). */
export function canUseWeight(ageBand: WeightAccessInput['ageBand']): boolean {
  return ageBand === '16_plus'
}

/** The area, its navigation entry and its actions exist only for "ab 16" with the setting on (AC-1, AC-2, AC-14). */
export function weightVisible(input: WeightAccessInput): boolean {
  return canUseWeight(input.ageBand) && input.showWeightInNav === true
}

export type ParsedWeight = { ok: true; weightKg: number } | { ok: false; reason: 'missing' | 'format' | 'range' }

const WEIGHT_PATTERN = /^\d{1,3}(?:[.,]\d)?$/

/** Kilograms typed by a person: comma or point, at most one decimal, 30,0 to 300,0 (AC-4, AC-5). */
export function parseWeight(value: unknown): ParsedWeight {
  if (typeof value !== 'string' || value.trim() === '') return { ok: false, reason: 'missing' }
  const text = value.trim()
  if (!WEIGHT_PATTERN.test(text)) return { ok: false, reason: 'format' }
  const weightKg = Number(text.replace(',', '.'))
  if (weightKg < MIN_KG || weightKg > MAX_KG) return { ok: false, reason: 'range' }
  return { ok: true, weightKg }
}

const kgFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** "72,4 kg" — always one decimal (AC-9). */
export function formatWeight(weightKg: number): string {
  return `${kgFormat.format(weightKg)} kg`
}

/** The value for an input field when editing: "72,4". */
export function weightInputValue(weightKg: number): string {
  return kgFormat.format(weightKg)
}

const dateFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const shortDateFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

/** "25. November 2026" for the list and the questions. */
export function formatDate(date: string): string {
  return dateFormat.format(toUtc(date))
}

/** "25.11.2026" for the axis of the curve. */
export function formatShortDate(date: string): string {
  return shortDateFormat.format(toUtc(date))
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar date in strict "YYYY-MM-DD" form. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false
  const parsed = toUtc(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/** Today in the device's time zone (EC-5). */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return localDate(now, timeZone)
}

/** True for days after today (AC-5). ISO dates compare as text. */
export function isFuture(date: string, today: string): boolean {
  return date > today
}

/** The range from the address; anything unknown is the default "3 Monate" (AC-7). */
export function parseRange(value: unknown): WeightRange {
  return WEIGHT_RANGES.find((range) => range === value) ?? DEFAULT_RANGE
}

/** The address of the area with a range; the default has no parameter. */
export function weightHref(range: WeightRange = DEFAULT_RANGE): string {
  return range === DEFAULT_RANGE ? WEIGHT_PATH : `${WEIGHT_PATH}?${RANGE_PARAM}=${range}`
}

/**
 * First day of a range: the same day one, three or twelve months earlier; a day the month does not
 * have becomes its last day (31 March minus one month → 28/29 February).
 */
export function rangeStart(today: string, range: WeightRange): string {
  const [year, month, day] = today.split('-').map(Number)
  const totalMonths = year * 12 + (month - 1) - RANGE_MONTHS[range]
  const startYear = Math.floor(totalMonths / 12)
  const startMonth = totalMonths % 12
  const lastDay = new Date(Date.UTC(startYear, startMonth + 1, 0)).getUTCDate()
  return new Date(Date.UTC(startYear, startMonth, Math.min(day, lastDay))).toISOString().slice(0, 10)
}

/** Newest first, as the list shows them (AC-9). */
export function newestFirst(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** The entries of a range, oldest first, from its first day up to today (AC-7). */
export function entriesInRange(entries: WeightEntry[], range: WeightRange, today: string): WeightEntry[] {
  const start = rangeStart(today, range)
  return entries
    .filter((entry) => entry.date >= start && entry.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export type ChartPoint = { x: number; y: number; date: string; weightKg: number }

export type Chart = {
  points: ChartPoint[]
  minKg: number
  maxKg: number
  firstDate: string
  lastDate: string
}

export type ChartBox = { width: number; height: number; padding: number }

/**
 * Points of the curve inside a box, or null with fewer than two entries (AC-8). Time runs left to
 * right across the range; the values span between the smallest and the largest with half a kilo of
 * room above and below, so a flat line sits in the middle. No targets, no trend — only positions.
 */
export function chartPoints(inRange: WeightEntry[], range: WeightRange, today: string, box: ChartBox): Chart | null {
  if (inRange.length < 2) return null
  const start = toUtc(rangeStart(today, range)).getTime()
  const end = toUtc(today).getTime()
  const span = Math.max(end - start, 1)
  const values = inRange.map((entry) => entry.weightKg)
  const minKg = Math.min(...values)
  const maxKg = Math.max(...values)
  const low = minKg - 0.5
  const high = maxKg + 0.5
  const innerWidth = box.width - 2 * box.padding
  const innerHeight = box.height - 2 * box.padding
  const points = inRange.map((entry) => ({
    x: box.padding + ((toUtc(entry.date).getTime() - start) / span) * innerWidth,
    y: box.padding + ((high - entry.weightKg) / (high - low)) * innerHeight,
    date: entry.date,
    weightKg: entry.weightKg,
  }))
  return { points, minKg, maxKg, firstDate: inRange[0].date, lastDate: inRange[inRange.length - 1].date }
}

/** „Für diesen Tag gibt es schon einen Eintrag (72,4 kg). Ersetzen?“ (AC-6) */
export function replaceQuestion(weightKg: number): string {
  return `Für diesen Tag gibt es schon einen Eintrag (${formatWeight(weightKg)}). Ersetzen?`
}

/** „Eintrag vom 25. November 2026 löschen?“ (AC-12) */
export function deleteQuestion(date: string): string {
  return `Eintrag vom ${formatDate(date)} löschen?`
}
