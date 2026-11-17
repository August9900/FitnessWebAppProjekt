import type { Meal } from '@/features/meals/meals.rules'
import type { ExerciseEquipment, Workout } from '@/features/workouts/workouts.rules'
import {
  CONCLUSION_MESSAGES,
  EAT_EFFORT_ANSWER_LABELS,
  ENERGY_LABELS,
  KIND_LABELS,
  answersSummary,
  canUndo,
  continueHref,
  detailHref,
  fitsLine,
  isAnswersStillValid,
  isOpenOnToday,
  isRecent,
  openSince,
  placesToAsk,
  recentSince,
  selectMeals,
  selectWorkouts,
  type MoveAnswers,
} from './today.rules'

function workout(id: string, overrides: Partial<Workout> & { equipment?: ExerciseEquipment[] } = {}): Workout {
  const { equipment = [], ...rest } = overrides
  return {
    id,
    title: `Workout ${id}`,
    description: 'Eine kurze Beschreibung.',
    durationMinutes: 10,
    intensity: 'gentle',
    places: ['home', 'outdoors', 'gym'],
    reviewStatus: 'unreviewed',
    steps: [
      {
        position: 1,
        mode: 'reps',
        amount: 10,
        exercise: {
          id: `ex_${id}`,
          name: 'Übung',
          instructions: 'Mach es so.',
          easierName: 'Leichter',
          easierInstructions: 'Mach es leichter.',
          equipment,
        },
      },
    ],
    ...rest,
  }
}

function meal(id: string, overrides: Partial<Meal> = {}): Meal {
  return {
    id,
    title: `Mahlzeit ${id}`,
    diet: 'vegan',
    effort: 'quick',
    minutes: 8,
    ingredients: ['1 Apfel'],
    steps: ['Iss den Apfel.'],
    easierHint: 'Iss einfach den Apfel.',
    allergens: [],
    reviewStatus: 'unreviewed',
    ...overrides,
  }
}

const regular = { experience: 'regular' as const, places: ['home', 'outdoors', 'gym'] as const, homeEquipment: ['mat'] as const }
const profile = { experience: regular.experience, places: [...regular.places], homeEquipment: [...regular.homeEquipment] }

const move = (overrides: Partial<MoveAnswers> = {}): MoveAnswers => ({
  kind: 'move',
  minutes: 10,
  energy: 'high',
  place: 'outdoors',
  ...overrides,
})

const ids = (items: { id: string }[]) => items.map((item) => item.id)

describe('selectWorkouts — Kandidaten (AC-7)', () => {
  it('nimmt nur Workouts, die am gewählten Ort machbar sind', () => {
    const list = [workout('gym_only', { places: ['gym'] }), workout('outside', { places: ['outdoors'] })]
    expect(ids(selectWorkouts(move({ place: 'outdoors' }), profile, list, []))).toEqual(['outside'])
  })

  it('verlangt zuhause die Ausstattung aus dem Profil, draußen nicht', () => {
    const list = [workout('mat', { equipment: ['mat'] }), workout('dumbbells', { equipment: ['dumbbells'] })]
    expect(ids(selectWorkouts(move({ place: 'home' }), profile, list, []))).toEqual(['mat'])
    expect(ids(selectWorkouts(move({ place: 'outdoors' }), profile, list, []))).toEqual(['mat', 'dumbbells'])
  })

  it('nimmt nur Workouts, die höchstens die gewählte Zeit dauern', () => {
    const list = [workout('d5', { durationMinutes: 5 }), workout('d10', { durationMinutes: 10 }), workout('d15', { durationMinutes: 15 })]
    expect(ids(selectWorkouts(move({ minutes: 10 }), profile, list, [])).sort()).toEqual(['d10', 'd5'])
    expect(ids(selectWorkouts(move({ minutes: 5 }), profile, list, []))).toEqual(['d5'])
  })

  it.each([
    ['low', ['gentle']],
    ['medium', ['gentle', 'moderate']],
    ['high', ['gentle', 'moderate', 'vigorous']],
  ] as const)('erlaubt bei Energie %s nur %j', (energy, expected) => {
    const list = [
      workout('gentle', { intensity: 'gentle' }),
      workout('moderate', { intensity: 'moderate' }),
      workout('vigorous', { intensity: 'vigorous' }),
    ]
    expect(ids(selectWorkouts(move({ energy }), profile, list, [])).sort()).toEqual([...expected].sort())
  })

  it('begrenzt die Intensität zusätzlich über die Erfahrung (PROJ-4-Regel)', () => {
    const list = [workout('gentle', { intensity: 'gentle' }), workout('vigorous', { intensity: 'vigorous' })]
    const beginner = { ...profile, experience: 'beginner' as const }
    expect(ids(selectWorkouts(move({ energy: 'high' }), beginner, list, []))).toEqual(['gentle'])
  })

  it('nimmt nichts, was nicht zum Profil passt, auch wenn der Ort gewählt wurde', () => {
    const onlyOutdoors = { ...profile, places: ['outdoors' as const] }
    const list = [workout('gym', { places: ['gym'] })]
    expect(selectWorkouts(move({ place: 'gym' }), onlyOutdoors, list, [])).toEqual([])
  })
})

