import { NAV_AREAS, activeArea, isActivePath } from './navigation.rules'

describe('NAV_AREAS', () => {
  it('lists the five areas in the agreed order and names (AC-1, AC-2)', () => {
    expect(NAV_AREAS.map((area) => [area.label, area.href])).toEqual([
      ['Heute', '/heute'],
      ['Bewegung', '/bewegung'],
      ['Essen', '/essen'],
      ['Wochenblick', '/wochenblick'],
      ['Profil', '/profil'],
    ])
  })

  it('keeps the compact labels readable as the same words (EC-4)', () => {
    for (const area of NAV_AREAS) {
      expect(area.compactLabel.replace(/­/g, '')).toBe(area.label)
    }
  })
})

describe('isActivePath (AC-3)', () => {
  it('matches the area itself and its sub-paths', () => {
    expect(isActivePath('/profil', '/profil')).toBe(true)
    expect(isActivePath('/profil/export', '/profil')).toBe(true)
  })

  it('does not match neighbours that merely share a prefix', () => {
    expect(isActivePath('/profilbild', '/profil')).toBe(false)
    expect(isActivePath('/', '/heute')).toBe(false)
    expect(isActivePath(null, '/heute')).toBe(false)
  })
})

describe('activeArea', () => {
  it('finds the area for a path, or none for an unknown path', () => {
    expect(activeArea('/wochenblick')?.key).toBe('wochenblick')
    expect(activeArea('/gibt-es-nicht')).toBeUndefined()
  })
})
