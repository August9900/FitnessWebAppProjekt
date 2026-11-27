import {
  ALLERGENS,
  allergenText,
  effortFilterLabel,
  filterByEffort,
  mealFits,
  minutesLabel,
  type Effort,
  type MealDiet,
} from './meals.rules'

describe('mealFits (AC-2)', () => {
  // person diet → meal diet → fits?
  const table: [string, MealDiet, boolean][] = [
    ['omnivore', 'vegan', true],
    ['omnivore', 'vegetarian', true],
    ['omnivore', 'meat_fish', true],
    ['vegetarian', 'vegan', true],
    ['vegetarian', 'vegetarian', true],
    ['vegetarian', 'meat_fish', false],
    ['vegan', 'vegan', true],
    ['vegan', 'vegetarian', false],
    ['vegan', 'meat_fish', false],
  ]

  it.each(table)('Essensweise %s, Mahlzeit %s → passt: %s', (person, meal, expected) => {
    expect(mealFits({ diet: meal }, person as 'omnivore' | 'vegetarian' | 'vegan')).toBe(expected)
  })

  it('lässt ohne Essensweise nichts passen', () => {
    expect(mealFits({ diet: 'vegan' }, null)).toBe(false)
    expect(mealFits({ diet: 'vegan' }, undefined)).toBe(false)
  })
})

describe('filterByEffort (AC-3)', () => {
  const meals: { id: string; effort: Effort }[] = [
    { id: 'a', effort: 'no_cook' },
    { id: 'b', effort: 'quick' },
    { id: 'c', effort: 'up_to_20' },
    { id: 'd', effort: 'no_cook' },
  ]

  it('zeigt bei „Alle“ alles in unveränderter Reihenfolge', () => {
    expect(filterByEffort(meals, 'all').map((m) => m.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('zeigt genau eine Stufe', () => {
    expect(filterByEffort(meals, 'no_cook').map((m) => m.id)).toEqual(['a', 'd'])
    expect(filterByEffort(meals, 'quick').map((m) => m.id)).toEqual(['b'])
    expect(filterByEffort(meals, 'up_to_20').map((m) => m.id)).toEqual(['c'])
  })

  it('beschriftet die Filter wie in der Spec', () => {
    expect(['all', 'no_cook', 'quick', 'up_to_20'].map((f) => effortFilterLabel(f as never))).toEqual([
      'Alle',
      'Ohne Kochen',
      'Schnell gekocht',
      'Bis 20 Min',
    ])
  })
})

describe('allergenText (AC-7, EC-4)', () => {
  it('nennt enthaltene Allergene in fester Reihenfolge, unabhängig von der Eingabe', () => {
    expect(allergenText(['nuts', 'milk', 'gluten'])).toBe('Enthält: Gluten, Milch, Schalenfrüchte')
  })

  it('sagt ausdrücklich, wenn keines enthalten ist', () => {
    expect(allergenText([])).toBe('Enthält keines der 14 Hauptallergene.')
  })

  it('kennt genau 14 Hauptallergene mit deutscher Beschriftung', () => {
    expect(ALLERGENS).toHaveLength(14)
    expect(allergenText([...ALLERGENS])).toBe(
      'Enthält: Gluten, Krebstiere, Eier, Fisch, Erdnüsse, Soja, Milch, Schalenfrüchte, Sellerie, Senf, Sesam, Sulfite, Lupinen, Weichtiere'
    )
  })
})

describe('minutesLabel (AC-1)', () => {
  it('zeigt Minuten kurz', () => {
    expect(minutesLabel(7)).toBe('7 Min')
  })
})
