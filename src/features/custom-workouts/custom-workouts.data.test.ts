export {}

vi.mock('server-only', () => ({}))

type Result = { data: unknown; error: { code?: string } | null }
type Query = { table: string; ops: [string, ...unknown[]][] }

/** Every `from()` call records its chain and resolves with the next queued result, in call order. */
const queries: Query[] = []
let results: Result[] = []

function nextResult(): Promise<Result> {
  return Promise.resolve(results.shift() ?? { data: null, error: null })
}

function chain(query: Query) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    builder[method] = (...args: unknown[]) => {
      query.ops.push([method, ...args])
      return builder
    }
  }
  builder.maybeSingle = () => {
    query.ops.push(['maybeSingle'])
    return nextResult()
  }
  builder.then = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => nextResult().then(resolve, reject)
  return builder
}

const from = vi.fn((table: string) => {
  const query: Query = { table, ops: [] }
  queries.push(query)
  return chain(query)
})
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from }) }))

const data = await import('./custom-workouts.data')

const op = (query: Query, method: string) => query.ops.filter(([name]) => name === method).map(([, ...args]) => args)

const ID = '55555555-5555-4555-8555-555555555555'
const storedSteps = [
  { exercise_id: 'kniebeuge', mode: 'time', amount: 30 },
  { exercise_id: 'marschieren', mode: 'reps', amount: 10 },
]
const input = {
  id: ID,
  name: 'Mein Mix',
  steps: [
    { exerciseId: 'kniebeuge', mode: 'time' as const, amount: 30 },
    { exerciseId: 'marschieren', mode: 'reps' as const, amount: 10 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  queries.length = 0
  results = []
})

describe('listOwnCustomWorkouts (AC-1)', () => {
  it('liest die eigenen Workouts mit Anzahl der Übungen und lässt unpassende Zeilen weg', async () => {
    results = [
      {
        data: [
          { id: ID, name: 'Mein Mix', steps: storedSteps },
          { id: 'x', name: 'Kaputt', steps: [] },
        ],
        error: null,
      },
    ]
    await expect(data.listOwnCustomWorkouts('u1')).resolves.toEqual([{ id: ID, name: 'Mein Mix', stepCount: 2 }])
    expect(queries[0].table).toBe('custom_workouts')
    expect(op(queries[0], 'eq')).toEqual([['user_id', 'u1']])
  })

  it('wirft, wenn das Lesen scheitert', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.listOwnCustomWorkouts('u1')).rejects.toBeInstanceOf(data.CustomWorkoutDataError)
  })
})

describe('getOwnCustomWorkout (AC-7, AC-12, EC-6)', () => {
  it('liest ein eigenes Workout mit seiner Folge', async () => {
    results = [{ data: { id: ID, name: 'Mein Mix', steps: storedSteps }, error: null }]
    await expect(data.getOwnCustomWorkout('u1', ID)).resolves.toEqual(input)
    expect(op(queries[0], 'eq')).toEqual([
      ['id', ID],
      ['user_id', 'u1'],
    ])
  })

  it('liefert null für unbekannte oder fremde Workouts und fragt ungültige IDs nicht ab', async () => {
    results = [{ data: null, error: null }]
    await expect(data.getOwnCustomWorkout('u2', ID)).resolves.toBeNull()
    from.mockClear()
    await expect(data.getOwnCustomWorkout('u1', 'neu')).resolves.toBeNull()
    expect(from).not.toHaveBeenCalled()
  })
})

