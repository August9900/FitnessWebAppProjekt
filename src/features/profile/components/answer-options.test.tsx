import { act, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MultiChoice, SingleChoice, type Option } from './answer-options'

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const COLOURS: Option<'rot' | 'blau'>[] = [
  { value: 'rot', label: 'Rot' },
  { value: 'blau', label: 'Blau' },
]
const THINGS: Option<'matte' | 'hantel' | 'none'>[] = [
  { value: 'matte', label: 'Matte' },
  { value: 'hantel', label: 'Kurzhanteln' },
  { value: 'none', label: 'Nichts davon' },
]

function SingleHarness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState<'rot' | 'blau' | null>(null)
  return (
    <SingleChoice
      legend="Farbe"
      options={COLOURS}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

function MultiHarness({ initial = [] as Array<'matte' | 'hantel' | 'none'> }) {
  const [values, setValues] = useState(initial)
  return (
    <>
      <MultiChoice legend="Ausstattung" options={THINGS} values={values} onChange={setValues} exclusiveValue="none" />
      <output data-testid="values">{values.join(',')}</output>
    </>
  )
}

describe('SingleChoice', () => {
  it('lässt genau eine Antwort wählen und meldet sie (AC-3, AC-4, AC-7)', () => {
    const onChange = vi.fn()
    render(<SingleHarness onChange={onChange} />)
    act(() => screen.getByRole('radio', { name: 'Blau' }).click())
    expect(onChange).toHaveBeenLastCalledWith('blau')
    expect(screen.getByRole('radio', { name: 'Blau' })).toBeChecked()
    act(() => screen.getByLabelText('Rot').click())
    expect(screen.getByRole('radio', { name: 'Rot' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Blau' })).not.toBeChecked()
  })

  it('zeigt einen Fehler direkt an der Gruppe (AC-8)', () => {
    render(<SingleChoice legend="Farbe" options={COLOURS} value={null} onChange={() => {}} error="Bitte wählen." />)
    const group = screen.getByRole('group', { name: 'Farbe' })
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte wählen.')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)
  })
})

describe('MultiChoice (AC-5, AC-6)', () => {
  it('lässt mehrere Antworten zu', () => {
    render(<MultiHarness />)
    act(() => screen.getByRole('checkbox', { name: 'Matte' }).click())
    act(() => screen.getByRole('checkbox', { name: 'Kurzhanteln' }).click())
    expect(screen.getByTestId('values').textContent).toBe('matte,hantel')
  })

  it('„Nichts davon“ wählt alles andere ab und umgekehrt', () => {
    render(<MultiHarness initial={['matte', 'hantel']} />)
    act(() => screen.getByRole('checkbox', { name: 'Nichts davon' }).click())
    expect(screen.getByTestId('values').textContent).toBe('none')
    act(() => screen.getByRole('checkbox', { name: 'Matte' }).click())
    expect(screen.getByTestId('values').textContent).toBe('matte')
  })

  it('nimmt eine Auswahl wieder heraus', () => {
    render(<MultiHarness initial={['matte']} />)
    act(() => screen.getByRole('checkbox', { name: 'Matte' }).click())
    expect(screen.getByTestId('values').textContent).toBe('')
  })
})
