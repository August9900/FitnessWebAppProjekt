import {
  amountLabel,
  durationFilterLabel,
  equipmentText,
  filterByDuration,
  fitOf,
  guidedHref,
  parseEasier,
  shownExercise,
  workoutEquipment,
  type Exercise,
  type Workout,
} from './workouts.rules'

const exercise = (id: string, equipment: Exercise['equipment'] = []): Exercise => ({
  id,
  name: `Übung ${id}`,
  instructions: 'Mach es so.',
  easierName: `Leichte Übung ${id}`,
  easierInstructions: 'Mach es leichter.',
  equipment,
})

const workout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'w1',
  title: 'Test',
  description: 'Ein Workout.',
  durationMinutes: 5,
  intensity: 'gentle',
  places: ['home'],
  reviewStatus: 'unreviewed',
  steps: [{ position: 1, mode: 'time', amount: 30, exercise: exercise('a') }],
  ...overrides,
})

const withEquipment = (...equipment: Exercise['equipment']) =>
  equipment.map((code, index) => ({ position: index + 1, mode: 'reps' as const, amount: 10, exercise: exercise(code, [code]) }))

describe('workoutEquipment', () => {
  it('ergibt die Ausstattung aus den Übungen, ohne Doppelte, in fester Reihenfolge', () => {
    const steps = [
      ...withEquipment('resistance_band', 'mat'),
      { position: 3, mode: 'time' as const, amount: 30, exercise: exercise('b', ['mat']) },
    ]
    expect(workoutEquipment({ steps })).toEqual(['mat', 'resistance_band'])
    expect(workoutEquipment(workout())).toEqual([])
  })

  it('beschriftet die Ausstattung lesbar', () => {
    expect(equipmentText(['mat', 'dumbbells'])).toBe('Matte, Kurzhanteln')
    expect(equipmentText([])).toBe('Ohne Ausstattung')
  })
})

describe('fitOf — Ort und Ausstattung (AC-2a)', () => {
  const regular = { experience: 'regular' as const }

  it('passt zuhause, wenn die ganze Ausstattung vorhanden ist', () => {
    const w = workout({ steps: withEquipment('mat', 'dumbbells') })
    expect(fitOf(w, { ...regular, places: ['home'], homeEquipment: ['mat', 'dumbbells', 'kettlebell'] })).toEqual({ fits: true })
  })

  it('passt zuhause nicht, wenn Ausstattung fehlt, und nennt sie', () => {
    const w = workout({ steps: withEquipment('mat', 'dumbbells', 'resistance_band') })
    expect(fitOf(w, { ...regular, places: ['home'], homeEquipment: ['mat'] })).toEqual({
      fits: false,
      reason: 'braucht Kurzhanteln und Widerstandsband',
    })
  })

  it('bei „Nichts davon“ passen zuhause nur Workouts ohne Ausstattung', () => {
    const none = { ...regular, places: ['home' as const], homeEquipment: ['none' as const] }
    expect(fitOf(workout(), none)).toEqual({ fits: true })
    expect(fitOf(workout({ steps: withEquipment('dumbbells') }), none)).toEqual({ fits: false, reason: 'braucht Kurzhanteln' })
  })

  it('prüft draußen und im Studio keine Ausstattung', () => {
    const w = workout({ places: ['outdoors', 'gym'], steps: withEquipment('kettlebell') })
    expect(fitOf(w, { ...regular, places: ['outdoors'], homeEquipment: null })).toEqual({ fits: true })
    expect(fitOf(w, { ...regular, places: ['gym'], homeEquipment: null })).toEqual({ fits: true })
  })

  it('passt über einen anderen gemeinsamen Ort, auch wenn zuhause Ausstattung fehlt', () => {
    const w = workout({ places: ['home', 'gym'], steps: withEquipment('dumbbells') })
    expect(fitOf(w, { ...regular, places: ['home', 'gym'], homeEquipment: ['none'] })).toEqual({ fits: true })
  })

  it('nennt ohne gemeinsamen Ort die Orte des Workouts', () => {
    const answers = { ...regular, places: ['home' as const], homeEquipment: ['mat' as const] }
    expect(fitOf(workout({ places: ['gym'] }), answers)).toEqual({ fits: false, reason: 'nur im Fitnessstudio' })
    expect(fitOf(workout({ places: ['outdoors'] }), answers)).toEqual({ fits: false, reason: 'nur draußen' })
    expect(fitOf(workout({ places: ['outdoors', 'gym'] }), answers)).toEqual({
      fits: false,
      reason: 'nur draußen oder im Fitnessstudio',
    })
    expect(fitOf(workout({ places: ['home'] }), { ...regular, places: ['gym'], homeEquipment: null })).toEqual({
      fits: false,
      reason: 'nur zuhause',
    })
  })
})

