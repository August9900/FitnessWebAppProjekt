import {
  EMPTY_ANSWERS,
  applyAnswer,
  firstOpenQuestion,
  isComplete,
  neighboursOf,
  normalizeAnswers,
  progressOf,
  questionsFor,
  type ProfileAnswers,
} from './profile.rules'

const complete: ProfileAnswers = {
  goal: 'fitness',
  experience: 'beginner',
  places: ['home', 'outdoors'],
  homeEquipment: ['mat'],
  diet: 'vegetarian',
}

describe('questionsFor (AC-6, AC-11)', () => {
  it('stellt höchstens fünf Fragen, die Ausstattung nur mit „Zuhause“', () => {
    expect(questionsFor(EMPTY_ANSWERS)).toEqual(['goal', 'experience', 'places', 'diet'])
    expect(questionsFor({ ...EMPTY_ANSWERS, places: ['gym'] })).toHaveLength(4)
    expect(questionsFor({ ...EMPTY_ANSWERS, places: ['home'] })).toEqual([
      'goal',
      'experience',
      'places',
      'homeEquipment',
      'diet',
    ])
  })
})

describe('firstOpenQuestion (EC-1)', () => {
  it('beginnt bei der ersten unbeantworteten Frage', () => {
    expect(firstOpenQuestion(EMPTY_ANSWERS)).toBe('goal')
    expect(firstOpenQuestion({ ...EMPTY_ANSWERS, goal: 'fitness', experience: 'regular' })).toBe('places')
    expect(firstOpenQuestion({ ...complete, homeEquipment: null })).toBe('homeEquipment')
    expect(firstOpenQuestion({ ...complete, places: [] })).toBe('places')
  })

  it('findet nichts mehr, wenn alles beantwortet ist', () => {
    expect(firstOpenQuestion(complete)).toBeNull()
  })
})

describe('isComplete (AC-1, AC-9, EC-4)', () => {
  it('ist vollständig mit allen Angaben, die Ausstattung nur mit „Zuhause“', () => {
    expect(isComplete(complete)).toBe(true)
    expect(isComplete({ ...complete, places: ['gym'], homeEquipment: null })).toBe(true)
    expect(isComplete({ ...complete, homeEquipment: null })).toBe(false)
    expect(isComplete({ ...complete, diet: null })).toBe(false)
    expect(isComplete(EMPTY_ANSWERS)).toBe(false)
  })
})

describe('normalizeAnswers / applyAnswer (AC-14)', () => {
  it('entfernt die Ausstattung, sobald „Zuhause“ fehlt', () => {
    expect(normalizeAnswers({ ...complete, places: ['outdoors'] }).homeEquipment).toBeNull()
    expect(applyAnswer(complete, 'places', ['gym']).homeEquipment).toBeNull()
    expect(applyAnswer(complete, 'places', ['home']).homeEquipment).toEqual(['mat'])
  })
})

describe('Fortschritt und Nachbarn (AC-2)', () => {
  it('zählt „Frage X von Y“ passend zu den Orten', () => {
    expect(progressOf(EMPTY_ANSWERS, 'places')).toEqual({ current: 3, total: 4 })
    expect(progressOf(complete, 'diet')).toEqual({ current: 5, total: 5 })
  })

  it('kennt die vorherige und nächste Frage', () => {
    expect(neighboursOf(complete, 'goal')).toEqual({ previous: null, next: 'experience' })
    expect(neighboursOf(complete, 'places')).toEqual({ previous: 'experience', next: 'homeEquipment' })
    expect(neighboursOf({ ...complete, places: ['gym'] }, 'places')).toEqual({ previous: 'experience', next: 'diet' })
    expect(neighboursOf(complete, 'diet')).toEqual({ previous: 'homeEquipment', next: null })
  })
})
