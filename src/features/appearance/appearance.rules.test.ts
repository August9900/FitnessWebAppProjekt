import {
  THEME_CHOICES,
  THEME_LABELS,
  parseMotionChoice,
  parseThemeChoice,
  serializeMotionChoice,
  shouldReduceMotion,
} from './appearance.rules'

describe('parseThemeChoice (AC-13, AC-14, EC-2)', () => {
  it('keeps a valid stored choice', () => {
    expect(parseThemeChoice('light')).toBe('light')
    expect(parseThemeChoice('dark')).toBe('dark')
    expect(parseThemeChoice('system')).toBe('system')
  })

  it('treats missing or invalid values as "follow the device"', () => {
    for (const value of [null, undefined, '', 'blau', 42]) {
      expect(parseThemeChoice(value)).toBe('system')
    }
  })

  it('offers exactly System, Hell and Dunkel', () => {
    expect(THEME_CHOICES.map((choice) => THEME_LABELS[choice])).toEqual(['System', 'Hell', 'Dunkel'])
  })
})

describe('motion choice (AC-15)', () => {
  it('is only on for an explicit "on"', () => {
    expect(parseMotionChoice('on')).toBe(true)
    for (const value of ['off', null, 'true', 1]) expect(parseMotionChoice(value)).toBe(false)
  })

  it('round-trips through storage values', () => {
    expect(parseMotionChoice(serializeMotionChoice(true))).toBe(true)
    expect(parseMotionChoice(serializeMotionChoice(false))).toBe(false)
  })

  it('lets the device setting win over an own "off"', () => {
    expect(shouldReduceMotion({ deviceReduces: true, userReduces: false })).toBe(true)
    expect(shouldReduceMotion({ deviceReduces: false, userReduces: true })).toBe(true)
    expect(shouldReduceMotion({ deviceReduces: false, userReduces: false })).toBe(false)
  })
})
