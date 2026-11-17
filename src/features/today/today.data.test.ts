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
  for (const method of ['select', 'insert', 'update', 'eq', 'in', 'gt', 'order', 'limit']) {
    builder[method] = (...args: unknown[]) => {
      query.ops.push([method, ...args])
      return builder
    }
  }
  builder.single = () => {
    query.ops.push(['single'])
    return nextResult()
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

const data = await import('./today.data')

const op = (query: Query, method: string) => query.ops.filter(([name]) => name === method).map(([, ...args]) => args)

const now = new Date('2026-11-17T20:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

const moveRow = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'move',
  minutes: 10,
  energy: 'low',
  place: 'home',
  effort: null,
  suggested_ids: ['morgen_mobil_5', 'ruecken_10'],
  created_at: hoursAgo(1),
}
const eatRow = {
  id: '22222222-2222-4222-8222-222222222222',
  kind: 'eat',
  minutes: null,
  energy: null,
  place: null,
  effort: 'quick',
  suggested_ids: ['hummus_brot'],
  created_at: hoursAgo(2),
}
const actionRow = (overrides: Record<string, unknown> = {}) => ({
  id: '33333333-3333-4333-8333-333333333333',
  check_in_id: moveRow.id,
  kind: 'move',
  workout_id: 'morgen_mobil_5',
  meal_id: null,
  status: 'started',
  started_at: hoursAgo(1),
  concluded_at: null,
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  queries.length = 0
  results = []
})

describe('createCheckIn (AC-11, EC-1)', () => {
  it('speichert Antworten und Vorschlag in einer Zeile der Person', async () => {
    results = [{ data: moveRow, error: null }]
    const checkIn = await data.createCheckIn(
      'u1',
      { kind: 'move', minutes: 10, energy: 'low', place: 'home' },
      ['morgen_mobil_5', 'ruecken_10']
    )

    expect(queries).toHaveLength(1)
    expect(queries[0].table).toBe('check_ins')
    expect(op(queries[0], 'insert')).toEqual([
      [
        {
          user_id: 'u1',
          kind: 'move',
          minutes: 10,
          energy: 'low',
          place: 'home',
          effort: null,
          suggested_ids: ['morgen_mobil_5', 'ruecken_10'],
        },
      ],
    ])
    expect(checkIn).toEqual({
      id: moveRow.id,
      answers: { kind: 'move', minutes: 10, energy: 'low', place: 'home' },
      suggestedIds: ['morgen_mobil_5', 'ruecken_10'],
      createdAt: new Date(moveRow.created_at),
    })
  })

  it('speichert bei „Essen“ nur den Aufwand und auch einen leeren Vorschlag', async () => {
    results = [{ data: { ...eatRow, suggested_ids: [] }, error: null }]
    const checkIn = await data.createCheckIn('u1', { kind: 'eat', effort: 'quick' }, [])
    expect(op(queries[0], 'insert')[0][0]).toEqual({
      user_id: 'u1',
      kind: 'eat',
      minutes: null,
      energy: null,
      place: null,
      effort: 'quick',
      suggested_ids: [],
    })
    expect(checkIn.suggestedIds).toEqual([])
  })

  it('wirft einen Datenfehler ohne Antworten in der Meldung, wenn das Speichern scheitert (EC-9)', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    const attempt = data.createCheckIn('u1', { kind: 'move', minutes: 10, energy: 'low', place: 'home' }, [])
    await expect(attempt).rejects.toBeInstanceOf(data.TodayDataError)
    await expect(attempt).rejects.toThrow('(08006)')
    await expect(attempt).rejects.not.toThrow(/low|home/)
  })
})

describe('getOwnCheckIn', () => {
  it('liest nur einen eigenen Check-in', async () => {
    results = [{ data: eatRow, error: null }]
    const checkIn = await data.getOwnCheckIn('u1', eatRow.id)
    expect(op(queries[0], 'eq')).toEqual([
      ['id', eatRow.id],
      ['user_id', 'u1'],
    ])
    expect(checkIn?.answers).toEqual({ kind: 'eat', effort: 'quick' })
  })

  it('liefert null, wenn es den Check-in nicht gibt oder er nicht der Person gehört', async () => {
    results = [{ data: null, error: null }]
    await expect(data.getOwnCheckIn('u2', eatRow.id)).resolves.toBeNull()
  })
})

