import type { Exercise } from '@/features/workouts/workouts.rules'
import {
  CUSTOM_TEXTS,
  addStep,
  customDetailHref,
  customEditHref,
  customEquipment,
  customGuidedHref,
  deleteQuestion,
  moveStep,
  newCustomHref,
  removeStep,
  setStepAmount,
  setStepMode,
  sortSummaries,
  stepCountLabel,
  toWorkoutSteps,
  type CustomStep,
} from './custom-workouts.rules'

const exercise = (id: string, equipment: Exercise['equipment'] = []): Exercise => ({
  id,
  name: `Übung ${id}`,
  instructions: 'Mach es so.',
  easierName: 'Leichter',
  easierInstructions: 'Mach es leichter.',
  equipment,
})

const a: CustomStep = { exerciseId: 'aaa', mode: 'time', amount: 30 }
const b: CustomStep = { exerciseId: 'bbb', mode: 'reps', amount: 10 }
const c: CustomStep = { exerciseId: 'ccc', mode: 'time', amount: 45 }
const ids = (steps: CustomStep[]) => steps.map((step) => step.exerciseId)

describe('Texte (AC-1, AC-10, AC-11)', () => {
  it('nutzt die Texte der Spec', () => {
    expect(CUSTOM_TEXTS.empty).toBe('Stell dir ein eigenes Workout aus den Übungen zusammen.')
    expect(CUSTOM_TEXTS.limit).toBe('Du hast schon 20 eigene Workouts. Lösch eines, um ein neues anzulegen.')
    expect(CUSTOM_TEXTS.gone).toBe('Dieses Workout gibt es nicht mehr.')
    expect(deleteQuestion('Mein Mix')).toBe('Workout „Mein Mix“ löschen?')
  })

  it('zählt Übungen in der Einzahl und Mehrzahl', () => {
    expect(stepCountLabel(1)).toBe('1 Übung')
    expect(stepCountLabel(3)).toBe('3 Übungen')
  })
})

describe('Übersicht (AC-1, EC-7)', () => {
  it('sortiert alphabetisch in deutscher Reihenfolge und erlaubt gleiche Namen', () => {
    const list = [
      { id: '1', name: 'Zirkel', stepCount: 2 },
      { id: '2', name: 'Übungsmix', stepCount: 1 },
      { id: '3', name: 'abends', stepCount: 4 },
      { id: '4', name: 'Zirkel', stepCount: 5 },
    ]
    expect(sortSummaries(list).map((entry) => entry.id)).toEqual(['3', '2', '1', '4'])
  })
})

describe('Folge bearbeiten (AC-2, AC-3, AC-4)', () => {
  it('hängt eine neue Übung mit 30 Sekunden ans Ende, auch dieselbe mehrfach', () => {
    expect(addStep([a], 'aaa')).toEqual([a, { exerciseId: 'aaa', mode: 'time', amount: 30 }])
  })

  it('verschiebt nach oben und unten und lässt die Ränder unverändert', () => {
    expect(ids(moveStep([a, b, c], 1, -1))).toEqual(['bbb', 'aaa', 'ccc'])
    expect(ids(moveStep([a, b, c], 1, 1))).toEqual(['aaa', 'ccc', 'bbb'])
    expect(moveStep([a, b, c], 0, -1)).toEqual([a, b, c])
    expect(moveStep([a, b, c], 2, 1)).toEqual([a, b, c])
  })

  it('entfernt genau die gewählte Übung', () => {
    expect(ids(removeStep([a, b, c], 1))).toEqual(['aaa', 'ccc'])
  })

  it('setzt beim Wechsel der Art den Standardwert dieser Art', () => {
    expect(setStepMode([a], 0, 'reps')).toEqual([{ exerciseId: 'aaa', mode: 'reps', amount: 10 }])
    expect(setStepMode([b], 0, 'time')).toEqual([{ exerciseId: 'bbb', mode: 'time', amount: 30 }])
    expect(setStepMode([a], 0, 'time')).toEqual([a])
  })

  it('setzt den Wert nur beim gewählten Schritt', () => {
    expect(setStepAmount([a, b], 1, 12)).toEqual([a, { ...b, amount: 12 }])
  })
})

describe('Durchführung und Detail (AC-7, AC-8)', () => {
  it('macht aus der Folge nummerierte Schritte mit ihren Übungen', () => {
    const steps = toWorkoutSteps([a, b, a], [exercise('aaa'), exercise('bbb', ['mat'])])
    expect(steps?.map((step) => [step.position, step.exercise.id, step.mode, step.amount])).toEqual([
      [1, 'aaa', 'time', 30],
      [2, 'bbb', 'reps', 10],
      [3, 'aaa', 'time', 30],
    ])
    expect(customEquipment(steps!)).toEqual(['mat'])
  })

  it('liefert null, wenn eine Übung fehlt', () => {
    expect(toWorkoutSteps([a, b], [exercise('aaa')])).toBeNull()
  })
})

describe('Adressen', () => {
  it('baut die Adressen unter /bewegung/eigene', () => {
    expect(newCustomHref()).toBe('/bewegung/eigene/neu')
    expect(customDetailHref('abc')).toBe('/bewegung/eigene/abc')
    expect(customEditHref('abc')).toBe('/bewegung/eigene/abc/bearbeiten')
    expect(customGuidedHref('abc', [])).toBe('/bewegung/eigene/abc/los')
    expect(customGuidedHref('abc', [3, 1, 3])).toBe('/bewegung/eigene/abc/los?leichter=1,3')
  })
})
