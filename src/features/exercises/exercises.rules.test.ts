import type { Exercise, ExerciseEquipment, Workout } from '@/features/workouts/workouts.rules'
import {
  FILTER_LABELS,
  exerciseEquipmentText,
  exerciseHref,
  filterExercises,
  libraryExerciseHref,
  libraryExercises,
  libraryHref,
  offeredFilters,
  parseFilter,
  workoutsUsing,
} from './exercises.rules'

const exercise = (id: string, name: string, equipment: ExerciseEquipment[] = []): Exercise => ({
  id,
  name,
  instructions: 'Mach es so.',
  easierName: 'Leichter',
  easierInstructions: 'Mach es leichter.',
  equipment,
})

const workout = (id: string, exerciseIds: string[], durationMinutes: 5 | 10 | 15 = 10): Workout => ({
  id,
  title: `Workout ${id}`,
  description: 'Kurz.',
  durationMinutes,
  intensity: 'gentle',
  places: ['home'],
  reviewStatus: 'unreviewed',
  steps: exerciseIds.map((exerciseId, index) => ({
    position: index + 1,
    mode: 'reps',
    amount: 10,
    exercise: exercise(exerciseId, exerciseId),
  })),
})

const withHome = { places: ['home', 'outdoors'] as const, homeEquipment: ['mat'] as const }
const homeNothing = { places: ['home'] as const, homeEquipment: ['none'] as const }
const noHome = { places: ['gym'] as const, homeEquipment: null }
const profile = (p: { places: readonly string[]; homeEquipment: readonly string[] | null }) =>
  p as unknown as Parameters<typeof offeredFilters>[0]

const all = [
  exercise('unterarmstuetz', 'Unterarmstütz', ['mat']),
  exercise('uebung_a', 'Übung am Band', ['resistance_band']),
  exercise('ausfallschritt', 'Ausfallschritt'),
  exercise('arm_bein', 'Arm und Bein strecken', ['mat']),
  exercise('kh_rudern', 'Rudern mit Kurzhanteln', ['dumbbells', 'mat']),
]
const names = (list: Exercise[]) => list.map((entry) => entry.name)

describe('Filter (AC-4, AC-5, EC-2, EC-4)', () => {
  it('beschriftet die Filter wie in der Spec', () => {
    expect(FILTER_LABELS).toEqual({ alle: 'Alle', 'ohne-ausstattung': 'Ohne Ausstattung', zuhause: 'Passt zu meinem Zuhause' })
  })

  it('bietet „Passt zu meinem Zuhause“ nur mit „Zuhause“ im Profil an', () => {
    expect(offeredFilters(profile(withHome))).toEqual(['alle', 'ohne-ausstattung', 'zuhause'])
    expect(offeredFilters(profile(noHome))).toEqual(['alle', 'ohne-ausstattung'])
  })

  it('liest den Filter aus der Adresse und fällt sonst auf „Alle“ zurück', () => {
    expect(parseFilter('ohne-ausstattung', profile(withHome))).toBe('ohne-ausstattung')
    expect(parseFilter('zuhause', profile(withHome))).toBe('zuhause')
    expect(parseFilter('zuhause', profile(noHome))).toBe('alle')
    expect(parseFilter('quatsch', profile(withHome))).toBe('alle')
    expect(parseFilter(['zuhause'], profile(withHome))).toBe('alle')
    expect(parseFilter(undefined, profile(withHome))).toBe('alle')
  })

  it('zeigt mit „Ohne Ausstattung“ nur Übungen ohne Ausstattung', () => {
    expect(names(filterExercises(all, 'ohne-ausstattung', profile(withHome)))).toEqual(['Ausfallschritt'])
  })

  it('zeigt mit „Passt zu meinem Zuhause“ nur Übungen, deren gesamte Ausstattung zuhause vorhanden ist', () => {
    expect(names(filterExercises(all, 'zuhause', profile(withHome)))).toEqual(['Arm und Bein strecken', 'Ausfallschritt', 'Unterarmstütz'])
    expect(names(filterExercises(all, 'zuhause', profile(homeNothing)))).toEqual(['Ausfallschritt'])
  })
})

describe('Liste (AC-3)', () => {
  it('sortiert alle Übungen alphabetisch in deutscher Reihenfolge, Umlaute wie Grundbuchstaben', () => {
    expect(names(filterExercises(all, 'alle', profile(withHome)))).toEqual([
      'Arm und Bein strecken',
      'Ausfallschritt',
      'Rudern mit Kurzhanteln',
      'Übung am Band',
      'Unterarmstütz',
    ])
  })

  it('nennt die Ausstattung oder „Ohne Ausstattung“', () => {
    expect(exerciseEquipmentText(all[4])).toBe('Kurzhanteln, Matte')
    expect(exerciseEquipmentText(all[2])).toBe('Ohne Ausstattung')
  })
})

describe('Pausen (AC-3, AC-11)', () => {
  const pause: Exercise = { ...exercise('kurze_pause', 'Kurze Pause'), isPause: true }
  const notPause: Exercise = { ...exercise('marschieren', 'Marschieren'), isPause: false }

  it('lässt Pausen aus der Bibliothek weg, Übungen ohne Merkmal bleiben', () => {
    expect(names(libraryExercises([pause, ...all, notPause]))).toEqual([...names(all), 'Marschieren'])
  })

  it('in keinem Filter erscheint eine Pause', () => {
    for (const filter of ['alle', 'ohne-ausstattung', 'zuhause'] as const) {
      expect(names(filterExercises(libraryExercises([pause, ...all]), filter, profile(homeNothing)))).not.toContain('Kurze Pause')
    }
  })

  it('gibt Pausen keine Bibliotheksadresse, anderen Übungen schon', () => {
    expect(libraryExerciseHref(pause)).toBeNull()
    expect(libraryExerciseHref(notPause)).toBe('/bewegung/uebungen/marschieren')
    expect(libraryExerciseHref(all[0])).toBe(`/bewegung/uebungen/${all[0].id}`)
  })
})

describe('Adressen (AC-6, AC-9)', () => {
  it('nimmt den Filter in Liste und Detail mit, „Alle“ ohne Parameter', () => {
    expect(libraryHref()).toBe('/bewegung/uebungen')
    expect(libraryHref('zuhause')).toBe('/bewegung/uebungen?filter=zuhause')
    expect(exerciseHref('kniebeuge')).toBe('/bewegung/uebungen/kniebeuge')
    expect(exerciseHref('kniebeuge', 'ohne-ausstattung')).toBe('/bewegung/uebungen/kniebeuge?filter=ohne-ausstattung')
  })
})

describe('Kommt vor in (AC-8, EC-3)', () => {
  it('nennt die angebotenen Workouts mit der Übung in Angebotsreihenfolge, jedes nur einmal', () => {
    const offered = [workout('b', ['kniebeuge', 'pause', 'kniebeuge'], 15), workout('a', ['marschieren']), workout('c', ['kniebeuge'], 5)]
    expect(workoutsUsing('kniebeuge', offered)).toEqual([
      { id: 'b', title: 'Workout b', duration: '15 Min', href: '/bewegung/b' },
      { id: 'c', title: 'Workout c', duration: '5 Min', href: '/bewegung/c' },
    ])
  })

  it('liefert nichts, wenn die Übung in keinem angebotenen Workout vorkommt', () => {
    expect(workoutsUsing('kniebeuge', [workout('a', ['marschieren'])])).toEqual([])
  })
})
