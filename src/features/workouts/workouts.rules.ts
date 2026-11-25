/**
 * Pure rules for PROJ-4 Kurze Workouts: the content types, labels, the "passt"-rule with its
 * reason (AC-2, AC-4), the duration filter (AC-3) and the "leichter" choice in the address (AC-7).
 * No IO, no framework.
 */
import type { ProfileAnswers } from '@/features/profile/profile.rules'
import { EQUIPMENT, LABELS, type Equipment, type Experience, type Place } from '@/features/profile/profile.schema'

export const DURATIONS = [5, 10, 15] as const
export const INTENSITIES = ['gentle', 'moderate', 'vigorous'] as const
export const STEP_MODES = ['time', 'reps'] as const
export const REVIEW_STATUSES = ['unreviewed', 'reviewed'] as const

export type Duration = (typeof DURATIONS)[number]
export type Intensity = (typeof INTENSITIES)[number]
export type StepMode = (typeof STEP_MODES)[number]
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]
/** Equipment an exercise can need — the PROJ-3 codes without "Nichts davon". */
export type ExerciseEquipment = Exclude<Equipment, 'none'>

export const EXERCISE_EQUIPMENT = EQUIPMENT.filter((code): code is ExerciseEquipment => code !== 'none')

export type Exercise = {
  id: string
  name: string
  instructions: string
  easierName: string
  easierInstructions: string
  equipment: ExerciseEquipment[]
  /** PROJ-9 AC-11: a pause such as „Kurze Pause“ — not a library exercise. Missing = not a pause. */
  isPause?: boolean
}

export type WorkoutStep = {
  position: number
  mode: StepMode
  amount: number
  exercise: Exercise
}

export type Workout = {
  id: string
  title: string
  description: string
  durationMinutes: Duration
  intensity: Intensity
  places: Place[]
  reviewStatus: ReviewStatus
  steps: WorkoutStep[]
}

export const INTENSITY_LABELS = {
  gentle: 'sanft',
  moderate: 'mittel',
  vigorous: 'kräftig',
} satisfies Record<Intensity, string>

/** Used in the reason "kräftige Intensität" (AC-4). */
const INTENSITY_ADJECTIVES = {
  gentle: 'sanfte',
  moderate: 'mittlere',
  vigorous: 'kräftige',
} satisfies Record<Intensity, string>

export const PLACE_LABELS = LABELS.places
export const EQUIPMENT_LABELS = LABELS.homeEquipment
export const NO_EQUIPMENT_LABEL = 'Ohne Ausstattung'

/** How a place reads after "nur …" in a reason. */
const PLACE_PHRASES = {
  home: 'zuhause',
  outdoors: 'draußen',
  gym: 'im Fitnessstudio',
} satisfies Record<Place, string>

export function durationLabel(minutes: number): string {
  return `${minutes} Min`
}

export const SAFETY_NOTE = 'Hör auf deinen Körper. Bei Schmerzen hörst du auf.'

/** "30 Sekunden" or "10 Wiederholungen" (AC-6, AC-8). */
export function amountLabel(step: Pick<WorkoutStep, 'mode' | 'amount'>): string {
  if (step.mode === 'time') return `${step.amount} ${step.amount === 1 ? 'Sekunde' : 'Sekunden'}`
  return `${step.amount} ${step.amount === 1 ? 'Wiederholung' : 'Wiederholungen'}`
}

