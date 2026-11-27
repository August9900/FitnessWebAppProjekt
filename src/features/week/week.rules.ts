/**
 * Pure rules for PROJ-8 Wochenblick: which calendar week is shown (AC-1, AC-12 to AC-15), how the
 * person's actions fall onto its days in their local time (AC-4 to AC-6, EC-2, EC-6), and every
 * text the view shows (AC-2, AC-3, AC-9 to AC-11). Calendar dates are plain "YYYY-MM-DD" strings;
 * the current time and the time zone are always passed in. No IO, no framework.
 */
import { KIND_LABELS, actionTitle, detailHref, type ActionStatus, type Kind } from '@/features/today/today.rules'

export const DEFAULT_TIME_ZONE = 'Europe/Berlin'
export const TIME_ZONE_COOKIE = 'pulse_tz'
export const WEEK_PATH = '/wochenblick'
export const WEEK_PARAM = 'woche'

export const WEEK_TEXTS = {
  current: 'Diese Woche',
  previous: 'Vorige Woche',
  previousLink: 'Vorige Woche',
  nextLink: 'Nächste Woche',
  today: 'heute',
  noEntry: '–',
  summaryCurrent: 'Diese Woche hast du etwas für dich getan.',
  summaryPast: 'In dieser Woche hast du etwas für dich getan.',
  emptyCurrent: 'Für diese Woche gibt es noch nichts. Auf „Heute“ findest du einen passenden nächsten Schritt.',
  toToday: 'Zu Heute',
} as const

export const WEEK_STATUS_LABELS = { done: 'geschafft', started: 'angefangen' } as const

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const
const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'] as const
const DAY_MS = 24 * 60 * 60 * 1000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_ZONE_PATTERN = /^[A-Za-z0-9_+\-/]{1,64}$/

