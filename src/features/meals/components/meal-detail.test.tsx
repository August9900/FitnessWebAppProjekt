import { render, screen, within } from '@testing-library/react'
import type { Meal } from '../meals.rules'
import { MealDetail } from './meal-detail'

const meal: Meal = {
  id: 'couscous_erbsen',
  title: 'Couscous mit Erbsen',
  diet: 'vegan',
  effort: 'quick',
  minutes: 10,
  ingredients: ['60 g Couscous', '1 Handvoll TK-Erbsen', '1 TL Gemüsebrühe (Pulver)'],
  steps: ['Mach Wasser heiß.', 'Gib alles in eine Schüssel.', 'Warte 5 Minuten.'],
  easierHint: 'Lass die Erbsen weg und iss den Couscous nur mit Brühe.',
  allergens: ['celery', 'gluten'],
  reviewStatus: 'unreviewed',
}

const section = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('section')!

describe('MealDetail', () => {
  it('zeigt Titel und Eckdaten (AC-5)', () => {
    render(<MealDetail meal={meal} fits />)
    expect(screen.getByRole('heading', { level: 1, name: 'Couscous mit Erbsen' })).toBeInTheDocument()
    const facts = screen.getByText('Aufwand').closest('dl')!
    expect(facts).toHaveTextContent('Schnell gekocht')
    expect(facts).toHaveTextContent('10 Min')
    expect(facts).toHaveTextContent('vegan')
  })

  it('zeigt Zutaten für eine Person und nummerierte Schritte in Reihenfolge (AC-5)', () => {
    render(<MealDetail meal={meal} fits />)
    const ingredients = within(section('Zutaten')).getAllByRole('listitem').map((item) => item.textContent)
    expect(ingredients).toEqual(['60 g Couscous', '1 Handvoll TK-Erbsen', '1 TL Gemüsebrühe (Pulver)'])
    expect(section('Zutaten')).toHaveTextContent('Für eine Person')

    const steps = within(section('Zubereitung')).getByRole('list')
    expect(steps.tagName).toBe('OL')
    expect(within(steps).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Mach Wasser heiß.',
      'Gib alles in eine Schüssel.',
      'Warte 5 Minuten.',
    ])
  })

  it('zeigt den Hinweis „Noch einfacher“ (AC-6)', () => {
    render(<MealDetail meal={meal} fits />)
    expect(screen.getByText('Noch einfacher:').parentElement).toHaveTextContent(
      'Noch einfacher: Lass die Erbsen weg und iss den Couscous nur mit Brühe.'
    )
  })

  it('nennt enthaltene Allergene mit Verpackungshinweis (AC-7)', () => {
    render(<MealDetail meal={meal} fits />)
    expect(section('Allergene')).toHaveTextContent('Enthält: Gluten, Sellerie')
    expect(section('Allergene')).toHaveTextContent('Bei Allergien prüfe bitte auch die Angaben auf der Verpackung deiner Zutaten.')
  })

  it('sagt ausdrücklich, wenn keines der 14 Hauptallergene enthalten ist (EC-4)', () => {
    render(<MealDetail meal={{ ...meal, allergens: [] }} fits />)
    expect(section('Allergene')).toHaveTextContent('Enthält keines der 14 Hauptallergene.')
    expect(section('Allergene')).toHaveTextContent('Bei Allergien prüfe bitte auch die Angaben auf der Verpackung deiner Zutaten.')
  })

  it('markiert ungeprüfte Mahlzeiten als Beispielinhalt, geprüfte nicht (AC-8)', () => {
    const { rerender } = render(<MealDetail meal={meal} fits />)
    expect(screen.getByText('Beispielinhalt – noch nicht fachlich geprüft')).toBeInTheDocument()
    rerender(<MealDetail meal={{ ...meal, reviewStatus: 'reviewed' }} fits />)
    expect(screen.queryByText('Beispielinhalt – noch nicht fachlich geprüft')).not.toBeInTheDocument()
  })

  it('zeigt eine nicht passende Mahlzeit vollständig mit kurzem Hinweis (EC-3)', () => {
    const { rerender } = render(<MealDetail meal={meal} fits />)
    expect(screen.queryByText('Passt nicht zu deiner Essensweise')).not.toBeInTheDocument()
    rerender(<MealDetail meal={meal} fits={false} />)
    expect(screen.getByText('Passt nicht zu deiner Essensweise')).toBeInTheDocument()
    expect(section('Zutaten')).toBeInTheDocument()
    expect(section('Zubereitung')).toBeInTheDocument()
  })
})
