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
  for (const method of ['select', 'update', 'delete', 'eq', 'order']) {
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
const rpc = vi.fn((_name: string, _args: unknown) => nextResult())
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from, rpc }) }))

const data = await import('./weight.data')

const op = (query: Query, method: string) => query.ops.filter(([name]) => name === method).map(([, ...args]) => args)
const USER = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  vi.clearAllMocks()
  queries.length = 0
  results = []
})

describe('getWeightAccess (AC-1, AC-2, AC-14)', () => {
  it('liest Altersgruppe und Einstellung der eigenen Zeile', async () => {
    results = [{ data: { age_band_at_signup: '16_plus', show_weight_in_nav: false }, error: null }]
    await expect(data.getWeightAccess(USER)).resolves.toEqual({ ageBand: '16_plus', showWeightInNav: false })
    expect(queries[0].table).toBe('profiles')
    expect(op(queries[0], 'select')[0][0]).toContain('show_weight_in_nav')
    expect(op(queries[0], 'eq')).toEqual([['user_id', USER]])
  })

  it('ohne Profilzeile null, bei Lesefehler ein Fehler ohne Personendaten', async () => {
    results = [{ data: null, error: null }]
    await expect(data.getWeightAccess('22222222-2222-4222-8222-222222222222')).resolves.toBeNull()
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.getWeightAccess('33333333-3333-4333-8333-333333333333')).rejects.toThrow('Weight access could not be read (08006)')
  })
})

describe('listOwnWeightEntries (AC-9, EC-6)', () => {
  it('liest nur eigene Einträge, neueste zuerst, und lässt unpassende Zeilen weg', async () => {
    results = [
      {
        data: [
          { entry_date: '2026-11-20', weight_kg: 72.4 },
          { entry_date: '2026-11-25', weight_kg: '71.0' },
          { entry_date: '2026-11-21', weight_kg: 'kaputt' },
        ],
        error: null,
      },
    ]
    await expect(data.listOwnWeightEntries(USER)).resolves.toEqual([
      { date: '2026-11-25', weightKg: 71 },
      { date: '2026-11-20', weightKg: 72.4 },
    ])
    expect(queries[0].table).toBe('weight_entries')
    expect(op(queries[0], 'eq')).toEqual([['user_id', USER]])
  })

  it('wirft bei Lesefehlern, statt einen leeren Verlauf zu zeigen', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.listOwnWeightEntries(USER)).rejects.toThrow('Weight entries could not be read (08006)')
  })
})

describe('saveOwnWeightEntry (AC-4, AC-6, AC-11, EC-1, EC-3)', () => {
  const entry = { date: '2026-11-25', weightKg: 72.4, previousDate: null, replace: false }

  it('ruft die Speicherfunktion mit allen Angaben auf', async () => {
    results = [{ data: { status: 'saved' }, error: null }]
    await expect(data.saveOwnWeightEntry({ ...entry, previousDate: '2026-11-24', replace: true })).resolves.toEqual({ status: 'saved' })
    expect(rpc).toHaveBeenCalledWith('save_weight_entry', {
      p_entry_date: '2026-11-25',
      p_weight_kg: 72.4,
      p_previous_date: '2026-11-24',
      p_replace: true,
    })
  })

  it('übersetzt „schon vorhanden“ mit dem Wert und „gibt es nicht mehr“', async () => {
    results = [{ data: { status: 'exists', weight_kg: '71.5' }, error: null }]
    await expect(data.saveOwnWeightEntry(entry)).resolves.toEqual({ status: 'exists', weightKg: 71.5 })
    results = [{ data: { status: 'gone' }, error: null }]
    await expect(data.saveOwnWeightEntry(entry)).resolves.toEqual({ status: 'gone' })
  })

  it('abgelehnte Werte und Daten in der Zukunft sind „ungültig“, andere Fehler werfen', async () => {
    results = [{ data: null, error: { code: '23514' } }]
    await expect(data.saveOwnWeightEntry(entry)).resolves.toEqual({ status: 'invalid' })
    results = [{ data: null, error: { code: 'WE001' } }]
    await expect(data.saveOwnWeightEntry(entry)).resolves.toEqual({ status: 'invalid' })
    results = [{ data: null, error: { code: '42501' } }]
    await expect(data.saveOwnWeightEntry(entry)).rejects.toThrow('Weight entry could not be saved (42501)')
    results = [{ data: { status: 'vielleicht' }, error: null }]
    await expect(data.saveOwnWeightEntry(entry)).rejects.toThrow('unknown result')
  })
})

describe('Löschen und Einstellung (AC-12, AC-13, AC-14)', () => {
  it('löscht einen eigenen Eintrag nach Datum', async () => {
    await data.deleteOwnWeightEntry(USER, '2026-11-25')
    expect(queries[0].table).toBe('weight_entries')
    expect(op(queries[0], 'delete')).toHaveLength(1)
    expect(op(queries[0], 'eq')).toEqual([
      ['user_id', USER],
      ['entry_date', '2026-11-25'],
    ])
  })

  it('löscht alle eigenen Einträge', async () => {
    await data.deleteAllOwnWeightEntries(USER)
    expect(op(queries[0], 'delete')).toHaveLength(1)
    expect(op(queries[0], 'eq')).toEqual([['user_id', USER]])
  })

  it('setzt die Einstellung am eigenen Profil', async () => {
    await data.setOwnWeightVisibility(USER, false)
    expect(queries[0].table).toBe('profiles')
    expect(op(queries[0], 'update')).toEqual([[{ show_weight_in_nav: false }]])
    expect(op(queries[0], 'eq')).toEqual([['user_id', USER]])
  })

  it('wirft bei Fehlern', async () => {
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.deleteOwnWeightEntry(USER, '2026-11-25')).rejects.toThrow('(08006)')
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.deleteAllOwnWeightEntries(USER)).rejects.toThrow('(08006)')
    results = [{ data: null, error: { code: '08006' } }]
    await expect(data.setOwnWeightVisibility(USER, true)).rejects.toThrow('(08006)')
  })
})

describe('getOwnWeightExport (AC-16)', () => {
  it('liefert alle eigenen Einträge, älteste zuerst', async () => {
    results = [
      {
        data: [
          { entry_date: '2026-11-20', weight_kg: 72.4 },
          { entry_date: '2026-11-25', weight_kg: 71 },
        ],
        error: null,
      },
    ]
    await expect(data.getOwnWeightExport(USER)).resolves.toEqual([
      { date: '2026-11-20', weightKg: 72.4 },
      { date: '2026-11-25', weightKg: 71 },
    ])
    expect(op(queries[0], 'order')).toEqual([['entry_date', { ascending: true }]])
    expect(op(queries[0], 'eq')).toEqual([['user_id', USER]])
  })
})
