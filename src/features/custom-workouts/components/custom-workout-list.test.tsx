import { render, screen, within } from '@testing-library/react'
import { CustomWorkoutList } from './custom-workout-list'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'

describe('CustomWorkoutList (AC-1, EC-7)', () => {
  it('zeigt die eigenen Workouts alphabetisch mit Anzahl der Übungen, auch mit gleichen Namen', () => {
    render(
      <CustomWorkoutList
        workouts={[
          { id: A, name: 'Zirkel', stepCount: 3 },
          { id: B, name: 'Abends locker', stepCount: 1 },
          { id: C, name: 'Zirkel', stepCount: 5 },
        ]}
      />
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Deine Workouts' })).toBeInTheDocument()
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Abends locker1 Übung', 'Zirkel3 Übungen', 'Zirkel5 Übungen'])
    expect(within(items[0]).getByRole('link', { name: 'Abends locker' })).toHaveAttribute('href', `/bewegung/eigene/${B}`)
  })

  it('zeigt ohne eigene Workouts den Hinweis und immer „Neues Workout“', () => {
    render(<CustomWorkoutList workouts={[]} />)
    expect(screen.getByText('Stell dir ein eigenes Workout aus den Übungen zusammen.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByRole('link', { name: 'Neues Workout' })).toHaveAttribute('href', '/bewegung/eigene/neu')
  })
})
