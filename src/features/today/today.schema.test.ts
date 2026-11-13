import {
  checkInSchema,
  concludeActionSchema,
  startActionSchema,
  undoConclusionSchema,
} from './today.schema'

const UUID = '6f1c2b8e-3d4a-4f5b-9c6d-7e8f9a0b1c2d'

describe('checkInSchema (AC-2, AC-3)', () => {
  it('nimmt einen vollständigen Bewegungs-Check-in an', () => {
    expect(checkInSchema.safeParse({ kind: 'move', minutes: 10, energy: 'low', place: 'home' }).success).toBe(true)
  })

  it('nimmt einen Essens-Check-in mit Aufwand an', () => {
    expect(checkInSchema.safeParse({ kind: 'eat', effort: 'no_cook' }).success).toBe(true)
  })

  it.each([
    ['unbekannte Zeit', { kind: 'move', minutes: 20, energy: 'low', place: 'home' }],
    ['Zeit als Text', { kind: 'move', minutes: '10', energy: 'low', place: 'home' }],
    ['unbekannte Energie', { kind: 'move', minutes: 10, energy: 'extreme', place: 'home' }],
    ['unbekannter Ort', { kind: 'move', minutes: 10, energy: 'low', place: 'office' }],
    ['fehlender Ort', { kind: 'move', minutes: 10, energy: 'low' }],
    ['Aufwand bei Bewegen', { kind: 'move', minutes: 10, energy: 'low', place: 'home', effort: 'quick' }],
    ['unbekannter Aufwand', { kind: 'eat', effort: 'slow' }],
    ['Zeit bei Essen', { kind: 'eat', effort: 'quick', minutes: 5 }],
    ['unbekannte Art', { kind: 'sleep' }],
    ['fremdes Feld', { kind: 'eat', effort: 'quick', userId: UUID }],
  ])('lehnt ab: %s', (_label, input) => {
    expect(checkInSchema.safeParse(input).success).toBe(false)
  })
})

describe('startActionSchema (AC-12)', () => {
  it('nimmt Check-in-ID und Inhalts-ID an', () => {
    expect(startActionSchema.safeParse({ checkInId: UUID, itemId: 'morgen_mobil_5' }).success).toBe(true)
  })

  it.each([
    ['keine UUID', { checkInId: 'abc', itemId: 'morgen_mobil_5' }],
    ['ungültige Inhalts-ID', { checkInId: UUID, itemId: '../etwas' }],
    ['Großbuchstaben', { checkInId: UUID, itemId: 'Morgen' }],
    ['fehlende Inhalts-ID', { checkInId: UUID }],
    ['fremdes Feld', { checkInId: UUID, itemId: 'morgen_mobil_5', status: 'done' }],
  ])('lehnt ab: %s', (_label, input) => {
    expect(startActionSchema.safeParse(input).success).toBe(false)
  })
})

describe('concludeActionSchema (AC-14)', () => {
  it.each(['done', 'skipped'])('nimmt %s an', (status) => {
    expect(concludeActionSchema.safeParse({ actionId: UUID, status }).success).toBe(true)
  })

  it.each([
    ['zurück auf begonnen', { actionId: UUID, status: 'started' }],
    ['unbekannter Zustand', { actionId: UUID, status: 'failed' }],
    ['keine UUID', { actionId: '1', status: 'done' }],
  ])('lehnt ab: %s', (_label, input) => {
    expect(concludeActionSchema.safeParse(input).success).toBe(false)
  })
})

describe('undoConclusionSchema (AC-15)', () => {
  it('nimmt eine Aktions-ID an und lehnt alles andere ab', () => {
    expect(undoConclusionSchema.safeParse({ actionId: UUID }).success).toBe(true)
    expect(undoConclusionSchema.safeParse({ actionId: 'x' }).success).toBe(false)
    expect(undoConclusionSchema.safeParse({ actionId: UUID, status: 'started' }).success).toBe(false)
  })
})