/** A time zone the runtime knows, or Europe/Berlin — a manipulated cookie is never used as is. */
export function resolveTimeZone(value: unknown): string {
  if (typeof value !== 'string' || !TIME_ZONE_PATTERN.test(value)) return DEFAULT_TIME_ZONE
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

/** The calendar date of an instant in a time zone, as "YYYY-MM-DD" (daylight saving included). */
export function localDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function fromUtc(instant: Date): string {
  return instant.toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  return fromUtc(new Date(toUtc(date).getTime() + days * DAY_MS))
}

/** The Monday of the week that contains the date. */
export function mondayOf(date: string): string {
  const weekday = (toUtc(date).getUTCDay() + 6) % 7
  return addDays(date, -weekday)
}

/** A real calendar date in strict "YYYY-MM-DD" form, or null. */
export function parseDateParam(value: unknown): string | null {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null
  const parsed = toUtc(value)
  return !Number.isNaN(parsed.getTime()) && fromUtc(parsed) === value ? value : null
}

export type WeekWindow = {
  /** Monday of the week to show. */
  monday: string
  /** Monday of the week that contains "now". */
  currentMonday: string
  /** Monday of the week the account was created in — nothing can lie before it. */
  earliestMonday: string
  /** Today's date in the person's time zone. */
  today: string
}

/**
 * Which week to show (AC-15): any valid date stands for its week; an invalid date, a week after the
 * current one or before the account's first week shows the current week.
 */
export function resolveWeek(input: { param: unknown; now: Date; timeZone: string; accountCreatedAt: Date }): WeekWindow {
  const today = localDate(input.now, input.timeZone)
  const currentMonday = mondayOf(today)
  const earliestMonday = mondayOf(localDate(input.accountCreatedAt, input.timeZone))
  const requested = parseDateParam(input.param)
  const monday = requested ? mondayOf(requested) : currentMonday
  const valid = monday <= currentMonday && monday >= earliestMonday
  return { monday: valid ? monday : currentMonday, currentMonday, earliestMonday, today }
}

/**
 * The instants to read: one day before Monday 00:00 UTC up to one day after the following Monday —
 * wide enough for every time zone; the exact day follows from each action's local date.
 */
export function queryRange(monday: string): { from: Date; to: Date } {
  return { from: toUtc(addDays(monday, -1)), to: toUtc(addDays(monday, 8)) }
}

/** An action as the data module delivers it. */
export type WeekActionInput = {
  id: string
  kind: Kind
  itemId: string
  status: ActionStatus
  startedAt: Date
  /** Null when the content is no longer offered. */
  title: string | null
}

export type WeekEntry = {
  id: string
  kindLabel: string
  title: string
  /** The detail view; null when the content is no longer offered (EC-1). */
  href: string | null
  statusLabel: (typeof WEEK_STATUS_LABELS)[keyof typeof WEEK_STATUS_LABELS]
}

export type WeekDay = { date: string; label: string; isToday: boolean; entries: WeekEntry[] }

export type Week = {
  monday: string
  isCurrent: boolean
  /** "Diese Woche", "Vorige Woche", or null for older weeks (the range alone, AC-12). */
  heading: string | null
  range: string
  summary: string | null
  days: WeekDay[]
  /** Only the current week without any entry shows the hint with the way to "Heute" (AC-11). */
  showEmptyHint: boolean
  previousHref: string | null
  nextHref: string | null
}

function dayAndMonth(date: string): { day: number; month: string; year: number } {
  const instant = toUtc(date)
  return { day: instant.getUTCDate(), month: MONTHS[instant.getUTCMonth()], year: instant.getUTCFullYear() }
}

/** "17.–23. Nov.", "30. Nov.–6. Dez.", across a year or in another year with the years. */
export function rangeLabel(monday: string, currentMonday: string): string {
  const start = dayAndMonth(monday)
  const end = dayAndMonth(addDays(monday, 6))
  const currentYear = dayAndMonth(currentMonday).year
  if (start.year !== end.year || start.year !== currentYear) {
    return `${start.day}. ${start.month} ${start.year} – ${end.day}. ${end.month} ${end.year}`
  }
  if (start.month === end.month) return `${start.day}.–${end.day}. ${end.month}`
  return `${start.day}. ${start.month}–${end.day}. ${end.month}`
}

/** "Mo 17." */
export function dayLabel(date: string): string {
  const weekday = (toUtc(date).getUTCDay() + 6) % 7
  return `${WEEKDAYS[weekday]} ${toUtc(date).getUTCDate()}.`
}

function weekHref(monday: string, currentMonday: string): string {
  return monday === currentMonday ? WEEK_PATH : `${WEEK_PATH}?${WEEK_PARAM}=${monday}`
}

/**
 * The week to show: seven days Monday to Sunday with "heute", each with the actions "geschafft" or
 * "begonnen" that started on that local date, in order of their start (AC-1 to AC-6, EC-2, EC-6);
 * "heute nicht" and actions outside the week are left out. Plus heading, summary and paging.
 */
export function buildWeek(window: WeekWindow, actions: WeekActionInput[], timeZone: string): Week {
  const { monday, currentMonday, earliestMonday, today } = window
  const dates = Array.from({ length: 7 }, (_, index) => addDays(monday, index))

  const byDate = new Map<string, WeekActionInput[]>()
  for (const action of actions) {
    if (action.status !== 'done' && action.status !== 'started') continue
    const date = localDate(action.startedAt, timeZone)
    if (!dates.includes(date)) continue
    byDate.set(date, [...(byDate.get(date) ?? []), action])
  }

  const days: WeekDay[] = dates.map((date) => ({
    date,
    label: dayLabel(date),
    isToday: date === today,
    entries: (byDate.get(date) ?? [])
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .map((action) => ({
        id: action.id,
        kindLabel: KIND_LABELS[action.kind],
        title: actionTitle(action),
        href: action.title === null ? null : detailHref(action.kind, action.itemId),
        statusLabel: WEEK_STATUS_LABELS[action.status as 'done' | 'started'],
      })),
  }))

  const isCurrent = monday === currentMonday
  const anyDone = [...byDate.values()].flat().some((action) => action.status === 'done')
  const anyEntry = days.some((day) => day.entries.length > 0)

  return {
    monday,
    isCurrent,
    heading: isCurrent ? WEEK_TEXTS.current : monday === addDays(currentMonday, -7) ? WEEK_TEXTS.previous : null,
    range: rangeLabel(monday, currentMonday),
    summary: anyDone ? (isCurrent ? WEEK_TEXTS.summaryCurrent : WEEK_TEXTS.summaryPast) : null,
    days,
    showEmptyHint: isCurrent && !anyEntry,
    previousHref: monday > earliestMonday ? weekHref(addDays(monday, -7), currentMonday) : null,
    nextHref: monday < currentMonday ? weekHref(addDays(monday, 7), currentMonday) : null,
  }
}