describe('selectWorkouts — Sortierung (AC-7)', () => {
  it('zeigt die gewählte Dauer vor kürzeren, kürzere absteigend', () => {
    const list = [workout('d5', { durationMinutes: 5 }), workout('d10', { durationMinutes: 10 }), workout('d15', { durationMinutes: 15 })]
    expect(ids(selectWorkouts(move({ minutes: 15 }), profile, list, []))).toEqual(['d15', 'd10', 'd5'])
  })

  it('bevorzugt bei gleicher Dauer die Intensität näher an der Energie', () => {
    const list = [workout('gentle', { intensity: 'gentle' }), workout('moderate', { intensity: 'moderate' })]
    expect(ids(selectWorkouts(move({ energy: 'medium' }), profile, list, []))).toEqual(['moderate', 'gentle'])
    const high = [workout('gentle', { intensity: 'gentle' }), workout('moderate', { intensity: 'moderate' }), workout('vigorous', { intensity: 'vigorous' })]
    expect(ids(selectWorkouts(move({ energy: 'high' }), profile, high, []))).toEqual(['vigorous', 'moderate', 'gentle'])
  })

  it('stellt kürzlich begonnene nach hinten (Abwechslung)', () => {
    const list = [workout('a'), workout('b'), workout('c')]
    expect(ids(selectWorkouts(move(), profile, list, ['a']))).toEqual(['b', 'c', 'a'])
  })

  it('behält sonst die Reihenfolge des Angebots', () => {
    const list = [workout('z'), workout('y'), workout('x')]
    expect(ids(selectWorkouts(move(), profile, list, []))).toEqual(['z', 'y', 'x'])
  })

  it('gewichtet Dauer vor Intensität vor Abwechslung', () => {
    const list = [
      workout('short_close_new', { durationMinutes: 5, intensity: 'vigorous' }),
      workout('exact_far_new', { durationMinutes: 10, intensity: 'gentle' }),
      workout('exact_close_recent', { durationMinutes: 10, intensity: 'vigorous' }),
      workout('exact_close_new', { durationMinutes: 10, intensity: 'vigorous' }),
    ]
    expect(ids(selectWorkouts(move({ minutes: 10, energy: 'high' }), profile, list, ['exact_close_recent']))).toEqual([
      'exact_close_new',
      'exact_close_recent',
      'exact_far_new',
    ])
  })

  it('liefert höchstens drei', () => {
    const list = ['a', 'b', 'c', 'd', 'e'].map((id) => workout(id))
    expect(selectWorkouts(move(), profile, list, [])).toHaveLength(3)
  })
})

describe('selectWorkouts — Grenzfälle', () => {
  it('liefert eine leere Liste, wenn nichts passt (EC-1)', () => {
    expect(selectWorkouts(move({ minutes: 5 }), profile, [workout('d15', { durationMinutes: 15 })], [])).toEqual([])
    expect(selectWorkouts(move(), profile, [], [])).toEqual([])
  })

  it('liefert weniger als drei ohne Lücken (EC-2)', () => {
    expect(ids(selectWorkouts(move(), profile, [workout('a'), workout('b')], []))).toEqual(['a', 'b'])
  })

  it('schlägt trotzdem etwas vor, wenn alles kürzlich begonnen wurde (EC-3)', () => {
    expect(ids(selectWorkouts(move(), profile, [workout('a'), workout('b')], ['a', 'b']))).toEqual(['a', 'b'])
  })
})

