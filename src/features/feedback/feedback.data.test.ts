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
  for (const method of ['select', 'insert', 'update', 'eq', 'order']) {
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

const data = await import('./feedback.data')

const op = (query: Query, method: string) => query.ops.filter(([name]) => name === method).map(([, ...args]) => args)

const ACTION_ID = '33333333-3333-4333-8333-333333333333'

beforeEach(() => {
  vi.clearAllMocks()
  queries.length = 0
  results = []
})

describe('saveFeedbackAnswer (AC-3, AC-6, AC-7, AC-16, EC-1, EC-2, EC-4)', () => {
  it('legt die Rückmeldung mit genau dieser einen Antwort an', async () => {
    results = [{ data: null, error: null }]
    await expect(data.saveFeedbackAnswer('u1', ACTION_ID, 'effort', 'too_much')).resolves.toBe('saved')
    expect(queries).toHaveLength(1)
    expect(queries[0].table).toBe('action_feedback')
    expect(op(queries[0], 'insert')).toEqual([[{ action_id: ACTION_ID, user_id: 'u1', effort: 'too_much' }]])
  })

  it('schreibt „Wieder vorschlagen“ in seine eigene Spalte', async () => {
    results = [{ data: null, error: null }]
    await data.saveFeedbackAnswer('u1', ACTION_ID, 'suggestAgain', 'no')
    expect(op(queries[0], 'insert')).toEqual([[{ action_id: ACTION_ID, user_id: 'u1', suggest_again: 'no' }]])
  })

  it('ändert bei vorhandener Rückmeldung nur die Spalte dieser Frage', async () => {
    results = [
      { data: null, error: { code: '23505' } },
      { data: [{ action_id: ACTION_ID }], error: null },
    ]
    await expect(data.saveFeedbackAnswer('u1', ACTION_ID, 'suggestAgain', 'yes')).resolves.toBe('saved')
    expect(op(queries[1], 'update')).toEqual([[{ suggest_again: 'yes' }]])
    expect(op(queries[1], 'eq')).toEqual([
      ['action_id', ACTION_ID],
      ['user_id', 'u1'],
    ])
  })

  it('meldet „nicht mehr möglich“, wenn die Datenbank das Anlegen ablehnt (AC-16, EC-4)', async () => {
    results = [{ data: null, error: { code: '42501' } }]
    await expect(data.saveFeedbackAnswer('u1', ACTION_ID, 'effort', 'too_much')).resolves.toBe('not_possible')
    results = [{ data: null, error: { code: '23503' } }]
    await expect(data.saveFeedbackAnswer('u1', ACTION_ID, 'effort', 'too_much')).resolves.toBe('not_possible')
  })

  it('meldet „nicht mehr möglich“, wenn beim Ändern keine Zeile geändert wird (AC-7)', async () => {
    results = [
      { data: null, error: { code: '23505' } },
      { data: [], error: null },
    ]
    await expect(data.saveFeedbackAnswer('u1', ACTION_ID, 'effort', 'just_right')).resolves.toBe('not_possible')
  })

  it('wirft einen Datenfehler ohne Antwort in der Meldung, wenn das Speichern scheitert (EC-3)', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    const attempt = data.saveFeedbackAnswer('u1', ACTION_ID, 'effort', 'too_much')
    await expect(attempt).rejects.toBeInstanceOf(data.FeedbackDataError)
    await expect(attempt).rejects.not.toThrow(/too_much|u1/)

    results = [
      { data: null, error: { code: '23505' } },
      { data: null, error: { code: '08006' } },
    ]
    await expect(data.saveFeedbackAnswer('u1', ACTION_ID, 'effort', 'too_much')).rejects.toBeInstanceOf(data.FeedbackDataError)
  })
})

describe('getOwnFeedback (AC-5)', () => {
  it('liest die Antworten einer eigenen Aktion', async () => {
    results = [{ data: { effort: 'too_much', suggest_again: null }, error: null }]
    await expect(data.getOwnFeedback('u1', ACTION_ID)).resolves.toEqual({ effort: 'too_much', suggestAgain: null })
    expect(op(queries[0], 'eq')).toEqual([
      ['action_id', ACTION_ID],
      ['user_id', 'u1'],
    ])
  })

  it('liefert null ohne Rückmeldung und wirft bei Lesefehler', async () => {
    results = [{ data: null, error: null }]
    await expect(data.getOwnFeedback('u1', ACTION_ID)).resolves.toBeNull()
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.getOwnFeedback('u1', ACTION_ID)).rejects.toBeInstanceOf(data.FeedbackDataError)
  })
})

describe('getFeedbackSignalRows (AC-9 bis AC-14)', () => {
  it('liest die eigenen Rückmeldungen einer Art mit dem Inhalt der Aktion', async () => {
    results = [
      {
        data: [
          {
            effort: 'too_much',
            effort_at: '2026-11-16T10:00:00Z',
            suggest_again: 'no',
            suggest_again_at: '2026-11-16T10:00:05Z',
            actions: { kind: 'move', workout_id: 'ruecken_10', meal_id: null },
          },
        ],
        error: null,
      },
    ]
    const rows = await data.getFeedbackSignalRows('u1', 'move')

    expect(op(queries[0], 'select')[0][0]).toContain('actions!inner(kind, workout_id, meal_id)')
    expect(op(queries[0], 'eq')).toEqual([
      ['user_id', 'u1'],
      ['actions.kind', 'move'],
    ])
    expect(rows).toEqual([
      {
        itemId: 'ruecken_10',
        effort: 'too_much',
        effortAt: new Date('2026-11-16T10:00:00Z'),
        suggestAgain: 'no',
        suggestAgainAt: new Date('2026-11-16T10:00:05Z'),
      },
    ])
  })

  it('nimmt bei „Essen“ die Mahlzeit als Inhalt und lässt unpassende Zeilen weg', async () => {
    results = [
      {
        data: [
          { effort: null, effort_at: null, suggest_again: 'yes', suggest_again_at: '2026-11-16T10:00:00Z', actions: { kind: 'eat', workout_id: null, meal_id: 'hummus_brot' } },
          { effort: 'riesig', effort_at: null, suggest_again: null, suggest_again_at: null, actions: { kind: 'eat', workout_id: null, meal_id: 'x' } },
        ],
        error: null,
      },
    ]
    const rows = await data.getFeedbackSignalRows('u1', 'eat')
    expect(rows.map((row) => row.itemId)).toEqual(['hummus_brot'])
  })

  it('wirft, wenn das Lesen scheitert', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.getFeedbackSignalRows('u1', 'move')).rejects.toBeInstanceOf(data.FeedbackDataError)
  })
})

describe('getOwnFeedbackExport (AC-17)', () => {
  it('liest alle eigenen Rückmeldungen, älteste zuerst', async () => {
    const stored = {
      action_id: ACTION_ID,
      effort: 'just_right',
      effort_at: 't1',
      suggest_again: null,
      suggest_again_at: null,
      created_at: 't1',
      updated_at: 't1',
    }
    results = [{ data: [stored], error: null }]
    await expect(data.getOwnFeedbackExport('u1')).resolves.toEqual([stored])
    expect(op(queries[0], 'eq')).toEqual([['user_id', 'u1']])
    expect(op(queries[0], 'order')).toEqual([['created_at', { ascending: true }]])
  })

  it('wirft statt eines unvollständigen Exports', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.getOwnFeedbackExport('u1')).rejects.toBeInstanceOf(data.FeedbackDataError)
  })
})
