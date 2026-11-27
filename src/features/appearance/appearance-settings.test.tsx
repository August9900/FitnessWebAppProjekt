import { act, render, screen } from '@testing-library/react'
import { MOTION_ATTRIBUTE, MOTION_STORAGE_KEY, THEME_STORAGE_KEY } from './appearance.rules'
import { AppearanceProvider } from './appearance-provider'
import { AppearanceSettings } from './appearance-settings'

let deviceReduces = false

/** Node 26 shadows jsdom's localStorage with its own (unconfigured) one — give the tests a real store. */
const items = new Map<string, string>()
const storage = {
  get length() {
    return items.size
  },
  clear: () => items.clear(),
  getItem: (key: string) => items.get(key) ?? null,
  setItem: (key: string, value: string) => void items.set(key, String(value)),
  removeItem: (key: string) => void items.delete(key),
  key: (index: number) => [...items.keys()][index] ?? null,
}
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })

beforeAll(() => {
  // Radix primitives measure elements; jsdom does not implement ResizeObserver.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  deviceReduces = false
  storage.clear()
  document.documentElement.removeAttribute(MOTION_ATTRIBUTE)
  document.documentElement.className = ''
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('reduced-motion') ? deviceReduces : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

function renderSettings() {
  return render(
    <AppearanceProvider>
      <AppearanceSettings />
    </AppearanceProvider>
  )
}

describe('Darstellung', () => {
  it('bietet System, Hell und Dunkel an; ohne Wahl ist System gewählt (AC-13, AC-14)', () => {
    renderSettings()
    const radios = screen.getAllByRole('radio')
    expect(radios).toEqual([
      screen.getByRole('radio', { name: 'System' }),
      screen.getByRole('radio', { name: 'Hell' }),
      screen.getByRole('radio', { name: 'Dunkel' }),
    ])
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
  })

  it('übernimmt „Hell“ sofort und merkt es sich auf dem Gerät (AC-14)', () => {
    renderSettings()
    act(() => screen.getByRole('radio', { name: 'Hell' }).click())
    expect(screen.getByRole('radio', { name: 'Hell' })).toBeChecked()
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('schaltet „Bewegung reduzieren“ ein und aus (AC-15)', () => {
    renderSettings()
    const toggle = screen.getByRole('switch', { name: 'Bewegung reduzieren' })
    expect(toggle).not.toBeChecked()
    act(() => toggle.click())
    expect(toggle).toBeChecked()
    expect(storage.getItem(MOTION_STORAGE_KEY)).toBe('on')
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('true')
  })

  it('zeigt die Geräteeinstellung als eingeschaltet und gesperrt mit Hinweis', () => {
    deviceReduces = true
    renderSettings()
    const toggle = screen.getByRole('switch', { name: 'Bewegung reduzieren' })
    expect(toggle).toBeChecked()
    expect(toggle).toBeDisabled()
    expect(screen.getByText('Dein Gerät reduziert Bewegung bereits.')).toBeInTheDocument()
  })
})
