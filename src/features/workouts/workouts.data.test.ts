export {}

vi.mock('server-only', () => ({}))

type Result = { data: unknown; error: { code?: string } | null }
const calls: { table?: string; select?: string; eq: [string, unknown][]; order: string[] } = { eq: [], order: [] }
let listResult: Result = { data: [], error: null }
let singleResult: Result = { data: null, error: null }

function chain() {
  const builder = {
    select(columns: string) {
      calls.select = columns
      return builder
    },
    eq(column: string, value: unknown) {
      calls.eq.push([column, value])
      return builder
    },
    order(column: string) {
      calls.order.push(column)
      return Promise.resolve(listResult)
    },
    maybeSingle() {
      return Promise.resolve(singleResult)
    },
  }
  return builder
}

const from = vi.fn((table: string) => {
  calls.table = table
  return chain()
})
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from }) }))

const data = await import('./workouts.data')

const exercise = (id: string, equipment: string[] = [], isPause = false) => ({
  id,
  name: `Übung ${id}`,
  instructions: 'Mach es so.',
  easier_name: `Leicht ${id}`,
  easier_instructions: 'Mach es leichter.',
  equipment,
  is_pause: isPause,
})

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'morgen_mobil_5',
  title: 'Morgens mobil',
  description: 'Sanft wach werden.',
  duration_minutes: 5,
  intensity: 'gentle',
  places: ['home', 'outdoors'],
  review_status: 'unreviewed',
  workout_steps: [
    { position: 2, mode: 'reps', amount: 10, exercises: exercise('squat', ['mat']) },
    { position: 1, mode: 'time', amount: 30, exercises: exercise('march') },
  ],
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  calls.eq = []
  calls.order = []
  calls.select = undefined
  calls.table = undefined
  listResult = { data: [], error: null }
  singleResult = { data: null, error: null }
})

