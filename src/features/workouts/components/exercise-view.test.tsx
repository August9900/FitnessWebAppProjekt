import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import type { WorkoutStep } from '../workouts.rules'
import { ExerciseView } from './exercise-view'
import { SampleContentBadge } from './sample-content-badge'

const step: WorkoutStep = {
  position: 1,
  mode: 'reps',
  amount: 10,
  exercise: {
    id: 'squat',
    name: 'Kniebeuge',
    instructions: 'Stell dich hüftbreit hin. Beuge die Knie.',
    easierName: 'Kniebeuge am Stuhl',
    easierInstructions: 'Setz dich langsam auf einen Stuhl. Steh wieder auf.',
    equipment: [],
  },
}

function Harness({ onChange = () => {} }: { onChange?: (value: boolean) => void }) {
  const [easier, setEasier] = useState(false)
  return (
    <ExerciseView
      step={step}
      easier={easier}
      onEasierChange={(value) => {
        setEasier(value)
        onChange(value)
      }}
    />
  )
}

describe('ExerciseView (AC-6, AC-7)', () => {
  it('zeigt Name, Wiederholungen und Anleitung', () => {
    render(<Harness />)
    expect(screen.getByRole('heading', { name: 'Kniebeuge' })).toBeInTheDocument()
    expect(screen.getByText('10 Wiederholungen')).toBeInTheDocument()
    expect(screen.getByText('Stell dich hüftbreit hin. Beuge die Knie.')).toBeInTheDocument()
  })

  it('zeigt mit „Leichter“ die leichtere Variante und nimmt die Wahl wieder zurück', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const toggle = screen.getByRole('switch', { name: 'Leichter' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(toggle)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('heading', { name: 'Kniebeuge am Stuhl' })).toBeInTheDocument()
    expect(screen.getByText('Setz dich langsam auf einen Stuhl. Steh wieder auf.')).toBeInTheDocument()
    expect(screen.queryByText('Stell dich hüftbreit hin. Beuge die Knie.')).not.toBeInTheDocument()
    expect(screen.getByText('Leichtere Variante')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(onChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('heading', { name: 'Kniebeuge' })).toBeInTheDocument()
    expect(screen.queryByText('Leichtere Variante')).not.toBeInTheDocument()
  })

  it('zeigt Sekunden bei Übungen mit Dauer und lässt die Menge weg, wenn gewünscht', () => {
    const timed = { ...step, mode: 'time' as const, amount: 45 }
    const { rerender } = render(<ExerciseView step={timed} easier={false} onEasierChange={() => {}} />)
    expect(screen.getByText('45 Sekunden')).toBeInTheDocument()
    rerender(<ExerciseView step={timed} easier={false} onEasierChange={() => {}} showAmount={false} />)
    expect(screen.queryByText('45 Sekunden')).not.toBeInTheDocument()
  })
})

describe('SampleContentBadge (AC-12)', () => {
  it('markiert ungeprüfte Inhalte sichtbar', () => {
    render(<SampleContentBadge reviewStatus="unreviewed" />)
    expect(screen.getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
  })

  it('zeigt bei geprüften Inhalten nichts', () => {
    const { container } = render(<SampleContentBadge reviewStatus="reviewed" />)
    expect(container).toBeEmptyDOMElement()
  })
})
