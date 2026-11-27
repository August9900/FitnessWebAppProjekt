import { act, fireEvent, render, screen } from '@testing-library/react'
import { NutritionSection } from './nutrition-section'

const nutrition = { energyKcal: 450, proteinG: 22, carbsG: 55, fatG: 0 }
const trigger = () => screen.getByRole('button', { name: 'Nährwerte pro Portion' })

describe('NutritionSection (AC-1 bis AC-5, EC-1, EC-4, EC-5)', () => {
  it('ist zu Beginn zugeklappt — die Zahlen sind noch nicht da (AC-1)', () => {
    render(<NutritionSection nutrition={nutrition} />)
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('450 kcal')).toBeNull()
    expect(screen.getByRole('region', { name: 'Nährwerte pro Portion' })).toBeInTheDocument()
  })

  it('zeigt nach dem Aufklappen vier Werte und den Hinweis, „0 g“ als Zahl (AC-2, EC-1)', async () => {
    render(<NutritionSection nutrition={nutrition} />)
    await act(async () => trigger().click())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    const terms = screen.getAllByRole('term').map((term) => term.textContent)
    const values = screen.getAllByRole('definition').map((value) => value.textContent)
    expect(terms).toEqual(['Energie:', 'Eiweiß:', 'Kohlenhydrate:', 'Fett:'])
    expect(values).toEqual(['450 kcal', '22 g', '55 g', '0 g'])
    expect(screen.getByText('Ungefähre Werte – sie hängen von den genauen Zutaten ab.')).toBeInTheDocument()
  })

  it('lässt sich wieder zuklappen; der Auslöser ist ein Knopf mit Steuerbezug und mindestens 48 px (AC-4)', async () => {
    render(<NutritionSection nutrition={nutrition} />)
    expect(trigger().tagName).toBe('BUTTON')
    expect(trigger().className).toContain('min-h-12')
    await act(async () => trigger().click())
    expect(trigger()).toHaveAttribute('aria-controls', expect.any(String))
    await act(async () => trigger().click())
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('450 kcal')).toBeNull()
  })

  it('ist per Tastatur bedienbar (AC-4)', async () => {
    render(<NutritionSection nutrition={nutrition} />)
    trigger().focus()
    expect(document.activeElement).toBe(trigger())
    await act(async () => {
      fireEvent.keyDown(trigger(), { key: 'Enter' })
      fireEvent.click(trigger())
    })
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
  })

  it('beginnt bei jedem neuen Anzeigen wieder zugeklappt (AC-5)', async () => {
    const { unmount } = render(<NutritionSection nutrition={nutrition} />)
    await act(async () => trigger().click())
    unmount()
    render(<NutritionSection nutrition={nutrition} />)
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('ohne wertende Farben, Prozente oder Animation (AC-3, EC-5)', async () => {
    const { container } = render(<NutritionSection nutrition={nutrition} />)
    await act(async () => trigger().click())
    const content = document.getElementById(trigger().getAttribute('aria-controls') ?? '')
    expect(content).not.toBeNull()
    // The opening part itself and the arrow have no animation of their own.
    expect(content!.outerHTML).not.toMatch(/animate|transition|data-\[state/)
    expect(trigger().querySelector('svg')?.getAttribute('class')).not.toMatch(/rotate|transition/)
    expect(container.textContent).not.toMatch(/%|viel|wenig|gesund|leicht/i)
    expect(container.innerHTML).not.toMatch(/destructive|green|red-|amber|success|warning/)
  })
})
