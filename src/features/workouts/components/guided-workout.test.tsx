import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Exercise, Workout } from '../workouts.rules'
import { GuidedWorkout } from './guided-workout'

function exercise(id: string, name: string): Exercise {
  return {
    id,
    name,
    instructions: `${name}: so geht es.`,
    easierName: `${name} leichter`,
    easierInstructions: `${name}: so geht es leichter.`,
    equipment: [],
  }
}

const workout: Workout = {
  id: 'morgen_mobil_5',
  title: 'Morgen mobil',
  description: 'Ein kurzes, sanftes Workout für den Start in den Tag.',
  durationMinutes: 5,
  intensity: 'gentle',
  places: ['home'],
  reviewStatus: 'unreviewed',
  steps: [
    { position: 1, mode: 'time', amount: 30, exercise: exercise('march', 'Marschieren') },
    { position: 2, mode: 'reps', amount: 10, exercise: exercise('squat', 'Kniebeuge') },
    { position: 3, mode: 'time', amount: 20, exercise: exercise('stretch', 'Dehnen') },
  ],
}

function liveRegion() {
  const region = document.querySelector('[aria-live="polite"]')
  if (!region) throw new Error('no live region')
  return region
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: /^(Weiter|Fertig)$/ }))
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-13T08:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GuidedWorkout — eine Übung pro Bildschirm (AC-8, AC-12)', () => {
  it('zeigt genau eine Übung mit „Übung X von Y“, Anleitung, Timer, Zurück und Weiter', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    expect(screen.getByText('Übung 1 von 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Marschieren' })).toBeInTheDocument()
    expect(screen.getByText('Marschieren: so geht es.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Kniebeuge' })).not.toBeInTheDocument()
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeEnabled()
    expect(screen.getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
  })

  it('zeigt bei Wiederholungen die Anzahl statt eines Timers', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    next()
    expect(screen.getByText('Übung 2 von 3')).toBeInTheDocument()
    expect(screen.getByText('10 Wiederholungen')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
  })

  it('„Zurück“ führt zur vorigen Übung, deren Timer wieder auf voller Länge steht', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    wait(5000)
    expect(screen.getByText('0:25')).toBeInTheDocument()
    next()
    wait(500)
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(screen.getByText('Übung 1 von 3')).toBeInTheDocument()
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })
})

describe('GuidedWorkout — Timer (AC-9, EC-4, EC-6)', () => {
  it('zählt herunter, pausiert, zählt weiter und endet ruhig ohne automatischen Wechsel', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    wait(3000)
    expect(screen.getByText('0:27')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    wait(10_000)
    expect(screen.getByText('0:27')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Weiter zählen' }))
    wait(27_000)
    expect(screen.getByText('0:00')).toBeInTheDocument()
    expect(screen.getByText('Geschafft – weiter, wenn du bereit bist.')).toBeInTheDocument()

    wait(60_000)
    expect(screen.getByText('Übung 1 von 3')).toBeInTheDocument()
  })

  it('zeigt nach Hintergrund oder ausgeschaltetem Bildschirm sofort die tatsächliche Restzeit bzw. das Ende', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    // The clock moves on while the browser runs no timers at all (throttled background tab).
    act(() => {
      vi.setSystemTime(Date.now() + 20_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByText('0:10')).toBeInTheDocument()

    act(() => {
      vi.setSystemTime(Date.now() + 60_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByText('0:00')).toBeInTheDocument()
    expect(screen.getByText('Geschafft – weiter, wenn du bereit bist.')).toBeInTheDocument()
  })

  it('zeigt die Zeit nur als Zahl, ohne Fortschrittsbalken oder -kreise', () => {
    const { container } = render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    wait(1000)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(container.querySelector('progress, svg, circle, [class*="animate"]')).toBeNull()
  })
})

describe('GuidedWorkout — Ansagen für Screenreader', () => {
  it('meldet den Übungswechsel, Start und Ende des Timers — nicht jede Sekunde', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    expect(screen.getByText('0:30').closest('[aria-live]')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(liveRegion()).toHaveTextContent('Timer gestartet')
    wait(5000)
    expect(liveRegion()).toHaveTextContent('Timer gestartet')

    wait(25_000)
    expect(liveRegion()).toHaveTextContent('Zeit abgelaufen')

    next()
    expect(liveRegion()).toHaveTextContent('Übung 2 von 3: Kniebeuge')
  })
})

describe('GuidedWorkout — Mehrfachtippen (EC-5)', () => {
  it('rückt bei schnellen Doppeltipps nur eine Übung vor, danach wieder normal', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    next()
    next()
    expect(screen.getByText('Übung 2 von 3')).toBeInTheDocument()

    wait(399)
    next()
    expect(screen.getByText('Übung 2 von 3')).toBeInTheDocument()

    wait(1)
    next()
    expect(screen.getByText('Übung 3 von 3')).toBeInTheDocument()
  })
})

describe('GuidedWorkout — Leichter (AC-7)', () => {
  it('übernimmt die Auswahl aus der Detailansicht und lässt sie je Übung ändern', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[2]} />)
    expect(screen.getByRole('heading', { name: 'Marschieren' })).toBeInTheDocument()

    next()
    expect(screen.getByRole('heading', { name: 'Kniebeuge leichter' })).toBeInTheDocument()
    expect(screen.getByText('Kniebeuge: so geht es leichter.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: 'Leichter' }))
    expect(screen.getByRole('heading', { name: 'Kniebeuge' })).toBeInTheDocument()
  })
})

describe('GuidedWorkout — Beenden und Abschluss (AC-10, AC-11)', () => {
  it('„Beenden“ führt ohne Rückfrage zur Detailansicht', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    expect(screen.getByRole('link', { name: 'Beenden' })).toHaveAttribute('href', '/bewegung/morgen_mobil_5')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('zeigt nach der letzten Übung einen neutralen Abschluss mit Weg zu „Bewegung“', () => {
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    next()
    wait(400)
    next()
    wait(400)
    expect(screen.getByRole('button', { name: 'Fertig' })).toBeInTheDocument()
    next()

    expect(screen.getByRole('heading', { name: 'Geschafft. Gut gemacht.' })).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Zu Bewegung' })).toHaveAttribute('href', '/bewegung')
    expect(screen.queryByText(/Übung \d von/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fertig' })).not.toBeInTheDocument()
  })

  it('speichert nichts: kein Netzwerk, kein Gerätespeicher', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(<GuidedWorkout workout={workout} initialEasier={[]} />)
    for (let i = 0; i < 3; i++) {
      next()
      wait(400)
    }
    expect(screen.getByText('Geschafft. Gut gemacht.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    storageSpy.mockRestore()
  })
})
