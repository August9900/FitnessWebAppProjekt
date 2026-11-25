/**
 * Pure rules for PROJ-9 Übungsbibliothek: which filters exist and apply (AC-4, AC-5, EC-2, EC-4),
 * the alphabetical order (AC-3), where an exercise occurs (AC-8, EC-3), the addresses that keep the
 * chosen filter (AC-6, AC-9), that pauses stay out of the library (AC-11) and the texts. No IO, no framework.
 */
import type { ProfileAnswers } from '@/features/profile/profile.rules'
import { durationLabel, equipmentText, type Exercise, type Workout } from '@/features/workouts/workouts.rules'

export const LIBRARY_PATH = '/bewegung/uebungen'
export const FILTER_PARAM = 'filter'

export const EXERCISE_FILTERS = ['alle', 'ohne-ausstattung', 'zuhause'] as const
export type ExerciseFilter = (typeof EXERCISE_FILTERS)[number]

export const FILTER_LABELS = {
  alle: 'Alle',
  'ohne-ausstattung': 'Ohne Ausstattung',
  zuhause: 'Passt zu meinem Zuhause',
} satisfies Record<ExerciseFilter, string>

export const LIBRARY_TEXTS = {
  title: 'Übungen',
  lookUp: 'Übungen nachschlagen',
  noMatch: 'Keine Übung passt zu diesem Filter.',
  showAll: 'Alle zeigen',
  backToList: 'Alle Übungen',
  easier: 'Leichter',
  equipment: 'Ausstattung',
  usedIn: 'Kommt vor in',
  usedInNone: 'Gerade in keinem Workout.',
  notFound: 'Diese Übung gibt es nicht',
} as const

type ProfileForLibrary = Pick<ProfileAnswers, 'places' | 'homeEquipment'>

function hasHome(profile: ProfileForLibrary): boolean {
  return (profile.places ?? []).includes('home')
}

/** The filters on offer: "Passt zu meinem Zuhause" only with "Zuhause" in the profile (AC-5, EC-4). */
export function offeredFilters(profile: ProfileForLibrary): ExerciseFilter[] {
  return EXERCISE_FILTERS.filter((filter) => filter !== 'zuhause' || hasHome(profile))
}

/** The filter from the address; anything unknown or not on offer shows all exercises (EC-2, EC-4). */
export function parseFilter(value: unknown, profile: ProfileForLibrary): ExerciseFilter {
  if (typeof value !== 'string') return 'alle'
  const filter = EXERCISE_FILTERS.find((entry) => entry === value)
  return filter && offeredFilters(profile).includes(filter) ? filter : 'alle'
}

/** The exercises the library shows: everything except pauses such as „Kurze Pause“ (AC-3, AC-11). */
export function libraryExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((exercise) => exercise.isPause !== true)
}

const collator = new Intl.Collator('de', { sensitivity: 'base' })

/** All exercises the filter lets through, alphabetically in German order (AC-3 to AC-5). */
export function filterExercises(exercises: Exercise[], filter: ExerciseFilter, profile: ProfileForLibrary): Exercise[] {
  const atHome = (profile.homeEquipment ?? []) as string[]
  const kept = exercises.filter((exercise) => {
    if (filter === 'ohne-ausstattung') return exercise.equipment.length === 0
    if (filter === 'zuhause') return exercise.equipment.every((code) => atHome.includes(code))
    return true
  })
  return [...kept].sort((a, b) => collator.compare(a.name, b.name))
}

export function exerciseEquipmentText(exercise: Pick<Exercise, 'equipment'>): string {
  return equipmentText(exercise.equipment)
}

function withFilter(path: string, filter: ExerciseFilter): string {
  return filter === 'alle' ? path : `${path}?${FILTER_PARAM}=${filter}`
}

/** The list with a filter; "Alle" has no parameter. */
export function libraryHref(filter: ExerciseFilter = 'alle'): string {
  return withFilter(LIBRARY_PATH, filter)
}

/** An exercise's detail; the filter travels along so "Alle Übungen" returns to it (AC-6, AC-9). */
export function exerciseHref(exerciseId: string, filter: ExerciseFilter = 'alle'): string {
  return withFilter(`${LIBRARY_PATH}/${encodeURIComponent(exerciseId)}`, filter)
}

/** An exercise's library address for a linked name, or null for a pause — its name stays plain text (AC-2, AC-11). */
export function libraryExerciseHref(exercise: Pick<Exercise, 'id' | 'isPause'>): string | null {
  return exercise.isPause === true ? null : exerciseHref(exercise.id)
}

export type UsedInWorkout = { id: string; title: string; duration: string; href: string }

/**
 * The offered workouts whose steps contain the exercise, in offer order and each only once
 * (AC-8). Workouts no longer offered are not in the input, so they never appear (EC-3).
 */
export function workoutsUsing(exerciseId: string, offeredWorkouts: Workout[]): UsedInWorkout[] {
  return offeredWorkouts
    .filter((workout) => workout.steps.some((step) => step.exercise.id === exerciseId))
    .map((workout) => ({
      id: workout.id,
      title: workout.title,
      duration: durationLabel(workout.durationMinutes),
      href: `/bewegung/${encodeURIComponent(workout.id)}`,
    }))
}
