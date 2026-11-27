import { NAV_AREAS, activeArea, isActivePath, navAreasFor } from './navigation.rules'

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

describe('navAreasFor (AC-19, EC-4)', () => {
  it('ohne Gewicht: die fünf Bereiche wie bisher', () => {
    expect(navAreasFor({ showWeight: false })).toEqual(NAV_AREAS)
    expect(navAreasFor({ showWeight: false }).map((area) => area.key)).not.toContain('gewicht')
  })

  it('mit Gewicht: sechs Bereiche, „Gewicht“ zwischen Wochenblick und Profil', () => {
    expect(navAreasFor({ showWeight: true }).map((area) => [area.label, area.href])).toEqual([
      ['Heute', '/heute'],
      ['Bewegung', '/bewegung'],
      ['Essen', '/essen'],
      ['Wochenblick', '/wochenblick'],
      ['Gewicht', '/gewicht'],
      ['Profil', '/profil'],
    ])
  })

  it('bei sechs Einträgen darf „Bewegung“ zusätzlich umbrechen, die Wörter bleiben dieselben', () => {
    const six = navAreasFor({ showWeight: true })
    expect(six.find((area) => area.key === 'bewegung')?.compactLabel).toBe('Be\u00ADwe\u00ADgung')
    expect(NAV_AREAS.find((area) => area.key === 'bewegung')?.compactLabel).toBe('Bewegung')
    for (const area of six) {
      expect(area.compactLabel.replace(/\u00AD/g, '')).toBe(area.label)
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
    expect(activeArea('/gewicht')?.label).toBe('Gewicht')
  })
})