describe('getLastAnswers (AC-5)', () => {
  it('liest je Art den jüngsten eigenen Check-in', async () => {
    results = [
      { data: moveRow, error: null },
      { data: eatRow, error: null },
    ]
    const last = await data.getLastAnswers('u1')

    expect(queries.map((q) => q.table)).toEqual(['check_ins', 'check_ins'])
    expect(op(queries[0], 'eq')).toEqual([
      ['user_id', 'u1'],
      ['kind', 'move'],
    ])
    expect(op(queries[1], 'eq')).toEqual([
      ['user_id', 'u1'],
      ['kind', 'eat'],
    ])
    for (const query of queries) {
      expect(op(query, 'order')).toEqual([['created_at', { ascending: false }]])
      expect(op(query, 'limit')).toEqual([[1]])
    }
    expect(last).toEqual({
      move: { kind: 'move', minutes: 10, energy: 'low', place: 'home' },
      eat: { kind: 'eat', effort: 'quick' },
    })
  })

  it('liefert null für eine Art ohne bisherigen Check-in', async () => {
    results = [
      { data: null, error: null },
      { data: eatRow, error: null },
    ]
    await expect(data.getLastAnswers('u1')).resolves.toEqual({ move: null, eat: { kind: 'eat', effort: 'quick' } })
  })

  it('wirft, wenn das Lesen scheitert', async () => {
    results = [
      { data: moveRow, error: null },
      { data: null, error: { code: '42501' } },
    ]
    await expect(data.getLastAnswers('u1')).rejects.toBeInstanceOf(data.TodayDataError)
  })
})

describe('getRecentlyStartedIds (AC-7, AC-8)', () => {
  it('liest die Inhalte der Art, die in den letzten 72 Stunden begonnen wurden, ohne Doppelte', async () => {
    results = [
      {
        data: [
          { workout_id: 'ruecken_10', meal_id: null },
          { workout_id: 'ruecken_10', meal_id: null },
          { workout_id: 'morgen_mobil_5', meal_id: null },
        ],
        error: null,
      },
    ]
    const ids = await data.getRecentlyStartedIds('u1', 'move', now)

    expect(queries[0].table).toBe('actions')
    expect(op(queries[0], 'eq')).toEqual([
      ['user_id', 'u1'],
      ['kind', 'move'],
    ])
    expect(op(queries[0], 'gt')).toEqual([['started_at', hoursAgo(72)]])
    expect(ids).toEqual(['ruecken_10', 'morgen_mobil_5'])
  })

  it('nimmt bei „Essen“ die Mahlzeit-IDs', async () => {
    results = [{ data: [{ workout_id: null, meal_id: 'hummus_brot' }], error: null }]
    await expect(data.getRecentlyStartedIds('u1', 'eat', now)).resolves.toEqual(['hummus_brot'])
  })
})

describe('startAction (AC-12, EC-4, EC-6)', () => {
  const checkIn = { id: moveRow.id, answers: { kind: 'move', minutes: 10, energy: 'low', place: 'home' } as const }

  it('legt die Aktion für genau den gewählten Inhalt an', async () => {
    results = [{ data: actionRow(), error: null }]
    const action = await data.startAction('u1', checkIn, 'morgen_mobil_5')

    expect(queries[0].table).toBe('actions')
    expect(op(queries[0], 'insert')).toEqual([
      [{ user_id: 'u1', check_in_id: moveRow.id, kind: 'move', workout_id: 'morgen_mobil_5', meal_id: null }],
    ])
    expect(action).toEqual({
      id: actionRow().id,
      checkInId: moveRow.id,
      kind: 'move',
      itemId: 'morgen_mobil_5',
      status: 'started',
      startedAt: new Date(hoursAgo(1)),
      concludedAt: null,
    })
  })

  it('setzt bei „Essen“ die Mahlzeit statt eines Workouts', async () => {
    results = [{ data: actionRow({ kind: 'eat', workout_id: null, meal_id: 'hummus_brot' }), error: null }]
    await data.startAction('u1', { id: eatRow.id, answers: { kind: 'eat', effort: 'quick' } }, 'hummus_brot')
    expect(op(queries[0], 'insert')[0][0]).toMatchObject({ kind: 'eat', workout_id: null, meal_id: 'hummus_brot' })
  })

  it('liefert bei einem zweiten Versuch die bestehende Aktion des Check-ins (EC-4)', async () => {
    results = [
      { data: null, error: { code: '23505' } },
      { data: actionRow(), error: null },
    ]
    const action = await data.startAction('u1', checkIn, 'ruecken_10')

    expect(queries).toHaveLength(2)
    expect(op(queries[1], 'eq')).toEqual([
      ['check_in_id', moveRow.id],
      ['user_id', 'u1'],
    ])
    expect(action.itemId).toBe('morgen_mobil_5')
  })

  it('meldet eine von der Datenbank abgelehnte Aktion gesondert (EC-6)', async () => {
    results = [{ data: null, error: { code: '42501' } }]
    await expect(data.startAction('u1', checkIn, 'morgen_mobil_5')).rejects.toBeInstanceOf(data.ActionRejectedError)
  })

  it('wirft einen Datenfehler, wenn das Speichern scheitert (EC-9)', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.startAction('u1', checkIn, 'morgen_mobil_5')).rejects.toBeInstanceOf(data.TodayDataError)
  })
})

