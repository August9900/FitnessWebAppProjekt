import { render, screen, within } from '@testing-library/react'
import { SidebarProvider } from '@/components/ui/sidebar'

let pathname = '/essen'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

const { DesktopNav } = await import('./desktop-nav')
const { MobileNav } = await import('./mobile-nav')
const { navAreasFor } = await import('./navigation.rules')

beforeAll(() => {
  // jsdom has no matchMedia; the sidebar provider asks it for the mobile breakpoint.
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
})

const EXPECTED = [
  ['Heute', '/heute'],
  ['Bewegung', '/bewegung'],
  ['Essen', '/essen'],
  ['Wochenblick', '/wochenblick'],
  ['Profil', '/profil'],
]

function linksOf(nav: HTMLElement) {
  return within(nav).getAllByRole('link')
}

function nameOf(link: HTMLElement) {
  return link.getAttribute('aria-label') ?? link.textContent
}

describe.each([
  ['Seitenleiste', () => render(<SidebarProvider><DesktopNav /></SidebarProvider>)],
  ['untere Navigation', () => render(<MobileNav />)],
])('%s', (_name, renderNav) => {
  beforeEach(() => {
    pathname = '/essen'
  })

  it('zeigt die fünf Bereiche in fester Reihenfolge mit Namen (AC-1, AC-2)', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    expect(linksOf(nav).map((link) => [nameOf(link), link.getAttribute('href')])).toEqual(EXPECTED)
  })

  it('markiert genau den aktuellen Bereich als aktuelle Seite (AC-3)', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    const current = linksOf(nav).filter((link) => link.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0].getAttribute('href')).toBe('/essen')
  })

  it('markiert auch Unterseiten, aber keinen Bereich bei unbekannter Adresse', () => {
    pathname = '/profil/export'
    const { unmount } = renderNav()
    expect(screen.getByRole('link', { current: 'page' }).getAttribute('href')).toBe('/profil')
    unmount()
    pathname = '/gibt-es-nicht'
    renderNav()
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull()
  })

  it('erreicht jeden Eintrag per Tastatur (AC-8)', () => {
    renderNav()
    for (const [label] of EXPECTED) {
      const link = screen.getByRole('link', { name: label })
      link.focus()
      expect(document.activeElement).toBe(link)
    }
  })
})

describe('untere Navigation (EC-4)', () => {
  it('hat für jeden Eintrag den vollständigen zugänglichen Namen, auch bei Trennstelle', () => {
    render(<MobileNav />)
    expect(screen.getByRole('link', { name: 'Wochenblick' })).toBeInTheDocument()
  })
})

describe('mit „Gewicht“ (AC-19, EC-4)', () => {
  const six = navAreasFor({ showWeight: true })
  const SIX = [...EXPECTED.slice(0, 4), ['Gewicht', '/gewicht'], EXPECTED[4]]

  it.each([
    ['Seitenleiste', () => render(<SidebarProvider><DesktopNav areas={six} /></SidebarProvider>)],
    ['untere Navigation', () => render(<MobileNav areas={six} />)],
  ])('%s zeigt sechs Bereiche, „Gewicht“ zwischen Wochenblick und Profil', (_name, renderNav) => {
    pathname = '/gewicht'
    renderNav()
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    expect(linksOf(nav).map((link) => [nameOf(link), link.getAttribute('href')])).toEqual(SIX)
    expect(screen.getByRole('link', { current: 'page' }).getAttribute('href')).toBe('/gewicht')
  })

  it('untere Navigation: sechs gleiche Spalten, 12-px-Beschriftung, volle Namen trotz Trennstellen', () => {
    render(<MobileNav areas={six} />)
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    expect(nav.querySelector('ul')?.className).toContain('grid-cols-6')
    for (const link of linksOf(nav)) {
      expect(link.className).toContain('text-xs')
      expect(link.style.minHeight).toBe('4.5rem')
    }
    expect(screen.getByRole('link', { name: 'Bewegung' })).toBeInTheDocument()
  })

  it('untere Navigation mit fünf Bereichen bleibt wie bisher', () => {
    render(<MobileNav />)
    const nav = screen.getByRole('navigation', { name: 'Hauptnavigation' })
    expect(nav.querySelector('ul')?.className).toContain('grid-cols-5')
    expect(linksOf(nav)[0].className).toContain('text-sm')
  })
})