describe('fitOf — Intensität nach Erfahrung (AC-2b)', () => {
  const at = { places: ['outdoors' as const], homeEquipment: null }
  const cases = [
    ['beginner', 'gentle', true],
    ['beginner', 'moderate', false],
    ['beginner', 'vigorous', false],
    ['occasional', 'gentle', true],
    ['occasional', 'moderate', true],
    ['occasional', 'vigorous', false],
    ['regular', 'gentle', true],
    ['regular', 'moderate', true],
    ['regular', 'vigorous', true],
  ] as const

  it.each(cases)('%s + %s → passt: %s', (experience, intensity, fits) => {
    const result = fitOf(workout({ places: ['outdoors'], intensity }), { ...at, experience })
    expect(result.fits).toBe(fits)
  })

  it('nennt die Intensität als Grund', () => {
    expect(fitOf(workout({ places: ['outdoors'], intensity: 'vigorous' }), { ...at, experience: 'occasional' })).toEqual({
      fits: false,
      reason: 'kräftige Intensität',
    })
    expect(fitOf(workout({ places: ['outdoors'], intensity: 'moderate' }), { ...at, experience: 'beginner' })).toEqual({
      fits: false,
      reason: 'mittlere Intensität',
    })
  })

  it('nennt höchstens einen Grund: Ort vor Ausstattung vor Intensität (AC-4)', () => {
    const w = workout({ places: ['home'], intensity: 'vigorous', steps: withEquipment('dumbbells') })
    expect(fitOf(w, { experience: 'beginner', places: ['gym'], homeEquipment: null })).toEqual({ fits: false, reason: 'nur zuhause' })
    expect(fitOf(w, { experience: 'beginner', places: ['home'], homeEquipment: ['none'] })).toEqual({
      fits: false,
      reason: 'braucht Kurzhanteln',
    })
    expect(fitOf(w, { experience: 'beginner', places: ['home'], homeEquipment: ['dumbbells'] })).toEqual({
      fits: false,
      reason: 'kräftige Intensität',
    })
  })

  it('folgt geänderten Angaben sofort (EC-1)', () => {
    const w = workout({ places: ['gym'], intensity: 'moderate' })
    expect(fitOf(w, { experience: 'beginner', places: ['gym'], homeEquipment: null }).fits).toBe(false)
    expect(fitOf(w, { experience: 'occasional', places: ['gym'], homeEquipment: null }).fits).toBe(true)
  })
})

describe('filterByDuration (AC-3)', () => {
  const list = [workout({ id: 'a', durationMinutes: 5 }), workout({ id: 'b', durationMinutes: 10 }), workout({ id: 'c', durationMinutes: 15 })]

  it('zeigt bei „Alle“ alles und sonst nur die gewählte Dauer', () => {
    expect(filterByDuration(list, 'all').map((w) => w.id)).toEqual(['a', 'b', 'c'])
    expect(filterByDuration(list, 10).map((w) => w.id)).toEqual(['b'])
    expect(filterByDuration(list.slice(0, 1), 15)).toEqual([])
  })

  it('beschriftet die Filter', () => {
    expect(durationFilterLabel('all')).toBe('Alle')
    expect(durationFilterLabel(5)).toBe('5 Min')
  })
})

describe('amountLabel', () => {
  it('zeigt Sekunden oder Wiederholungen', () => {
    expect(amountLabel({ mode: 'time', amount: 30 })).toBe('30 Sekunden')
    expect(amountLabel({ mode: 'reps', amount: 10 })).toBe('10 Wiederholungen')
    expect(amountLabel({ mode: 'reps', amount: 1 })).toBe('1 Wiederholung')
  })
})

describe('leichtere Variante (AC-7)', () => {
  it('zeigt Name und Anleitung der leichteren Variante, wenn gewählt', () => {
    const e = exercise('x')
    expect(shownExercise(e, false)).toEqual({ name: 'Übung x', instructions: 'Mach es so.' })
    expect(shownExercise(e, true)).toEqual({ name: 'Leichte Übung x', instructions: 'Mach es leichter.' })
  })

  it('liest nur vorhandene Positionen aus der Adresse und ignoriert den Rest', () => {
    expect(parseEasier('2,4', [1, 2, 3, 4])).toEqual([2, 4])
    expect(parseEasier('4,2,2', [1, 2, 3, 4])).toEqual([2, 4])
    expect(parseEasier('0,5,abc,-1,2.5, 3', [1, 2, 3, 4])).toEqual([3])
    expect(parseEasier(['1', '3'], [1, 2, 3])).toEqual([1, 3])
    expect(parseEasier(undefined, [1, 2])).toEqual([])
  })

  it('schreibt die Auswahl in die Adresse der geführten Ansicht', () => {
    expect(guidedHref('morgen_mobil_5', [])).toBe('/bewegung/morgen_mobil_5/los')
    expect(guidedHref('morgen_mobil_5', [4, 2, 2])).toBe('/bewegung/morgen_mobil_5/los?leichter=2,4')
  })
})
