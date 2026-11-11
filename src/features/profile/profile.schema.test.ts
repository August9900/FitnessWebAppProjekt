import {
  LABELS,
  MESSAGES,
  answerSchema,
  fieldErrorsOf,
  homeEquipmentSchema,
  placesSchema,
  profileAnswersSchema,
} from './profile.schema'

describe('Antwortmöglichkeiten (AC-3 bis AC-7)', () => {
  it('bietet genau die vereinbarten Beschriftungen an', () => {
    expect(Object.values(LABELS.goal)).toEqual([
      'Mich mehr bewegen',
      'Fitter und ausdauernder werden',
      'Kräftiger werden',
      'Besser essen',
      'Mich insgesamt wohler fühlen',
    ])
    expect(Object.values(LABELS.experience)).toEqual([
      'Ich fange gerade an',
      'Ich bewege mich ab und zu',
      'Ich trainiere regelmäßig',
    ])
    expect(Object.values(LABELS.places)).toEqual(['Zuhause', 'Draußen', 'Fitnessstudio'])
    expect(Object.values(LABELS.homeEquipment)).toEqual([
      'Matte',
      'Kurzhanteln',
      'Widerstandsband',
      'Klimmzugstange',
      'Kettlebell',
      'Nichts davon',
    ])
    expect(Object.values(LABELS.diet)).toEqual(['Ich esse alles', 'Vegetarisch', 'Vegan'])
  })
})

describe('answerSchema', () => {
  it('nimmt je Frage einen gültigen Wert an', () => {
    expect(answerSchema.safeParse({ question: 'goal', value: 'strength' }).success).toBe(true)
    expect(answerSchema.safeParse({ question: 'places', value: ['home', 'gym'] }).success).toBe(true)
    expect(answerSchema.safeParse({ question: 'diet', value: 'vegan' }).success).toBe(true)
  })

  it('lehnt unbekannte Werte und fehlende Antworten mit Hinweis ab (AC-8, EC-5)', () => {
    const goal = answerSchema.safeParse({ question: 'goal', value: 'abnehmen' })
    expect(fieldErrorsOf(goal.error!).value).toBe(MESSAGES.goal)
    const missing = answerSchema.safeParse({ question: 'experience' })
    expect(fieldErrorsOf(missing.error!).value).toBe(MESSAGES.experience)
    expect(answerSchema.safeParse({ question: 'gewicht', value: 70 }).success).toBe(false)
  })
})

describe('Mehrfachauswahl', () => {
  it('verlangt mindestens einen Ort und keine Doppelten (AC-5)', () => {
    expect(placesSchema.safeParse([]).error?.issues[0].message).toBe(MESSAGES.places)
    expect(placesSchema.safeParse(['home', 'home']).success).toBe(false)
    expect(placesSchema.safeParse(['outdoors']).success).toBe(true)
  })

  it('lässt „Nichts davon“ nur allein zu (AC-6, EC-5)', () => {
    expect(homeEquipmentSchema.safeParse(['none']).success).toBe(true)
    expect(homeEquipmentSchema.safeParse(['mat', 'kettlebell']).success).toBe(true)
    expect(homeEquipmentSchema.safeParse(['none', 'mat']).error?.issues[0].message).toBe(MESSAGES.noneAlone)
    expect(homeEquipmentSchema.safeParse([]).error?.issues[0].message).toBe(MESSAGES.homeEquipment)
  })
})

describe('profileAnswersSchema (AC-13, AC-14)', () => {
  const base = { goal: 'wellbeing', experience: 'occasional', diet: 'omnivore' } as const

  it('verlangt die Ausstattung, wenn „Zuhause“ gewählt ist', () => {
    const result = profileAnswersSchema.safeParse({ ...base, places: ['home'], homeEquipment: null })
    expect(fieldErrorsOf(result.error!).homeEquipment).toBe(MESSAGES.homeEquipment)
  })

  it('entfernt die Ausstattung, wenn „Zuhause“ fehlt', () => {
    const result = profileAnswersSchema.safeParse({ ...base, places: ['gym'], homeEquipment: ['mat'] })
    expect(result.success).toBe(true)
    expect(result.data?.homeEquipment).toBeNull()
  })

  it('übernimmt vollständige Angaben mit Ausstattung', () => {
    const result = profileAnswersSchema.safeParse({ ...base, places: ['home', 'outdoors'], homeEquipment: ['resistance_band'] })
    expect(result.data).toEqual({ ...base, places: ['home', 'outdoors'], homeEquipment: ['resistance_band'] })
  })

  it('meldet jedes fehlende Feld an seiner Stelle', () => {
    const result = profileAnswersSchema.safeParse({})
    expect(fieldErrorsOf(result.error!)).toMatchObject({
      goal: MESSAGES.goal,
      experience: MESSAGES.experience,
      places: MESSAGES.places,
      diet: MESSAGES.diet,
    })
  })
})
