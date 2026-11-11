'use client'

// Colour scheme (via next-themes) and "Bewegung reduzieren", both kept on this device only.
// Every storage access is guarded: without storage the choice lives in memory until reload (EC-2).
import { ThemeProvider, useTheme } from 'next-themes'
import { useCallback, useSyncExternalStore, type ReactNode } from 'react'
import {
  MOTION_ATTRIBUTE,
  MOTION_STORAGE_KEY,
  THEME_STORAGE_KEY,
  parseMotionChoice,
  parseThemeChoice,
  serializeMotionChoice,
  shouldReduceMotion,
  type ThemeChoice,
} from './appearance.rules'

const MOTION_EVENT = 'pulse:reduce-motion'
const DEVICE_QUERY = '(prefers-reduced-motion: reduce)'

/** Fallback when the browser refuses storage — lost on reload, by design (EC-2). */
let memoryMotionChoice: boolean | null = null

function readUserMotion(): boolean {
  try {
    return parseMotionChoice(window.localStorage.getItem(MOTION_STORAGE_KEY))
  } catch {
    return memoryMotionChoice ?? false
  }
}

function writeUserMotion(reduce: boolean) {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, serializeMotionChoice(reduce))
  } catch {
    memoryMotionChoice = reduce
  }
  if (reduce) document.documentElement.setAttribute(MOTION_ATTRIBUTE, 'true')
  else document.documentElement.removeAttribute(MOTION_ATTRIBUTE)
  window.dispatchEvent(new Event(MOTION_EVENT))
}

function subscribeUserMotion(onChange: () => void) {
  window.addEventListener(MOTION_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(MOTION_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function deviceMedia(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DEVICE_QUERY) : null
}

function subscribeDeviceMotion(onChange: () => void) {
  const media = deviceMedia()
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

const serverFalse = () => false

export function AppearanceProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={['light', 'dark']}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

export type Appearance = {
  theme: ThemeChoice
  setTheme: (choice: ThemeChoice) => void
  /** The person's own "Bewegung reduzieren" switch. */
  userReducesMotion: boolean
  setUserReducesMotion: (reduce: boolean) => void
  /** The device already asks for reduced motion — the own switch cannot turn that off. */
  deviceReducesMotion: boolean
  reducesMotion: boolean
}

export function useAppearance(): Appearance {
  const { theme, setTheme } = useTheme()
  const userReducesMotion = useSyncExternalStore(subscribeUserMotion, readUserMotion, serverFalse)
  const deviceReducesMotion = useSyncExternalStore(
    subscribeDeviceMotion,
    () => deviceMedia()?.matches ?? false,
    serverFalse
  )
  const setUserReducesMotion = useCallback((reduce: boolean) => writeUserMotion(reduce), [])

  return {
    theme: parseThemeChoice(theme),
    setTheme: (choice) => setTheme(choice),
    userReducesMotion,
    setUserReducesMotion,
    deviceReducesMotion,
    reducesMotion: shouldReduceMotion({ deviceReduces: deviceReducesMotion, userReduces: userReducesMotion }),
  }
}
