import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/heute' }))

const { AppShell, MAIN_CONTENT_ID } = await import('./app-shell')

beforeAll(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
})

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

describe('AppShell', () => {
  it('beginnt mit „Zum Inhalt springen“, das auf den Inhalt zeigt (AC-8)', () => {
    render(
      <AppShell>
        <p>Seiteninhalt</p>
      </AppShell>
    )
    const first = document.querySelector<HTMLElement>(FOCUSABLE)
    expect(first?.textContent).toBe('Zum Inhalt springen')
    expect(first?.getAttribute('href')).toBe(`#${MAIN_CONTENT_ID}`)
    const main = screen.getByRole('main')
    expect(main.id).toBe(MAIN_CONTENT_ID)
    expect(main).toHaveTextContent('Seiteninhalt')
  })

  it('enthält Seitenleiste und untere Navigation mit dem aktuellen Bereich (AC-1, AC-2)', () => {
    render(
      <AppShell>
        <p>Seiteninhalt</p>
      </AppShell>
    )
    const navigations = screen.getAllByRole('navigation', { name: 'Hauptnavigation' })
    expect(navigations).toHaveLength(2)
    for (const nav of navigations) {
      expect(nav.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe('/heute')
    }
  })

  it('hält unten Platz für die Navigation frei, damit nichts verdeckt wird (EC-6)', () => {
    render(
      <AppShell>
        <p>Seiteninhalt</p>
      </AppShell>
    )
    const main = screen.getByRole('main')
    expect(main.className).toContain('pb-[var(--mobile-nav-space)]')
    expect(main.style.getPropertyValue('--mobile-nav-space')).toContain('safe-area-inset-bottom')
  })
})
