/**
 * Pure rules for PROJ-10 Eigene Trainingspläne: the limits and texts (AC-6, AC-11), editing the
 * sequence in the editor (AC-2, AC-3), the overview (AC-1, EC-7), turning an own workout into the
 * steps the guided run plays (AC-7, AC-8) and the addresses. No IO, no framework.
 */
import { TODAY_MESSAGES } from '@/features/today/today.rules'
import { EASIER_PARAM, workoutEquipment, type Exercise, type StepMode, type WorkoutStep } from '@/features/workouts/workouts.rules'

export const LIMITS = {
  nameMin: 2,
  nameMax: 40,
  stepsMin: 1,
  stepsMax: 12,
  secondsMin: 10,
  secondsMax: 180,
  secondsStep: 5,
  repsMin: 1,
  repsMax: 30,
  workoutsMax: 20,
} as const

/** What a new step starts with, and what a step gets when its kind changes (AC-2, AC-3). */
export const DEFAULT_AMOUNT = { time: 30, reps: 10 } satisfies Record<StepMode, number>

export const CUSTOM_TEXTS = {
  section: 'Deine Workouts',
  empty: 'Stell dir ein eigenes Workout aus den Übungen zusammen.',
  newWorkout: 'Neues Workout',
  newTitle: 'Neues Workout',
  editTitle: 'Workout bearbeiten',
  name: 'Name',
  sequence: 'Übungen',
  addExercise: 'Übung hinzufügen',
  add: 'Hinzufügen',
  done: 'Fertig',
  modeLabel: 'Art',
  amountLabel: 'Wert',
  seconds: 'Sekunden',
  reps: 'Wiederholungen',
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',
  remove: 'Entfernen',
  save: 'Speichern',
  saving: 'Wird gespeichert …',
  cancel: 'Abbrechen',
  edit: 'Bearbeiten',
  delete: 'Löschen',
  start: "Los geht's",
  equipment: 'Ausstattung',
  gone: 'Dieses Workout gibt es nicht mehr.',
  saveAsNew: 'Als neues Workout speichern',
  limit: 'Du hast schon 20 eigene Workouts. Lösch eines, um ein neues anzulegen.',
  unknownExercise: 'Eine Übung gibt es nicht mehr. Bitte entferne sie.',
  failed: TODAY_MESSAGES.failed,
  notFound: 'Dieses Workout gibt es nicht (mehr)',
  toBewegung: 'Zu Bewegung',
} as const

export const MODE_LABELS = { time: CUSTOM_TEXTS.seconds, reps: CUSTOM_TEXTS.reps } satisfies Record<StepMode, string>

export function deleteQuestion(name: string): string {
  return `Workout „${name}“ löschen?`
}

export type CustomStep = { exerciseId: string; mode: StepMode; amount: number }
export type CustomWorkout = { id: string; name: string; steps: CustomStep[] }
export type CustomWorkoutSummary = { id: string; name: string; stepCount: number }

/** "1 Übung", "3 Übungen" (AC-1). */
export function stepCountLabel(count: number): string {
  return count === 1 ? '1 Übung' : `${count} Übungen`
}

const collator = new Intl.Collator('de', { sensitivity: 'base' })

/** The overview, alphabetically by name; equal names keep their order (AC-1, EC-7). */
export function sortSummaries(list: CustomWorkoutSummary[]): CustomWorkoutSummary[] {
  return [...list].sort((a, b) => collator.compare(a.name, b.name))
}

/** A new exercise goes to the end with 30 seconds (AC-2); the same exercise may appear again (AC-4). */
export function addStep(steps: CustomStep[], exerciseId: string): CustomStep[] {
  return [...steps, { exerciseId, mode: 'time', amount: DEFAULT_AMOUNT.time }]
}

/** Moves a step one place up (−1) or down (+1); at either end nothing changes (AC-3). */
export function moveStep(steps: CustomStep[], index: number, direction: -1 | 1): CustomStep[] {
  const target = index + direction
  if (index < 0 || index >= steps.length || target < 0 || target >= steps.length) return steps
  const next = [...steps]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function removeStep(steps: CustomStep[], index: number): CustomStep[] {
  return steps.filter((_, position) => position !== index)
}

/** Switching between seconds and repetitions starts the step with that kind's default (AC-3). */
export function setStepMode(steps: CustomStep[], index: number, mode: StepMode): CustomStep[] {
  return steps.map((step, position) =>
    position === index && step.mode !== mode ? { ...step, mode, amount: DEFAULT_AMOUNT[mode] } : step
  )
}

export function setStepAmount(steps: CustomStep[], index: number, amount: number): CustomStep[] {
  return steps.map((step, position) => (position === index ? { ...step, amount } : step))
}

/**
 * The own workout as the steps the detail and the guided run show (AC-7, AC-8), with positions
 * 1…n. Null when an exercise is missing — the page then treats the workout as unusable.
 */
export function toWorkoutSteps(steps: CustomStep[], exercises: Exercise[]): WorkoutStep[] | null {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const result: WorkoutStep[] = []
  for (const [index, step] of steps.entries()) {
    const exercise = byId.get(step.exerciseId)
    if (!exercise) return null
    result.push({ position: index + 1, mode: step.mode, amount: step.amount, exercise })
  }
  return result
}

/** The equipment an own workout needs: the union of its exercises' (AC-7). */
export function customEquipment(steps: WorkoutStep[]) {
  return workoutEquipment({ steps })
}

export const CUSTOM_BASE = '/bewegung/eigene'

export function newCustomHref(): string {
  return `${CUSTOM_BASE}/neu`
}

export function customDetailHref(id: string): string {
  return `${CUSTOM_BASE}/${encodeURIComponent(id)}`
}

export function customEditHref(id: string): string {
  return `${customDetailHref(id)}/bearbeiten`
}

/** The guided run of an own workout with the "leichter" choice (AC-8). */
export function customGuidedHref(id: string, easier: number[]): string {
  const base = `${customDetailHref(id)}/los`
  if (easier.length === 0) return base
  return `${base}?${EASIER_PARAM}=${[...new Set(easier)].sort((a, b) => a - b).join(',')}`
}
