import { render, screen, within } from '@testing-library/react'
import type { Exercise } from '@/features/workouts/workouts.rules'
import { ExerciseDetail } from './exercise-detail'

const kniebeuge: Exercise = {
  id: 'kniebeuge',
  name: 'Kniebeuge',
  instructions: 'Stell dich hüftbreit hin und geh langsam in die Knie.',
  easierName: 'Kniebeuge am Stuhl',
  easierInstructions: 'Setz dich kurz auf einen Stuhl und steh wieder auf.',
  equipment: ['mat'],
}

const usedIn = [
  { id: 'beine_10', title: 'Beine wach', duration: '10 Min', href: '/bewegung/beine_10' },
  { id: 'ganzkoerper_15', title: 'Ganzkörper', duration: '15 Min', href: '/bewegung/ganzkoerper_15' },
]

describe('ExerciseDetail', () => {
  it('zeigt Name, Anleitung, leichtere Variante, Ausstattung und Sicherheitshinweis (AC-7)', () => {
    render(<ExerciseDetail exercise={kniebeuge} usedIn={usedIn} filter="alle" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kniebeuge' })).toBeInTheDocument()
    expect(screen.getByText('Stell dich hüftbreit hin und geh langsam in die Knie.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Leichter: Kniebeuge am Stuhl' })).toBeInTheDocument()
    expect(screen.getByText('Setz dich kurz auf einen Stuhl und steh wieder auf.')).toBeInTheDocument()
    expect(screen.getByText('Matte')).toBeInTheDocument()
    expect(screen.getByText('Hör auf deinen Körper. Bei Schmerzen hörst du auf.')).toBeInTheDocument()
  })

  it('nennt unter „Kommt vor in“ die Workouts mit Dauer und Link (AC-8)', () => {
    render(<ExerciseDetail exercise={kniebeuge} usedIn={usedIn} filter="alle" />)
    const section = screen.getByRole('heading', { name: 'Kommt vor in' }).closest('section')!
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByRole('link', { name: 'Beine wach' })).toHaveAttribute('href', '/bewegung/beine_10')
    expect(items[0]).toHaveTextContent('10 Min')
  })

  it('zeigt auch ein einzelnes Workout unter „Kommt vor in“ (AC-8)', () => {
    render(<ExerciseDetail exercise={kniebeuge} usedIn={usedIn.slice(0, 1)} filter="alle" />)
    expect(screen.getByRole('link', { name: 'Beine wach' })).toBeInTheDocument()
    expect(screen.queryByText('Gerade in keinem Workout.')).toBeNull()
  })

  it('sagt „Gerade in keinem Workout.“, wenn die Übung nirgends vorkommt (AC-8)', () => {
    render(<ExerciseDetail exercise={kniebeuge} usedIn={[]} filter="alle" />)
    expect(screen.getByText('Gerade in keinem Workout.')).toBeInTheDocument()
  })

  it('führt mit „Alle Übungen“ zur Liste mit dem vorigen Filter zurück (AC-9)', () => {
    const { unmount } = render(<ExerciseDetail exercise={kniebeuge} usedIn={[]} filter="zuhause" />)
    expect(screen.getByRole('link', { name: 'Alle Übungen' })).toHaveAttribute('href', '/bewegung/uebungen?filter=zuhause')
    unmount()
    render(<ExerciseDetail exercise={kniebeuge} usedIn={[]} filter="alle" />)
    expect(screen.getByRole('link', { name: 'Alle Übungen' })).toHaveAttribute('href', '/bewegung/uebungen')
  })

  it('bietet nichts zum Starten oder Beginnen an (AC-10)', () => {
    render(<ExerciseDetail exercise={kniebeuge} usedIn={usedIn} filter="alle" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText(/Los geht|Starten|Beginnen|Das mach ich/)).toBeNull()
  })
})