describe('selectMeals (AC-8)', () => {
  it('nimmt nur Mahlzeiten passend zur Essensweise', () => {
    const list = [
      meal('vegan', { diet: 'vegan' }),
      meal('veggie', { diet: 'vegetarian' }),
      meal('fish', { diet: 'meat_fish' }),
    ]
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', list, []))).toEqual(['vegan'])
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegetarian', list, []))).toEqual(['vegan', 'veggie'])
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'omnivore', list, []))).toEqual(['vegan', 'veggie', 'fish'])
    expect(selectMeals({ kind: 'eat', effort: 'quick' }, null, list, [])).toEqual([])
  })

  it('nimmt nur die gewählte Stufe, wenn sie drei oder mehr hat', () => {
    const list = [meal('nc', { effort: 'no_cook' }), meal('q1'), meal('q2'), meal('q3'), meal('q4')]
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', list, []))).toEqual(['q1', 'q2', 'q3'])
  })

  it('füllt mit einfacheren Stufen in fester Reihenfolge auf, gewählte Stufe zuerst', () => {
    const list = [
      meal('nc1', { effort: 'no_cook' }),
      meal('q1', { effort: 'quick' }),
      meal('u1', { effort: 'up_to_20', minutes: 15 }),
      meal('nc2', { effort: 'no_cook' }),
    ]
    expect(ids(selectMeals({ kind: 'eat', effort: 'up_to_20' }, 'vegan', list, []))).toEqual(['u1', 'q1', 'nc1'])
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', list, []))).toEqual(['q1', 'nc1', 'nc2'])
  })

  it('füllt nie mit aufwendigeren Stufen auf', () => {
    const list = [meal('nc1', { effort: 'no_cook' }), meal('q1'), meal('u1', { effort: 'up_to_20', minutes: 15 })]
    expect(ids(selectMeals({ kind: 'eat', effort: 'no_cook' }, 'vegan', list, []))).toEqual(['nc1'])
  })

  it('stellt innerhalb einer Stufe kürzlich begonnene nach hinten, bevor gekürzt wird', () => {
    const list = [meal('q1'), meal('q2'), meal('q3'), meal('q4')]
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', list, ['q1']))).toEqual(['q2', 'q3', 'q4'])
  })

  it('stellt eine kürzlich begonnene der gewählten Stufe trotzdem vor aufgefüllte', () => {
    const list = [meal('nc1', { effort: 'no_cook' }), meal('q1')]
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', list, ['q1']))).toEqual(['q1', 'nc1'])
  })

  it('liefert leer, wenn nichts passt (EC-1), und schlägt bei lauter kürzlich begonnenen trotzdem vor (EC-3)', () => {
    expect(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', [meal('f', { diet: 'meat_fish' })], [])).toEqual([])
    expect(ids(selectMeals({ kind: 'eat', effort: 'quick' }, 'vegan', [meal('q1')], ['q1']))).toEqual(['q1'])
  })
})

describe('Zusammenfassung und Beschriftungen (AC-5, AC-9)', () => {
  it('fasst Bewegen und Essen kurz zusammen', () => {
    expect(answersSummary({ kind: 'move', minutes: 10, energy: 'low', place: 'home' })).toBe('10 Min · wenig Energie · Zuhause')
    expect(answersSummary({ kind: 'move', minutes: 15, energy: 'high', place: 'gym' })).toBe('15 Min · viel Energie · Fitnessstudio')
    expect(answersSummary({ kind: 'eat', effort: 'quick' })).toBe('Kurz kochen')
  })

  it('formuliert die Zeile „Passt zu“', () => {
    expect(fitsLine({ kind: 'move', minutes: 5, energy: 'medium', place: 'outdoors' })).toBe('Passt zu: 5 Min · mittlere Energie · Draußen')
    expect(fitsLine({ kind: 'eat', effort: 'no_cook' })).toBe('Passt zu: Gar nicht kochen')
  })

  it('beschriftet Antworten und Bestätigungen wie in der Spec', () => {
    expect(KIND_LABELS).toEqual({ move: 'Bewegen', eat: 'Essen' })
    expect(ENERGY_LABELS).toEqual({ low: 'wenig', medium: 'mittel', high: 'viel' })
    expect(EAT_EFFORT_ANSWER_LABELS).toEqual({ no_cook: 'Gar nicht kochen', quick: 'Kurz kochen', up_to_20: 'Bis 20 Min' })
    expect(CONCLUSION_MESSAGES).toEqual({ done: 'Geschafft. Gut gemacht.', skipped: 'Okay. Vielleicht ein andermal.' })
  })
})