describe('concludeAction (AC-14, EC-4, EC-5)', () => {
  it('markiert nur, solange die Aktion noch begonnen ist, und meldet die Änderung', async () => {
    const concluded = actionRow({ status: 'done', concluded_at: now.toISOString() })
    results = [{ data: [concluded], error: null }]
    const result = await data.concludeAction('u1', concluded.id, 'done', now)

    expect(op(queries[0], 'update')).toEqual([[{ status: 'done', concluded_at: now.toISOString() }]])
    expect(op(queries[0], 'eq')).toEqual([
      ['id', concluded.id],
      ['user_id', 'u1'],
      ['status', 'started'],
    ])
    expect(result).toEqual({ changed: true, action: expect.objectContaining({ status: 'done', concludedAt: now }) })
  })

  it('lässt die erste Markierung gelten und liefert den tatsächlichen Zustand (EC-5)', async () => {
    const alreadyDone = actionRow({ status: 'done', concluded_at: hoursAgo(0.5) })
    results = [
      { data: [], error: null },
      { data: alreadyDone, error: null },
    ]
    const result = await data.concludeAction('u1', alreadyDone.id, 'skipped', now)

    expect(queries).toHaveLength(2)
    expect(result).toEqual({ changed: false, action: expect.objectContaining({ status: 'done' }) })
  })

  it('liefert null für eine fremde oder unbekannte Aktion', async () => {
    results = [
      { data: [], error: null },
      { data: null, error: null },
    ]
    await expect(data.concludeAction('u2', actionRow().id, 'done', now)).resolves.toBeNull()
  })

  it('wirft einen Datenfehler, wenn das Speichern scheitert (EC-9)', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.concludeAction('u1', actionRow().id, 'done', now)).rejects.toBeInstanceOf(data.TodayDataError)
  })
})

describe('undoConclusion (AC-15)', () => {
  const done = actionRow({ status: 'done', concluded_at: hoursAgo(0.5) })

  it('setzt die Markierung zurück, wenn seitdem kein Check-in begonnen wurde', async () => {
    results = [
      { data: done, error: null },
      { data: { created_at: hoursAgo(1) }, error: null },
      { data: [actionRow()], error: null },
    ]
    const result = await data.undoConclusion('u1', done.id)

    expect(queries.map((q) => q.table)).toEqual(['actions', 'check_ins', 'actions'])
    expect(op(queries[2], 'update')).toEqual([[{ status: 'started', concluded_at: null }]])
    expect(op(queries[2], 'eq')).toEqual([
      ['id', done.id],
      ['user_id', 'u1'],
      ['status', 'done'],
    ])
    expect(result).toEqual({ undone: true, action: expect.objectContaining({ status: 'started', concludedAt: null }) })
  })

  it('lehnt ab, wenn nach der Markierung ein neuer Check-in begonnen wurde', async () => {
    results = [
      { data: done, error: null },
      { data: { created_at: hoursAgo(0.1) }, error: null },
    ]
    const result = await data.undoConclusion('u1', done.id)

    expect(queries).toHaveLength(2)
    expect(result).toEqual({ undone: false, action: expect.objectContaining({ status: 'done' }) })
  })

  it('ändert nichts an einer Aktion, die noch begonnen ist', async () => {
    results = [
      { data: actionRow(), error: null },
      { data: null, error: null },
    ]
    const result = await data.undoConclusion('u1', done.id)
    expect(queries).toHaveLength(2)
    expect(result?.undone).toBe(false)
  })

  it('liefert null für eine fremde oder unbekannte Aktion', async () => {
    results = [
      { data: null, error: null },
      { data: null, error: null },
    ]
    await expect(data.undoConclusion('u2', done.id)).resolves.toBeNull()
  })
})

