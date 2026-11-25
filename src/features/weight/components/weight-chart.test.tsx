import { render, screen } from '@testing-library/react'
import { WeightChart } from './weight-chart'

const today = '2026-11-25'

describe('WeightChart (AC-7, AC-8)', () => {
  it('zeigt bei weniger als zwei Einträgen nur den Hinweis, keine Kurve', () => {
    render(<WeightChart entries={[{ date: '2026-11-25', weightKg: 72 }]} range="3m" today={today} />)
    expect(screen.getByText('Zu wenige Einträge für eine Kurve.')).toBeInTheDocument()
    expect(screen.queryByTestId('weight-chart')).toBeNull()
  })

  it('zeichnet eine Linie mit einem Punkt je Eintrag, beschriftet mit kleinstem/größtem Wert und erstem/letztem Tag', () => {
    render(
      <WeightChart
        entries={[
          { date: '2026-11-01', weightKg: 73.5 },
          { date: '2026-11-10', weightKg: 72.4 },
          { date: '2026-11-25', weightKg: 72.9 },
        ]}
        range="1m"
        today={today}
      />
    )
    const svg = screen.getByTestId('weight-chart')
    expect(svg.querySelectorAll('circle')).toHaveLength(3)
    expect(svg.querySelector('polyline')?.getAttribute('points')?.split(' ')).toHaveLength(3)
    const labels = Array.from(svg.querySelectorAll('text')).map((text) => text.textContent)
    expect(labels).toEqual(['73,5 kg', '72,4 kg', '01.11.2026', '25.11.2026'])
  })

  it('ist für Screenreader verborgen — die Liste ist die Textfassung (AC-9)', () => {
    render(
      <WeightChart
        entries={[
          { date: '2026-11-01', weightKg: 73 },
          { date: '2026-11-25', weightKg: 72 },
        ]}
        range="1m"
        today={today}
      />
    )
    expect(screen.getByTestId('weight-chart')).toHaveAttribute('aria-hidden', 'true')
  })

  it('hat keine wertenden Farben, Zielmarken oder Animationen', () => {
    const { container } = render(
      <WeightChart
        entries={[
          { date: '2026-11-01', weightKg: 73 },
          { date: '2026-11-25', weightKg: 72 },
        ]}
        range="1m"
        today={today}
      />
    )
    const html = container.innerHTML
    expect(html).not.toMatch(/destructive|green|red|success|warning|animate|<line /)
  })
})