describe('placesToAsk und isAnswersStillValid (AC-2, AC-5, EC-7)', () => {
  it('bietet die Profil-Orte in fester Reihenfolge an', () => {
    expect(placesToAsk({ places: ['gym', 'home'] })).toEqual(['home', 'gym'])
    expect(placesToAsk({ places: ['outdoors'] })).toEqual(['outdoors'])
    expect(placesToAsk({ places: null })).toEqual([])
  })

  it('verwirft „Wie letztes Mal“, wenn der Ort nicht mehr im Profil ist', () => {
    const last = { kind: 'move' as const, minutes: 10 as const, energy: 'low' as const, place: 'gym' as const }
    expect(isAnswersStillValid(last, { places: ['home', 'gym'] })).toBe(true)
    expect(isAnswersStillValid(last, { places: ['home'] })).toBe(false)
  })

  it('verwirft ungültige Werte', () => {
    const odd = { kind: 'move', minutes: 20, energy: 'low', place: 'home' } as unknown as MoveAnswers
    expect(isAnswersStillValid(odd, { places: ['home'] })).toBe(false)
    const oddEnergy = { kind: 'move', minutes: 10, energy: 'extreme', place: 'home' } as unknown as MoveAnswers
    expect(isAnswersStillValid(oddEnergy, { places: ['home'] })).toBe(false)
  })

  it('lässt Essen immer gelten', () => {
    expect(isAnswersStillValid({ kind: 'eat', effort: 'quick' }, { places: [] })).toBe(true)
  })
})

describe('Zeitfenster (AC-13, EC-8, AC-7)', () => {
  const now = new Date('2026-11-13T20:00:00Z')
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000)

  it('zeigt begonnene Aktionen nur innerhalb von 12 Stunden', () => {
    expect(isOpenOnToday({ status: 'started', startedAt: hoursAgo(11.99) }, now)).toBe(true)
    expect(isOpenOnToday({ status: 'started', startedAt: hoursAgo(12) }, now)).toBe(false)
    expect(isOpenOnToday({ status: 'started', startedAt: hoursAgo(30) }, now)).toBe(false)
  })

  it('beginnt das 12-Stunden-Fenster genau 12 Stunden vor jetzt', () => {
    expect(openSince(now)).toEqual(hoursAgo(12))
  })

  it('zeigt abgeschlossene Aktionen nicht als offen', () => {
    expect(isOpenOnToday({ status: 'done', startedAt: hoursAgo(1) }, now)).toBe(false)
    expect(isOpenOnToday({ status: 'skipped', startedAt: hoursAgo(1) }, now)).toBe(false)
  })

  it('zählt als kürzlich begonnen nur innerhalb von 72 Stunden', () => {
    expect(recentSince(now)).toEqual(hoursAgo(72))
    expect(isRecent(hoursAgo(71.99), now)).toBe(true)
    expect(isRecent(hoursAgo(72), now)).toBe(false)
  })
})

describe('canUndo (AC-15)', () => {
  const concludedAt = new Date('2026-11-13T10:00:00Z')

  it('erlaubt Rückgängig ohne neueren Check-in', () => {
    expect(canUndo({ status: 'done', concludedAt }, null)).toBe(true)
    expect(canUndo({ status: 'skipped', concludedAt }, new Date('2026-11-13T09:00:00Z'))).toBe(true)
    expect(canUndo({ status: 'done', concludedAt }, concludedAt)).toBe(true)
  })

  it('verbietet Rückgängig nach einem neuen Check-in', () => {
    expect(canUndo({ status: 'done', concludedAt }, new Date('2026-11-13T10:00:01Z'))).toBe(false)
  })

  it('verbietet Rückgängig bei einer noch begonnenen Aktion', () => {
    expect(canUndo({ status: 'started', concludedAt: null }, null)).toBe(false)
    expect(canUndo({ status: 'done', concludedAt: null }, null)).toBe(false)
  })
})

describe('Adressen (AC-10, AC-12, AC-13)', () => {
  it('führt der Titel zum Detail aus PROJ-4 bzw. PROJ-5', () => {
    expect(detailHref('move', 'ruecken_10')).toBe('/bewegung/ruecken_10')
    expect(detailHref('eat', 'hummus_brot')).toBe('/essen/hummus_brot')
  })

  it('führt der Start zur geführten Durchführung ohne „leichter“ bzw. zum Mahlzeit-Detail', () => {
    expect(continueHref('move', 'ruecken_10')).toBe('/bewegung/ruecken_10/los')
    expect(continueHref('eat', 'hummus_brot')).toBe('/essen/hummus_brot')
  })
})