describe('getOpenActions (AC-13, EC-8)', () => {
  it('liest begonnene Aktionen der letzten 12 Stunden mit Titel, neueste zuerst', async () => {
    results = [
      {
        data: [
          { ...actionRow(), workout: { title: 'Morgens mobil' }, meal: null },
          {
            ...actionRow({ id: '44444444-4444-4444-8444-444444444444', kind: 'eat', workout_id: null, meal_id: 'hummus_brot' }),
            workout: null,
            meal: { title: 'Brot mit Hummus' },
          },
        ],
        error: null,
      },
    ]
    const open = await data.getOpenActions('u1', now)

    expect(op(queries[0], 'select')[0][0]).toContain('workout:workouts(title)')
    expect(op(queries[0], 'eq')).toEqual([
      ['user_id', 'u1'],
      ['status', 'started'],
    ])
    expect(op(queries[0], 'gt')).toEqual([['started_at', hoursAgo(12)]])
    expect(op(queries[0], 'order')).toEqual([['started_at', { ascending: false }]])
    expect(open.map((action) => action.title)).toEqual(['Morgens mobil', 'Brot mit Hummus'])
  })

  it('liefert den Titel leer, wenn der Inhalt nicht mehr angeboten wird', async () => {
    results = [{ data: [{ ...actionRow(), workout: null, meal: null }], error: null }]
    const [action] = await data.getOpenActions('u1', now)
    expect(action.title).toBeNull()
  })
})

describe('getUndoableConclusion (AC-15)', () => {
  const done = { ...actionRow({ status: 'done', concluded_at: hoursAgo(0.5) }), workout: { title: 'Morgens mobil' }, meal: null }

  it('liefert die letzte Markierung, solange kein neuerer Check-in existiert', async () => {
    results = [
      { data: done, error: null },
      { data: { created_at: hoursAgo(1) }, error: null },
    ]
    const conclusion = await data.getUndoableConclusion('u1')

    expect(op(queries[0], 'in')).toEqual([['status', ['done', 'skipped']]])
    expect(op(queries[0], 'order')).toEqual([['concluded_at', { ascending: false }]])
    expect(conclusion).toEqual(expect.objectContaining({ status: 'done', title: 'Morgens mobil' }))
  })

  it('liefert null nach einem neueren Check-in', async () => {
    results = [
      { data: done, error: null },
      { data: { created_at: hoursAgo(0.1) }, error: null },
    ]
    await expect(data.getUndoableConclusion('u1')).resolves.toBeNull()
  })

  it('liefert null ohne Markierung', async () => {
    results = [
      { data: null, error: null },
      { data: null, error: null },
    ]
    await expect(data.getUndoableConclusion('u1')).resolves.toBeNull()
  })
})

describe('getOwnTodayExport (AC-18)', () => {
  it('liest alle eigenen Check-ins und Aktionen, älteste zuerst', async () => {
    const checkIn = { ...moveRow }
    const action = { ...actionRow(), updated_at: hoursAgo(1) }
    results = [
      { data: [checkIn], error: null },
      { data: [action], error: null },
    ]
    const exported = await data.getOwnTodayExport('u1')

    expect(queries.map((q) => q.table)).toEqual(['check_ins', 'actions'])
    for (const query of queries) expect(op(query, 'eq')).toEqual([['user_id', 'u1']])
    expect(op(queries[0], 'order')).toEqual([['created_at', { ascending: true }]])
    expect(op(queries[1], 'order')).toEqual([['started_at', { ascending: true }]])
    expect(exported).toEqual({ checkIns: [checkIn], actions: [action] })
  })

  it('wirft statt eines unvollständigen Exports', async () => {
    results = [
      { data: [moveRow], error: null },
      { data: null, error: { code: '08006' } },
    ]
    await expect(data.getOwnTodayExport('u1')).rejects.toBeInstanceOf(data.TodayDataError)
  })
})

describe('Zeilen aus der Datenbank', () => {
  it('lässt unpassende Zeilen weg statt sie zu raten', () => {
    expect(data.toCheckIn({ ...moveRow, energy: 'riesig' })).toBeNull()
    expect(data.toCheckIn({ ...eatRow, effort: null })).toBeNull()
    expect(data.toAction(actionRow({ workout_id: null }))).toBeNull()
    expect(data.toAction(actionRow({ status: 'paused' }))).toBeNull()
  })
})
