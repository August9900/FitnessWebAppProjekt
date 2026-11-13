import { fireEvent, render, screen, within } from '@testing-library/react'
import { MealList, type MealListItem } from './meal-list'

const oats: MealListItem = {
  id: 'haferflocken_obst',
  title: 'Haferflocken mit Obst',
  diet: 'vegan',
  effort: 'no_cook',
  minutes: 5,
  reviewStatus: 'unreviewed',
}

const toast: MealListItem = {
  id: 'kaesetoast',
  title: 'Käsetoast aus der Pfanne',
  diet: 'vegetarian',
  effort: 'quick',
  minutes: 8,
  reviewStatus: 'reviewed',
}

const salmon: MealListItem = {
  id: 'lachs_reis',
  title: 'Lachs mit Reis',
  diet: 'meat_fish',
  effort: 'quick',
  minutes: 10,
  reviewStatus: 'unreviewed',
}

const titles = () => screen.queryAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
const card = (name: string) => screen.getByRole('link', { name }).closest('li')!

describe('MealList', () => {
  it('zeigt Mahlzeiten mit Titel, Aufwandsstufe, Minuten und Essensweise (AC-1)', () => {
    render(<MealList items={[oats, toast, salmon]} />)
    expect(titles()).toEqual(['Haferflocken mit Obst', 'Käsetoast aus der Pfanne', 'Lachs mit Reis'])

    expect(card('Haferflocken mit Obst')).toHaveTextContent('Ohne Kochen')
    expect(card('Haferflocken mit Obst')).toHaveTextContent('5 Min')
    expect(card('Haferflocken mit Obst')).toHaveTextContent('vegan')
    expect(card('Käsetoast aus der Pfanne')).toHaveTextContent('Schnell gekocht')
    expect(card('Käsetoast aus der Pfanne')).toHaveTextContent('vegetarisch')
    expect(card('Lachs mit Reis')).toHaveTextContent('mit Fleisch oder Fisch')
    expect(screen.getByRole('link', { name: 'Lachs mit Reis' })).toHaveAttribute('href', '/essen/lachs_reis')
  })

  it('markiert ungeprüfte Mahlzeiten als Beispielinhalt, geprüfte nicht (AC-8)', () => {
    render(<MealList items={[oats, toast]} />)
    expect(within(card('Haferflocken mit Obst')).getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
    expect(within(card('Käsetoast aus der Pfanne')).queryByText('Beispielinhalt – noch nicht fachlich geprüft')).not.toBeInTheDocument()
  })

  it('filtert sofort nach genau einer Aufwandsstufe und zurück auf „Alle“ (AC-3)', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<MealList items={[oats, toast, salmon]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Schnell gekocht' }))
    expect(titles()).toEqual(['Käsetoast aus der Pfanne', 'Lachs mit Reis'])
    expect(screen.getByRole('button', { name: 'Schnell gekocht' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Ohne Kochen' }))
    expect(titles()).toEqual(['Haferflocken mit Obst'])

    fireEvent.click(screen.getByRole('button', { name: 'Alle' }))
    expect(titles()).toEqual(['Haferflocken mit Obst', 'Käsetoast aus der Pfanne', 'Lachs mit Reis'])
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('bietet „Alle Aufwandsstufen anzeigen“ an, wenn für den Filter nichts passt (AC-4)', () => {
    render(<MealList items={[oats, toast]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bis 20 Min' }))
    expect(titles()).toEqual([])
    expect(screen.getByText('Für diesen Aufwand gibt es gerade keine Mahlzeit.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Alle Aufwandsstufen anzeigen' }))
    expect(titles()).toEqual(['Haferflocken mit Obst', 'Käsetoast aus der Pfanne'])
  })

  it('zeigt ohne passende Mahlzeit einen ruhigen Hinweis mit Weg zu „Heute“ (AC-4)', () => {
    render(<MealList items={[]} />)
    expect(screen.getByText('Zu deiner Essensweise gibt es gerade keine Mahlzeit.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zu Heute' })).toHaveAttribute('href', '/heute')
    expect(screen.queryByRole('group', { name: 'Aufwand' })).not.toBeInTheDocument()
  })

  it('meldet die Anzahl der sichtbaren Mahlzeiten für Screenreader', () => {
    render(<MealList items={[oats, toast]} />)
    expect(screen.getByText('2 Mahlzeiten')).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(screen.getByRole('button', { name: 'Ohne Kochen' }))
    expect(screen.getByText('1 Mahlzeit')).toBeInTheDocument()
  })
})
