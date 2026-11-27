import { NUTRITION_TEXTS, nutritionLines, toNutrition } from './nutrition.rules'

const full = { energyKcal: 450, proteinG: 22, carbsG: 55, fatG: 14 }

describe('toNutrition (AC-6, AC-8)', () => {
  it('nimmt vier gültige ganze Zahlen', () => {
    expect(toNutrition(full)).toEqual(full)
  })

  it('nimmt die Grenzen 0 und 2000 kcal bzw. 200 g', () => {
    expect(toNutrition({ energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 })).toEqual({ energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 })
    expect(toNutrition({ energyKcal: 2000, proteinG: 200, carbsG: 200, fatG: 200 })).not.toBeNull()
  })

  it.each([
    ['ein Wert fehlt', { ...full, fatG: null }],
    ['alle fehlen', { energyKcal: null, proteinG: null, carbsG: null, fatG: null }],
    ['keine ganze Zahl', { ...full, proteinG: 22.5 }],
    ['Text statt Zahl', { ...full, carbsG: '55' }],
    ['negativ', { ...full, fatG: -1 }],
    ['über 2000 kcal', { ...full, energyKcal: 2001 }],
    ['über 200 g', { ...full, carbsG: 201 }],
  ])('%s → keine Nährwerte', (_name, values) => {
    expect(toNutrition(values)).toBeNull()
  })
})

describe('nutritionLines (AC-2, AC-3, EC-1)', () => {
  it('vier Zeilen in fester Reihenfolge mit Einheit', () => {
    expect(nutritionLines(full)).toEqual([
      { label: 'Energie', value: '450 kcal' },
      { label: 'Eiweiß', value: '22 g' },
      { label: 'Kohlenhydrate', value: '55 g' },
      { label: 'Fett', value: '14 g' },
    ])
  })

  it('0 bleibt „0 g“', () => {
    expect(nutritionLines({ ...full, fatG: 0 })[3]).toEqual({ label: 'Fett', value: '0 g' })
  })

  it('ohne Prozentangaben oder Einordnung', () => {
    const text = JSON.stringify(nutritionLines(full)) + JSON.stringify(NUTRITION_TEXTS)
    expect(text).not.toMatch(/%|viel|wenig|gesund|leicht|hoch|niedrig/i)
    expect(NUTRITION_TEXTS).toEqual({
      title: 'Nährwerte pro Portion',
      note: 'Ungefähre Werte – sie hängen von den genauen Zutaten ab.',
    })
  })
})
