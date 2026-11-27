export {}

vi.mock('server-only', () => ({}))

type Result = { data: unknown; error: { code?: string } | null }
const calls: { table?: string; select?: string; eq: [string, unknown][]; order: [string, unknown][] } = { eq: [], order: [] }
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
    order(column: string, options: unknown) {
      calls.order.push([column, options])
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

const data = await import('./meals.data')

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'hummus_brot',
  title: 'Brot mit Hummus',
  diet: 'vegan',
  effort: 'no_cook',
  minutes: 5,
  ingredients: ['2 Scheiben Vollkornbrot', '3 EL Hummus'],
  steps: ['Bestreich das Brot mit Hummus.'],
  easier_hint: 'Iss den Hummus mit Gurkenstücken direkt aus der Packung.',
  allergens: ['gluten', 'sesame'],
  review_status: 'unreviewed',
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

describe('getOfferedMeals (AC-1)', () => {
  it('liest nur angebotene Mahlzeiten in einer Abfrage, nach Reihenfolge sortiert', async () => {
    listResult = { data: [row()], error: null }
    const meals = await data.getOfferedMeals()

    expect(from).toHaveBeenCalledTimes(1)
    expect(calls.table).toBe('meals')
    expect(calls.eq).toEqual([['is_offered', true]])
    expect(calls.order).toEqual([['sort_order', { ascending: true }]])
    expect(meals).toEqual([
      {
        id: 'hummus_brot',
        title: 'Brot mit Hummus',
        diet: 'vegan',
        effort: 'no_cook',
        minutes: 5,
        ingredients: ['2 Scheiben Vollkornbrot', '3 EL Hummus'],
        steps: ['Bestreich das Brot mit Hummus.'],
        easierHint: 'Iss den Hummus mit Gurkenstücken direkt aus der Packung.',
        allergens: ['gluten', 'sesame'],
        reviewStatus: 'unreviewed',
        nutrition: null,
      },
    ])
  })

  it('liest die vier Nährwerte mit und setzt sie zusammen (PROJ-12 AC-8)', async () => {
    listResult = { data: [row({ energy_kcal: 315, protein_g: 12, carbs_g: 47, fat_g: 0 })], error: null }
    const [meal] = await data.getOfferedMeals()
    expect(calls.select).toEqual(expect.stringContaining('energy_kcal, protein_g, carbs_g, fat_g'))
    expect(meal.nutrition).toEqual({ energyKcal: 315, proteinG: 12, carbsG: 47, fatG: 0 })
  })

  it('unvollständige oder ungültige Nährwerte: Mahlzeit bleibt, aber ohne Werte (PROJ-12 AC-6, AC-8)', async () => {
    listResult = {
      data: [
        row({ id: 'teilweise', energy_kcal: 315, protein_g: null, carbs_g: 47, fat_g: 7 }),
        row({ id: 'zu_viel', energy_kcal: 315, protein_g: 12, carbs_g: 470, fat_g: 7 }),
      ],
      error: null,
    }
    const meals = await data.getOfferedMeals()
    expect(meals.map((meal) => [meal.id, meal.nutrition])).toEqual([
      ['teilweise', null],
      ['zu_viel', null],
    ])
  })

  it('lässt Zeilen aus, die nicht zu den Regeln passen, statt die Ansicht zu brechen', async () => {
    listResult = {
      data: [row({ id: 'gut' }), row({ id: 'falsch_diet', diet: 'paleo' }), row({ id: 'ohne_schritte', steps: [] })],
      error: null,
    }
    const meals = await data.getOfferedMeals()
    expect(meals.map((meal) => meal.id)).toEqual(['gut'])
  })

  it('liefert eine leere Liste ohne Daten', async () => {
    listResult = { data: null, error: null }
    await expect(data.getOfferedMeals()).resolves.toEqual([])
  })

  it('wirft beim Lesefehler, damit der Fehlerzustand erscheint', async () => {
    listResult = { data: null, error: { code: '42501' } }
    await expect(data.getOfferedMeals()).rejects.toThrow('Meals could not be read (42501).')
  })
})

describe('getMeal (AC-5, EC-2)', () => {
  it('liest eine angebotene Mahlzeit per ID', async () => {
    singleResult = { data: row(), error: null }
    const meal = await data.getMeal('hummus_brot')
    expect(meal?.title).toBe('Brot mit Hummus')
    expect(calls.eq).toEqual([
      ['id', 'hummus_brot'],
      ['is_offered', true],
    ])
  })

  it('meldet „nicht vorhanden“ für unbekannte IDs', async () => {
    singleResult = { data: null, error: null }
    await expect(data.getMeal('gibt_es_nicht')).resolves.toBeNull()
  })

  it('fragt ungültige IDs gar nicht erst ab', async () => {
    await expect(data.getMeal('../etwas')).resolves.toBeNull()
    await expect(data.getMeal('Gross')).resolves.toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('wirft beim Lesefehler', async () => {
    singleResult = { data: null, error: { code: 'PGRST000' } }
    await expect(data.getMeal('hummus_brot')).rejects.toThrow('Meal could not be read (PGRST000).')
  })
})
