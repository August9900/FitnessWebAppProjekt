import { fireEvent, render, screen, within } from '@testing-library/react'
import { WorkoutList, type WorkoutListItem } from './workout-list'

const fitting5: WorkoutListItem = {
  id: 'morgen_mobil_5',
  title: 'Morgens mobil',
  durationMinutes: 5,
  intensity: 'gentle',
  places: ['home', 'outdoors'],
  reviewStatus: 'unreviewed',
  equipment: [],
  fit: { fits: true },
}

const fitting10: WorkoutListItem = {
  id: 'band_10',
  title: 'Band und Matte',
  durationMinutes: 10,
  intensity: 'moderate',
  places: ['home'],
  reviewStatus: 'reviewed',
  equipment: ['mat', 'resistance_band'],
  fit: { fits: true },
}

const notFitting15: WorkoutListItem = {
  id: 'hanteln_15',
  title: 'Hanteln kräftig',
  durationMinutes: 15,
  intensity: 'vigorous',
  places: ['gym'],
  reviewStatus: 'unreviewed',
  equipment: ['dumbbells'],
  fit: { fits: false, reason: 'nur im Fitnessstudio' },
}

const titles = () => screen.queryAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)

describe('WorkoutList', () => {
  it('zeigt passende Workouts mit Titel, Dauer, Intensität, Orten und Ausstattung (AC-1)', () => {
    render(<WorkoutList items={[fitting5, fitting10, notFitting15]} />)
    expect(titles()).toEqual(['Morgens mobil', 'Band und Matte'])

    const card = screen.getByRole('link', { name: 'Band und Matte' }).closest('li')!
    expect(card).toHaveTextContent('10 Min')
    expect(card).toHaveTextContent('mittel')
    expect(card).toHaveTextContent('Zuhause')
    expect(card).toHaveTextContent('Matte, Widerstandsband')
    expect(screen.getByRole('link', { name: 'Band und Matte' })).toHaveAttribute('href', '/bewegung/band_10')

    const first = screen.getByRole('link', { name: 'Morgens mobil' }).closest('li')!
    expect(first).toHaveTextContent('sanft')
    expect(first).toHaveTextContent('Zuhause, Draußen')
    expect(first).toHaveTextContent('Ohne Ausstattung')
  })

  it('markiert ungeprüfte Workouts als Beispielinhalt, geprüfte nicht (AC-12)', () => {
    render(<WorkoutList items={[fitting5, fitting10]} />)
    const unreviewed = screen.getByRole('link', { name: 'Morgens mobil' }).closest('li')!
    const reviewed = screen.getByRole('link', { name: 'Band und Matte' }).closest('li')!
    expect(within(unreviewed).getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
    expect(within(reviewed).queryByText('Beispielinhalt – noch nicht fachlich geprüft')).not.toBeInTheDocument()
  })

  it('filtert sofort nach Dauer und zurück auf „Alle“ (AC-3)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<WorkoutList items={[fitting5, fitting10, notFitting15]} />)

    fireEvent.click(screen.getByRole('button', { name: '10 Min' }))
    expect(titles()).toEqual(['Band und Matte'])
    expect(screen.getByRole('button', { name: '10 Min' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: '5 Min' }))
    expect(titles()).toEqual(['Morgens mobil'])

    fireEvent.click(screen.getByRole('button', { name: 'Alle' }))
    expect(titles()).toEqual(['Morgens mobil', 'Band und Matte'])
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('zeigt mit „Alle Workouts anzeigen“ auch nicht passende, jeweils mit Grund (AC-4)', () => {
    render(<WorkoutList items={[fitting5, fitting10, notFitting15]} />)
    expect(screen.queryByText(/nur im Fitnessstudio/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: 'Alle Workouts anzeigen' }))
    expect(titles()).toEqual(['Morgens mobil', 'Band und Matte', 'Hanteln kräftig'])
    const card = screen.getByRole('link', { name: 'Hanteln kräftig' }).closest('li')!
    expect(card).toHaveTextContent('Passt gerade nicht: nur im Fitnessstudio')
    // Fitting workouts carry no reason.
    expect(screen.getByRole('link', { name: 'Morgens mobil' }).closest('li')).not.toHaveTextContent('Passt gerade nicht')
  })

  it('bietet „Alle Workouts anzeigen“ an, wenn nichts passt (AC-5)', () => {
    render(<WorkoutList items={[notFitting15]} />)
    expect(titles()).toEqual([])
    expect(screen.getByText('Zu deinen Angaben passt gerade kein Workout.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Alle Workouts anzeigen' }))
    expect(titles()).toEqual(['Hanteln kräftig'])
    expect(screen.getByRole('switch', { name: 'Alle Workouts anzeigen' })).toHaveAttribute('aria-checked', 'true')
  })

  it('bietet „Alle Dauern anzeigen“ an, wenn für die Dauer nichts passt (AC-5)', () => {
    render(<WorkoutList items={[fitting5, fitting10, notFitting15]} />)
    fireEvent.click(screen.getByRole('button', { name: '15 Min' }))
    expect(titles()).toEqual([])
    expect(screen.getByText('Für diese Dauer gibt es gerade kein Workout.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Alle Dauern anzeigen' }))
    expect(titles()).toEqual(['Morgens mobil', 'Band und Matte'])
  })

  it('zeigt ohne angebotene Workouts einen ruhigen Hinweis mit Weg zu „Heute“ (AC-5)', () => {
    render(<WorkoutList items={[]} />)
    expect(screen.getByText('Gerade gibt es hier noch keine Workouts.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zu Heute' })).toHaveAttribute('href', '/heute')
  })

  it('meldet die Anzahl der sichtbaren Workouts für Screenreader', () => {
    render(<WorkoutList items={[fitting5, fitting10]} />)
    expect(screen.getByText('2 Workouts')).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(screen.getByRole('button', { name: '5 Min' }))
    expect(screen.getByText('1 Workout')).toBeInTheDocument()
  })
})
