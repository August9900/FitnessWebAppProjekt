import { FIELD_MESSAGES, deleteCustomWorkoutSchema, fieldErrorsOf, saveCustomWorkoutSchema } from './custom-workouts.schema'

const ID = '55555555-5555-4555-8555-555555555555'
const step = (overrides: Record<string, unknown> = {}) => ({ exerciseId: 'kniebeuge', mode: 'time', amount: 30, ...overrides })
const input = (overrides: Record<string, unknown> = {}) => ({ id: ID, name: 'Mein Mix', steps: [step()], ...overrides })

describe('saveCustomWorkoutSchema (AC-6, AC-12)', () => {
  it('nimmt gültige Eingaben an und trimmt den Namen', () => {
    const parsed = saveCustomWorkoutSchema.parse(input({ name: '  Mein Mix  ' }))
    expect(parsed.name).toBe('Mein Mix')
  })

  it('prüft den Namen auf 2 bis 40 Zeichen nach dem Trimmen', () => {
    for (const name of ['', ' a ', 'x'.repeat(41)]) {
      const result = saveCustomWorkoutSchema.safeParse(input({ name }))
      expect(result.success).toBe(false)
      expect(fieldErrorsOf(result.error!).name).toBe(FIELD_MESSAGES.name)
    }
    expect(saveCustomWorkoutSchema.safeParse(input({ name: 'ab' })).success).toBe(true)
    expect(saveCustomWorkoutSchema.safeParse(input({ name: 'x'.repeat(40) })).success).toBe(true)
  })

  it('verlangt 1 bis 12 Übungen', () => {
    const empty = saveCustomWorkoutSchema.safeParse(input({ steps: [] }))
    expect(fieldErrorsOf(empty.error!).steps).toBe(FIELD_MESSAGES.stepsEmpty)
    const many = saveCustomWorkoutSchema.safeParse(input({ steps: Array.from({ length: 13 }, () => step()) }))
    expect(fieldErrorsOf(many.error!).steps).toBe(FIELD_MESSAGES.stepsTooMany)
    expect(saveCustomWorkoutSchema.safeParse(input({ steps: Array.from({ length: 12 }, () => step()) })).success).toBe(true)
  })

  it('prüft Sekunden (10–180, 5er-Schritte) und Wiederholungen (1–30) je Schritt', () => {
    for (const amount of [5, 185, 32, 30.5]) {
      const result = saveCustomWorkoutSchema.safeParse(input({ steps: [step(), step({ amount })] }))
      expect(fieldErrorsOf(result.error!).step).toEqual({ 1: FIELD_MESSAGES.seconds })
    }
    for (const amount of [0, 31, 2.5]) {
      const result = saveCustomWorkoutSchema.safeParse(input({ steps: [step({ mode: 'reps', amount })] }))
      expect(fieldErrorsOf(result.error!).step).toEqual({ 0: FIELD_MESSAGES.reps })
    }
    for (const amount of [10, 180, 95]) expect(saveCustomWorkoutSchema.safeParse(input({ steps: [step({ amount })] })).success).toBe(true)
    for (const amount of [1, 30]) {
      expect(saveCustomWorkoutSchema.safeParse(input({ steps: [step({ mode: 'reps', amount })] })).success).toBe(true)
    }
  })

  it('lehnt ungültige IDs, unbekannte Arten und zusätzliche Felder ab', () => {
    expect(saveCustomWorkoutSchema.safeParse(input({ id: 'x' })).success).toBe(false)
    expect(saveCustomWorkoutSchema.safeParse(input({ steps: [step({ mode: 'sets' })] })).success).toBe(false)
    expect(saveCustomWorkoutSchema.safeParse(input({ steps: [step({ exerciseId: '../x' })] })).success).toBe(false)
    expect(saveCustomWorkoutSchema.safeParse(input({ userId: 'u2' })).success).toBe(false)
    expect(saveCustomWorkoutSchema.safeParse(input({ steps: [step({ note: 'x' })] })).success).toBe(false)
  })
})

describe('deleteCustomWorkoutSchema', () => {
  it('verlangt genau eine gültige ID', () => {
    expect(deleteCustomWorkoutSchema.safeParse({ id: ID }).success).toBe(true)
    expect(deleteCustomWorkoutSchema.safeParse({ id: 'x' }).success).toBe(false)
    expect(deleteCustomWorkoutSchema.safeParse({ id: ID, name: 'x' }).success).toBe(false)
  })
})
