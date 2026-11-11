import { act, render, screen } from '@testing-library/react'
import { MOTION_ATTRIBUTE, MOTION_STORAGE_KEY, THEME_STORAGE_KEY } from './appearance.rules'
import { AppearanceProvider, useAppearance } from './appearance-provider'
import { APPEARANCE_SCRIPT } from './appearance-script'

let deviceReduces = false
let deviceDark = false

/** Node 26 shadows jsdom's localStorage with its own (unconfigured) one — give the tests a real store. */
class MemoryStorage {
  private items = new Map<string, string>()
  get length() {
    return this.items.size
  }
  clear() {
    this.items.clear()
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value))
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
}
const storage = new MemoryStorage()
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })

beforeEach(() => {
  deviceReduces = false
  deviceDark = false
  window.localStorage.clear()
  document.documentElement.removeAttribute(MOTION_ATTRIBUTE)
  document.documentElement.className = ''
  vi.restoreAllMocks()
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes('reduced-motion') ? deviceReduces : query.includes('dark') ? deviceDark : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

function Probe() {
  const appearance = useAppearance()
  return (
    <div>
      <p data-testid="theme">{appearance.theme}</p>
      <p data-testid="reduces">{String(appearance.reducesMotion)}</p>
      <p data-testid="device">{String(appearance.deviceReducesMotion)}</p>
      <button onClick={() => appearance.setUserReducesMotion(!appearance.userReducesMotion)}>motion</button>
      <button onClick={() => appearance.setTheme('light')}>hell</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <AppearanceProvider>
      <Probe />
    </AppearanceProvider>
  )
}

describe('Farbschema', () => {
  it('folgt ohne eigene Wahl dem Gerät (AC-13)', () => {
    deviceDark = true
    renderProbe()
    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('übernimmt eine Wahl sofort und speichert sie auf dem Gerät (AC-14)', () => {
    deviceDark = true
    renderProbe()
    act(() => screen.getByText('hell').click())
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
})

describe('Bewegung reduzieren (AC-15)', () => {
  it('schaltet die eigene Einstellung ein, setzt das Attribut und speichert sie', () => {
    renderProbe()
    expect(screen.getByTestId('reduces').textContent).toBe('false')
    act(() => screen.getByText('motion').click())
    expect(screen.getByTestId('reduces').textContent).toBe('true')
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('true')
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe('on')
    act(() => screen.getByText('motion').click())
    expect(document.documentElement.hasAttribute(MOTION_ATTRIBUTE)).toBe(false)
  })

  it('berücksichtigt die Geräteeinstellung auch ohne eigenen Schalter', () => {
    deviceReduces = true
    renderProbe()
    expect(screen.getByTestId('device').textContent).toBe('true')
    expect(screen.getByTestId('reduces').textContent).toBe('true')
  })

  it('funktioniert ohne Gerätespeicher weiter, ohne Fehler (EC-2)', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    renderProbe()
    expect(() => act(() => screen.getByText('motion').click())).not.toThrow()
    expect(screen.getByTestId('reduces').textContent).toBe('true')
  })
})

describe('Skript vor dem ersten Zeichnen (EC-1)', () => {
  it('setzt „Bewegung reduzieren“ aus dem Gerätespeicher', () => {
    window.localStorage.setItem(MOTION_STORAGE_KEY, 'on')
    new Function(APPEARANCE_SCRIPT)()
    expect(document.documentElement.getAttribute(MOTION_ATTRIBUTE)).toBe('true')
  })

  it('lässt das Attribut ohne Wahl weg und wirft auch ohne Speicher nicht', () => {
    new Function(APPEARANCE_SCRIPT)()
    expect(document.documentElement.hasAttribute(MOTION_ATTRIBUTE)).toBe(false)
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => new Function(APPEARANCE_SCRIPT)()).not.toThrow()
  })
})
