import { render, screen, within } from '@testing-library/react'
import type { Exercise } from '@/features/workouts/workouts.rules'
import { ExerciseLibrary } from './exercise-library'

const exercise = (id: string, name: string, equipment: Exercise['equipment'] = []): Exercise => ({
  id,
  name,
  instructions: 'Mach es so.',
  easierName: 'Leichter',
  easierInstructions: 'Mach es leichter.',
  equipment,
})

const list = [exercise('arm_bein', 'Arm und Bein strecken', ['mat']), exercise('ausfallschritt', 'Ausfallschritt')]

describe('ExerciseLibrary', () => {
  it('zeigt die Übungen mit Name und Ausstattung unter „Übungen“ (AC-3)', () => {
    render(<ExerciseLibrary exercises={list} filter="alle" filters={['alle', 'ohne-ausstattung', 'zuhause']} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Übungen' })).toBeInTheDocument()
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Arm und Bein streckenMatte', 'AusfallschrittOhne Ausstattung'])
  })

  it('bietet die Filter als Links an und markiert den gewählten nicht nur mit Farbe (AC-4 bis AC-6)', () => {
    render(<ExerciseLibrary exercises={list} filter="ohne-ausstattung" filters={['alle', 'ohne-ausstattung', 'zuhause']} />)
    const filters = within(screen.getByRole('navigation', { name: 'Filter' }))
    expect(filters.getByRole('link', { name: 'Alle' })).toHaveAttribute('href', '/bewegung/uebungen')
    expect(filters.getByRole('link', { name: 'Passt zu meinem Zuhause' })).toHaveAttribute('href', '/bewegung/uebungen?filter=zuhause')
    const selected = filters.getByRole('link', { name: 'Ohne Ausstattung' })
    expect(selected).toHaveAttribute('aria-current', 'page')
    expect(selected.querySelector('svg')).not.toBeNull()
    expect(filters.getByRole('link', { name: 'Alle' })).not.toHaveAttribute('aria-current')
  })

  it('lässt „Passt zu meinem Zuhause“ weg, wenn er nicht angeboten wird (AC-5)', () => {
    render(<ExerciseLibrary exercises={list} filter="alle" filters={['alle', 'ohne-ausstattung']} />)
    expect(screen.queryByRole('link', { name: 'Passt zu meinem Zuhause' })).toBeNull()
  })

  it('nimmt den gewählten Filter in die Detail-Links mit (AC-6)', () => {
    render(<ExerciseLibrary exercises={list} filter="zuhause" filters={['alle', 'ohne-ausstattung', 'zuhause']} />)
    expect(screen.getByRole('link', { name: 'Ausfallschritt' })).toHaveAttribute('href', '/bewegung/uebungen/ausfallschritt?filter=zuhause')
  })

  it('zeigt bei leerem Filter einen Hinweis mit „Alle zeigen“ (EC-1)', () => {
    render(<ExerciseLibrary exercises={[]} filter="ohne-ausstattung" filters={['alle', 'ohne-ausstattung']} />)
    expect(screen.getByText('Keine Übung passt zu diesem Filter.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alle zeigen' })).toHaveAttribute('href', '/bewegung/uebungen')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('lässt lange Namen und Ausstattung umbrechen (EC-6)', () => {
    render(<ExerciseLibrary exercises={list} filter="alle" filters={['alle']} />)
    expect(screen.getByRole('link', { name: 'Arm und Bein strecken' }).className).toContain('[overflow-wrap:anywhere]')
    expect(screen.getByText('Matte').className).toContain('[overflow-wrap:anywhere]')
  })
})