describe('getOfferedWorkouts (AC-1)', () => {
  it('liest angebotene Workouts mit Schritten und Übungen in einer Abfrage, sortiert', async () => {
    listResult = { data: [row()], error: null }
    const workouts = await data.getOfferedWorkouts()

    expect(from).toHaveBeenCalledTimes(1)
    expect(calls.table).toBe('workouts')
    expect(calls.select).toMatch(/workout_steps\s*\(/)
    expect(calls.select).toMatch(/exercises\s*\(/)
    expect(calls.eq).toContainEqual(['is_offered', true])
    expect(calls.order).toEqual(['sort_order'])

    expect(workouts).toEqual([
      {
        id: 'morgen_mobil_5',
        title: 'Morgens mobil',
        description: 'Sanft wach werden.',
        durationMinutes: 5,
        intensity: 'gentle',
        places: ['home', 'outdoors'],
        reviewStatus: 'unreviewed',
        steps: [
          {
            position: 1,
            mode: 'time',
            amount: 30,
            exercise: {
              id: 'march',
              name: 'Übung march',
              instructions: 'Mach es so.',
              easierName: 'Leicht march',
              easierInstructions: 'Mach es leichter.',
              equipment: [],
              isPause: false,
            },
          },
          expect.objectContaining({ position: 2, mode: 'reps', amount: 10 }),
        ],
      },
    ])
  })

  it('lässt unpassende Zeilen und Workouts ohne Schritte weg', async () => {
    listResult = {
      data: [row({ id: 'a_ok' }), row({ id: 'b_bad', intensity: 'extrem' }), row({ id: 'c_empty', workout_steps: [] })],
      error: null,
    }
    expect((await data.getOfferedWorkouts()).map((w) => w.id)).toEqual(['a_ok'])
  })

  it('wirft, wenn das Lesen scheitert, statt eine leere Liste zu zeigen', async () => {
    listResult = { data: null, error: { code: '42501' } }
    await expect(data.getOfferedWorkouts()).rejects.toThrow('could not be read')
  })
})

describe('getWorkout (AC-6, EC-2)', () => {
  it('liest ein angebotenes Workout per ID', async () => {
    singleResult = { data: row(), error: null }
    const workout = await data.getWorkout('morgen_mobil_5')
    expect(workout?.id).toBe('morgen_mobil_5')
    expect(calls.eq).toEqual([
      ['id', 'morgen_mobil_5'],
      ['is_offered', true],
    ])
  })

  it('liefert null für ein Workout, das es nicht (mehr) gibt', async () => {
    singleResult = { data: null, error: null }
    await expect(data.getWorkout('gibt_es_nicht')).resolves.toBeNull()
  })

  it('fragt bei einer ungültigen ID gar nicht erst nach', async () => {
    await expect(data.getWorkout('../../etc')).resolves.toBeNull()
    await expect(data.getWorkout('Gross-Buchstaben')).resolves.toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('wirft, wenn das Lesen scheitert', async () => {
    singleResult = { data: null, error: { code: '500' } }
    await expect(data.getWorkout('morgen_mobil_5')).rejects.toThrow('could not be read')
  })
})

describe('Übungen für die Bibliothek (PROJ-9 AC-3, AC-7, EC-2, EC-5)', () => {
  it('liest alle Übungen in einer Abfrage', async () => {
    listResult = { data: [exercise('kniebeuge', ['mat']), exercise('marschieren')], error: null }
    const exercises = await data.getAllExercises()

    expect(from).toHaveBeenCalledTimes(1)
    expect(calls.table).toBe('exercises')
    expect(calls.select).toContain('easier_instructions')
    expect(exercises).toEqual([
      { id: 'kniebeuge', name: 'Übung kniebeuge', instructions: 'Mach es so.', easierName: 'Leicht kniebeuge', easierInstructions: 'Mach es leichter.', equipment: ['mat'], isPause: false },
      { id: 'marschieren', name: 'Übung marschieren', instructions: 'Mach es so.', easierName: 'Leicht marschieren', easierInstructions: 'Mach es leichter.', equipment: [], isPause: false },
    ])
  })

  it('liest das Pausen-Merkmal in allen Übungsabfragen mit (AC-11)', async () => {
    listResult = { data: [exercise('kurze_pause', [], true), exercise('marschieren')], error: null }
    expect((await data.getAllExercises()).map((entry) => [entry.id, entry.isPause])).toEqual([
      ['kurze_pause', true],
      ['marschieren', false],
    ])
    expect(calls.select).toContain('is_pause')

    singleResult = { data: exercise('kurze_pause', [], true), error: null }
    await expect(data.getExercise('kurze_pause')).resolves.toMatchObject({ id: 'kurze_pause', isPause: true })
    expect(calls.select).toContain('is_pause')

    listResult = {
      data: [row({ workout_steps: [{ position: 1, mode: 'time', amount: 30, exercises: exercise('kurze_pause', [], true) }] })],
      error: null,
    }
    const [workout] = await data.getOfferedWorkouts()
    expect(workout.steps[0].exercise.isPause).toBe(true)
    expect(calls.select).toMatch(/exercises\s*\([^)]*is_pause/)
  })

  it('lässt Übungszeilen ohne Pausen-Merkmal weg (AC-11)', async () => {
    const { is_pause: _ignored, ...withoutFlag } = exercise('ohne_merkmal')
    listResult = { data: [withoutFlag, exercise('ok')], error: null }
    expect((await data.getAllExercises()).map((entry) => entry.id)).toEqual(['ok'])
  })

  it('lässt unpassende Zeilen weg und wirft bei Lesefehlern (EC-5)', async () => {
    listResult = { data: [exercise('ok'), { ...exercise('kaputt'), equipment: ['trampolin'] }], error: null }
    expect((await data.getAllExercises()).map((entry) => entry.id)).toEqual(['ok'])
    listResult = { data: null, error: { code: '08006' } }
    await expect(data.getAllExercises()).rejects.toThrow('Exercises could not be read (08006)')
  })

  it('liest eine Übung nach ID', async () => {
    singleResult = { data: exercise('kniebeuge', ['mat']), error: null }
    await expect(data.getExercise('kniebeuge')).resolves.toMatchObject({ id: 'kniebeuge', equipment: ['mat'] })
    expect(calls.table).toBe('exercises')
    expect(calls.eq).toEqual([['id', 'kniebeuge']])
  })

  it('liefert null für eine unbekannte oder ungültige ID, ohne ungültige IDs abzufragen (EC-2)', async () => {
    singleResult = { data: null, error: null }
    await expect(data.getExercise('gibt_es_nicht')).resolves.toBeNull()
    from.mockClear()
    await expect(data.getExercise('../x')).resolves.toBeNull()
    await expect(data.getExercise('Kniebeuge')).resolves.toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('wirft, wenn das Lesen einer Übung scheitert', async () => {
    singleResult = { data: null, error: { code: '08006' } }
    await expect(data.getExercise('kniebeuge')).rejects.toThrow('Exercise could not be read (08006)')
  })
})
