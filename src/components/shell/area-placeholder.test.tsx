import { render, screen } from '@testing-library/react'
import { AreaPlaceholder, PLACEHOLDER_TEXTS } from './area-placeholder'

describe.each(['bewegung', 'essen', 'wochenblick'] as const)('AreaPlaceholder %s (AC-5)', (area) => {
  it('zeigt Titel, was hier entsteht, und einen Weg zu „Heute“', () => {
    render(<AreaPlaceholder area={area} />)
    const expectedTitle = { bewegung: 'Bewegung', essen: 'Essen', wochenblick: 'Wochenblick' }[area]
    expect(screen.getByRole('heading', { level: 1, name: expectedTitle })).toBeInTheDocument()
    expect(screen.getByText(PLACEHOLDER_TEXTS[area])).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zu Heute' })).toHaveAttribute('href', '/heute')
  })

  it('wirkt nicht wie ein Fehler', () => {
    render(<AreaPlaceholder area={area} />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(document.body.textContent).not.toMatch(/Fehler|nicht gefunden/i)
  })
})
