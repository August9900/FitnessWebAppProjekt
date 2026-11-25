import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Workout } from '../workouts.rules'
import { WorkoutDetail } from './workout-detail'

const workout: Workout = {
  id: 'band_10',
  title: 'Band und Matte',
  description: 'Ruhige Kräftigung für Rücken und Beine.',
  durationMinutes: 10,
  intensity: 'moderate',
  places: ['home', 'outdoors'],
  reviewStatus: 'unreviewed',
  steps: [
    {
      position: 1,
      mode: 'time',
      amount: 45,
      exercise: {
        id: 'band_row',
        name: 'Rudern mit Band',
        instructions: 'Zieh das Band zu dir. Lass langsam los.',
        easierName: 'Rudern ohne Band',
        easierInstructions: 'Zieh die Arme ohne Band zurück.',
        equipment: ['resistance_band'],
      },
    },
    {
      position: 2,
      mode: 'reps',
      amount: 12,
      exercise: {
        id: 'bridge',
        name: 'Brücke',
        instructions: 'Leg dich auf den Rücken. Heb das Becken.',
        easierName: 'Kleine Brücke',
        easierInstructions: 'Heb das Becken nur ein wenig.',
        equipment: ['mat'],
      },
    },
  ],
}

const startLink = () => screen.getByRole('link', { name: "Los geht's" })

describe('WorkoutDetail', () => {
  it('zeigt Beschreibung, Eckdaten, Sicherheitshinweis und „Los geht’s“ (AC-6)', () => {
    render(<WorkoutDetail workout={workout} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Band und Matte' })).toBeInTheDocument()
    expect(screen.getByText('Ruhige Kräftigung für Rücken und Beine.')).toBeInTheDocument()

    const facts = screen.getByText('Dauer').closest('dl')!
    expect(facts).toHaveTextContent('10 Min')
    expect(facts).toHaveTextContent('mittel')
    expect(facts).toHaveTextContent('Zuhause, Draußen')
    expect(facts).toHaveTextContent('Matte, Widerstandsband')

    expect(screen.getByText('Hör auf deinen Körper. Bei Schmerzen hörst du auf.')).toBeInTheDocument()
    expect(startLink()).toHaveAttribute('href', '/bewegung/band_10/los')
  })

  it('zeigt die Übungsfolge mit Name, Sekunden oder Wiederholungen und Anleitung (AC-6)', () => {
    render(<WorkoutDetail workout={workout} />)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(2)

    expect(within(items[0]).getByRole('heading', { name: 'Rudern mit Band' })).toBeInTheDocument()
    expect(items[0]).toHaveTextContent('45 Sekunden')
    expect(items[0]).toHaveTextContent('Zieh das Band zu dir. Lass langsam los.')

    expect(within(items[1]).getByRole('heading', { name: 'Brücke' })).toBeInTheDocument()
    expect(items[1]).toHaveTextContent('12 Wiederholungen')
    expect(items[1]).toHaveTextContent('Leg dich auf den Rücken. Heb das Becken.')
  })

  it('macht eine Übung leichter, nimmt es zurück und gibt die Wahl an die geführte Ansicht weiter (AC-7)', () => {
    render(<WorkoutDetail workout={workout} />)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')

    fireEvent.click(within(items[1]).getByRole('switch', { name: 'Leichter' }))
    expect(within(items[1]).getByRole('heading', { name: 'Kleine Brücke' })).toBeInTheDocument()
    expect(within(items[0]).getByRole('heading', { name: 'Rudern mit Band' })).toBeInTheDocument()
    expect(startLink()).toHaveAttribute('href', '/bewegung/band_10/los?leichter=2')

    fireEvent.click(within(items[0]).getByRole('switch', { name: 'Leichter' }))
    expect(startLink()).toHaveAttribute('href', '/bewegung/band_10/los?leichter=1,2')

    fireEvent.click(within(items[1]).getByRole('switch', { name: 'Leichter' }))
    expect(within(items[1]).getByRole('heading', { name: 'Brücke' })).toBeInTheDocument()
    expect(startLink()).toHaveAttribute('href', '/bewegung/band_10/los?leichter=1')
  })

  it('markiert ungeprüfte Workouts als Beispielinhalt, geprüfte nicht (AC-12)', () => {
    const { rerender } = render(<WorkoutDetail workout={workout} />)
    expect(screen.getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
    rerender(<WorkoutDetail workout={{ ...workout, reviewStatus: 'reviewed' }} />)
    expect(screen.queryByText('Beispielinhalt – noch nicht fachlich geprüft')).not.toBeInTheDocument()
  })

  it('zeigt „Ohne Ausstattung“, wenn keine Übung etwas braucht (AC-6)', () => {
    const bodyweight: Workout = {
      ...workout,
      steps: workout.steps.map((step) => ({ ...step, exercise: { ...step.exercise, equipment: [] } })),
    }
    render(<WorkoutDetail workout={bodyweight} />)
    expect(screen.getByText('Dauer').closest('dl')).toHaveTextContent('Ohne Ausstattung')
  })
})

describe('WorkoutDetail — Übungen nachschlagen (PROJ-9 AC-2)', () => {
  it('verlinkt jeden Übungsnamen auf die Übung in der Bibliothek', () => {
    render(<WorkoutDetail workout={workout} />)
    expect(screen.getByRole('link', { name: 'Rudern mit Band' })).toHaveAttribute('href', '/bewegung/uebungen/band_row')
  })

  it('verlinkt Pausen nicht, andere Übungen weiterhin (PROJ-9 AC-11)', () => {
    const pause = {
      position: 3,
      mode: 'time' as const,
      amount: 30,
      exercise: {
        id: 'kurze_pause',
        name: 'Kurze Pause',
        instructions: 'Atme ruhig durch und lockere die Schultern.',
        easierName: 'Sitzende Pause',
        easierInstructions: 'Setz dich und atme ruhig.',
        equipment: [],
        isPause: true,
      },
    }
    render(<WorkoutDetail workout={{ ...workout, steps: [...workout.steps, pause] }} />)
    expect(screen.getByText('Kurze Pause')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Kurze Pause' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Brücke' })).toHaveAttribute('href', '/bewegung/uebungen/bridge')
  })
})
