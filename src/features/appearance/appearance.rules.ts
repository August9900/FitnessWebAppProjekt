/**
 * Appearance preferences kept on the device only (PROJ-2): colour scheme and "reduce motion".
 * Pure rules — reading and writing the browser storage happens in the provider.
 */

export const THEME_STORAGE_KEY = 'pulse-theme'
export const MOTION_STORAGE_KEY = 'pulse-reduce-motion'
/** Attribute on <html> that the central CSS rule listens to. */
export const MOTION_ATTRIBUTE = 'data-reduce-motion'

export const THEME_CHOICES = ['system', 'light', 'dark'] as const
export type ThemeChoice = (typeof THEME_CHOICES)[number]

export const THEME_LABELS: Record<ThemeChoice, string> = {
  system: 'Wie das Gerät',
  light: 'Hell',
  dark: 'Dunkel',
}

/** Anything that is not a known choice counts as "no choice" → follow the device (AC-13). */
export function parseThemeChoice(value: unknown): ThemeChoice {
  return THEME_CHOICES.includes(value as ThemeChoice) ? (value as ThemeChoice) : 'system'
}

/** Only an explicit "on" switches the own setting on; missing or invalid values mean off. */
export function parseMotionChoice(value: unknown): boolean {
  return value === 'on'
}

export function serializeMotionChoice(reduce: boolean): 'on' | 'off' {
  return reduce ? 'on' : 'off'
}

/** The own switch can only add reduction: a device that asks for less motion always wins (AC-15). */
export function shouldReduceMotion(input: { deviceReduces: boolean; userReduces: boolean }): boolean {
  return input.deviceReduces || input.userReduces
}
