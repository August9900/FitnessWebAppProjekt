import { render, screen } from '@testing-library/react'
import { SampleContentBadge } from './sample-content-badge'

describe('SampleContentBadge (PROJ-4 AC-12, PROJ-5 AC-8)', () => {
  it('markiert ungeprüfte Inhalte sichtbar', () => {
    render(<SampleContentBadge reviewStatus="unreviewed" />)
    expect(screen.getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
  })

  it('zeigt bei geprüften Inhalten nichts', () => {
    const { container } = render(<SampleContentBadge reviewStatus="reviewed" />)
    expect(container).toBeEmptyDOMElement()
  })
})