/** "A", "A und B", "A, B und C" (or with "oder"). */
function joinList(parts: string[], conjunction: 'und' | 'oder'): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} ${conjunction} ${parts[parts.length - 1]}`
}

/** The equipment a workout needs: the union of its exercises', in the PROJ-3 order. */
export function workoutEquipment(workout: Pick<Workout, 'steps'>): ExerciseEquipment[] {
  const needed = new Set(workout.steps.flatMap((step) => step.exercise.equipment))
  return EXERCISE_EQUIPMENT.filter((code) => needed.has(code))
}

export function equipmentText(equipment: ExerciseEquipment[]): string {
  return equipment.length === 0 ? NO_EQUIPMENT_LABEL : equipment.map((code) => EQUIPMENT_LABELS[code]).join(', ')
}

const ALLOWED_INTENSITIES = {
  beginner: ['gentle'],
  occasional: ['gentle', 'moderate'],
  regular: ['gentle', 'moderate', 'vigorous'],
} satisfies Record<Experience, Intensity[]>

export type Fit = { fits: true } | { fits: false; reason: string }

type FitAnswers = Pick<ProfileAnswers, 'experience' | 'places' | 'homeEquipment'>

/**
 * Whether a workout fits a person (AC-2): doable at one of their places — at home only with all
 * needed equipment, outdoors and in the gym without an equipment check — and an intensity that
 * matches their experience. When it does not fit, exactly one short reason (AC-4), in this order:
 * no shared place → equipment missing at home → intensity.
 */
export function fitOf(workout: Pick<Workout, 'places' | 'intensity' | 'steps'>, answers: FitAnswers): Fit {
  const personPlaces = answers.places ?? []
  const sharedPlaces = workout.places.filter((place) => personPlaces.includes(place))

  if (sharedPlaces.length === 0) {
    return { fits: false, reason: `nur ${joinList(workout.places.map((place) => PLACE_PHRASES[place]), 'oder')}` }
  }

  const atHome = answers.homeEquipment ?? []
  const missing = workoutEquipment(workout).filter((code) => !(atHome as string[]).includes(code))
  const doableSomewhere = sharedPlaces.some((place) => place !== 'home' || missing.length === 0)

  if (!doableSomewhere) {
    return { fits: false, reason: `braucht ${joinList(missing.map((code) => EQUIPMENT_LABELS[code]), 'und')}` }
  }

  const allowed: Intensity[] = answers.experience ? ALLOWED_INTENSITIES[answers.experience] : []
  if (!allowed.includes(workout.intensity)) {
    return { fits: false, reason: `${INTENSITY_ADJECTIVES[workout.intensity]} Intensität` }
  }

  return { fits: true }
}

export const DURATION_FILTERS = ['all', ...DURATIONS] as const
export type DurationFilter = (typeof DURATION_FILTERS)[number]

export function durationFilterLabel(filter: DurationFilter): string {
  return filter === 'all' ? 'Alle' : durationLabel(filter)
}

/** Only the workouts of the chosen duration (AC-3). */
export function filterByDuration<T extends Pick<Workout, 'durationMinutes'>>(workouts: T[], filter: DurationFilter): T[] {
  return filter === 'all' ? workouts : workouts.filter((workout) => workout.durationMinutes === filter)
}

/** The exercise as shown: the easier variant when chosen (AC-7). */
export function shownExercise(exercise: Exercise, easier: boolean): { name: string; instructions: string } {
  return easier
    ? { name: exercise.easierName, instructions: exercise.easierInstructions }
    : { name: exercise.name, instructions: exercise.instructions }
}

export const EASIER_PARAM = 'leichter'

/**
 * Reads the "leichter" choice from the address (`?leichter=2,4`). Only positions the workout
 * actually has count; anything else is silently ignored (design → Fehler an den Schnittstellen).
 */
export function parseEasier(value: string | string[] | undefined, positions: number[]): number[] {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '')
  const chosen = new Set<number>()
  for (const part of raw.split(',')) {
    const trimmed = part.trim()
    if (!/^\d{1,3}$/.test(trimmed)) continue
    const position = Number(trimmed)
    if (positions.includes(position)) chosen.add(position)
  }
  return [...chosen].sort((a, b) => a - b)
}

/** The address of the guided view with the "leichter" choice (AC-7, AC-8). */
export function guidedHref(workoutId: string, easier: number[]): string {
  const base = `/bewegung/${encodeURIComponent(workoutId)}/los`
  if (easier.length === 0) return base
  return `${base}?${EASIER_PARAM}=${[...new Set(easier)].sort((a, b) => a - b).join(',')}`
}
