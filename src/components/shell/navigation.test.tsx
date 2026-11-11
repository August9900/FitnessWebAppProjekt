import { render, screen, within } from '@testing-library/react'
import { SidebarProvider } from '@/components/ui/sidebar'

let pathname = '/essen'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

const { DesktopNav } = await import('./desktop-nav')
const { MobileNav } = await import('./mobile-nav')

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