describe('createCustomWorkout (AC-5, AC-11, EC-3, EC-4)', () => {
  it('legt das Workout mit der vorgegebenen ID an', async () => {
    results = [{ data: null, error: null }]
    await expect(data.createCustomWorkout('u1', input)).resolves.toBe('saved')
    expect(op(queries[0], 'insert')).toEqual([[{ id: ID, user_id: 'u1', name: 'Mein Mix', steps: storedSteps }]])
  })

  it('zählt eine zweite Anlage mit derselben ID als schon gespeichert (EC-4)', async () => {
    results = [
      { data: null, error: { code: '23505' } },
      { data: { id: ID, name: 'Mein Mix', steps: storedSteps }, error: null },
    ]
    await expect(data.createCustomWorkout('u1', input)).resolves.toBe('saved')
  })

  it('meldet die Grenze von 20 — außer das Workout existiert schon (AC-11, EC-3)', async () => {
    results = [
      { data: null, error: { code: 'PW002' } },
      { data: null, error: null },
    ]
    await expect(data.createCustomWorkout('u1', input)).resolves.toBe('limit')
    results = [
      { data: null, error: { code: 'PW002' } },
      { data: { id: ID, name: 'Mein Mix', steps: storedSteps }, error: null },
    ]
    await expect(data.createCustomWorkout('u1', input)).resolves.toBe('saved')
  })

  it('meldet unbekannte Übungen und Prüfregel-Verstöße getrennt, Fehler sonst als Datenfehler', async () => {
    results = [{ data: null, error: { code: 'PW001' } }]
    await expect(data.createCustomWorkout('u1', input)).resolves.toBe('unknown_exercise')
    results = [{ data: null, error: { code: '23514' } }]
    await expect(data.createCustomWorkout('u1', input)).resolves.toBe('invalid')
    results = [{ data: null, error: { code: '08006' } }]
    const attempt = data.createCustomWorkout('u1', input)
    await expect(attempt).rejects.toBeInstanceOf(data.CustomWorkoutDataError)
    await expect(attempt).rejects.not.toThrow(/Mein Mix|kniebeuge/)
  })
})

describe('replaceCustomWorkout (AC-9, EC-1, EC-2)', () => {
  it('ersetzt Name und Folge in einer Änderung des eigenen Workouts', async () => {
    results = [{ data: [{ id: ID }], error: null }]
    await expect(data.replaceCustomWorkout('u1', input)).resolves.toBe('saved')
    expect(op(queries[0], 'update')).toEqual([[{ name: 'Mein Mix', steps: storedSteps }]])
    expect(op(queries[0], 'eq')).toEqual([
      ['id', ID],
      ['user_id', 'u1'],
    ])
  })

  it('meldet „gibt es nicht mehr“, wenn keine Zeile geändert wurde (EC-2)', async () => {
    results = [{ data: [], error: null }]
    await expect(data.replaceCustomWorkout('u1', input)).resolves.toBe('gone')
  })

  it('meldet unbekannte Übungen und wirft bei Datenbankfehlern', async () => {
    results = [{ data: null, error: { code: 'PW001' } }]
    await expect(data.replaceCustomWorkout('u1', input)).resolves.toBe('unknown_exercise')
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.replaceCustomWorkout('u1', input)).rejects.toBeInstanceOf(data.CustomWorkoutDataError)
  })
})

describe('deleteCustomWorkout (AC-10, EC-4)', () => {
  it('löscht das eigene Workout; ein schon gelöschtes gilt als erledigt', async () => {
    results = [{ data: null, error: null }]
    await expect(data.deleteCustomWorkout('u1', ID)).resolves.toBeUndefined()
    expect(op(queries[0], 'delete')).toHaveLength(1)
    expect(op(queries[0], 'eq')).toEqual([
      ['id', ID],
      ['user_id', 'u1'],
    ])
  })

  it('wirft, wenn das Löschen scheitert', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.deleteCustomWorkout('u1', ID)).rejects.toBeInstanceOf(data.CustomWorkoutDataError)
  })
})

describe('getOwnCustomWorkoutsExport (AC-13)', () => {
  it('liest alle eigenen Workouts, älteste zuerst, und wirft statt eines unvollständigen Exports', async () => {
    const stored = { id: ID, name: 'Mein Mix', steps: storedSteps, created_at: 't1', updated_at: 't2' }
    results = [{ data: [stored], error: null }]
    await expect(data.getOwnCustomWorkoutsExport('u1')).resolves.toEqual([stored])
    expect(op(queries[0], 'order')).toEqual([['created_at', { ascending: true }]])
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.getOwnCustomWorkoutsExport('u1')).rejects.toBeInstanceOf(data.CustomWorkoutDataError)
  })
})
