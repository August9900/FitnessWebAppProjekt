import { act, render, screen } from '@testing-library/react'

const setWeightVisibility = vi.fn()
vi.mock('../weight.actions', () => ({ setWeightVisibility }))

const { WeightVisibilitySwitch } = await import('./weight-visibility-switch')

beforeEach(() => {
  vi.clearAllMocks()
  setWeightVisibility.mockResolvedValue({ ok: true })
})

const toggle = () => screen.getByRole('switch', { name: 'Gewicht in der Navigation zeigen' })

describe('WeightVisibilitySwitch (AC-14)', () => {
  it('zeigt den gespeicherten Zustand und erklärt, dass Einträge erhalten bleiben', () => {
    render(<WeightVisibilitySwitch initial />)
    expect(toggle()).toBeChecked()
    expect(toggle()).toHaveAccessibleDescription(/Einträge gespeichert/)
  })

  it('blendet aus und speichert sofort', async () => {
    render(<WeightVisibilitySwitch initial />)
    await act(async () => toggle().click())
    expect(setWeightVisibility).toHaveBeenCalledWith({ show: false })
    expect(toggle()).not.toBeChecked()
  })

  it('blendet wieder ein', async () => {
    render(<WeightVisibilitySwitch initial={false} />)
    await act(async () => toggle().click())
    expect(setWeightVisibility).toHaveBeenCalledWith({ show: true })
    expect(toggle()).toBeChecked()
  })

  it('stellt bei einem Fehler zurück und meldet ihn', async () => {
    setWeightVisibility.mockResolvedValue({ ok: false, reason: 'failed' })
    render(<WeightVisibilitySwitch initial />)
    await act(async () => toggle().click())
    expect(toggle()).toBeChecked()
    expect(screen.getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt.')
  })
})
