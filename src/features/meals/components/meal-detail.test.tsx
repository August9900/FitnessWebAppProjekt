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

describe('MealDetail — Nährwerte (PROJ-12 AC-1, AC-6, AC-9)', () => {
  const nutrition = { energyKcal: 355, proteinG: 10, carbsG: 50, fatG: 11 }

  it('zeigt am Ende den zugeklappten Abschnitt, wenn die Mahlzeit Nährwerte hat', () => {
    const { container } = render(<MealDetail meal={{ ...meal, nutrition }} fits />)
    const trigger = screen.getByRole('button', { name: 'Nährwerte pro Portion' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('355 kcal')).toBeNull()
    const headings = Array.from(container.querySelectorAll('h2')).map((heading) => heading.textContent)
    expect(headings[headings.length - 1]).toBe('Nährwerte pro Portion')
  })

  it('ohne Nährwerte gibt es keinen Abschnitt und keinen Hinweis darauf', () => {
    render(<MealDetail meal={{ ...meal, nutrition: null }} fits />)
    expect(screen.queryByText('Nährwerte pro Portion')).toBeNull()
    expect(screen.queryByText(/Nährwert/)).toBeNull()
    render(<MealDetail meal={meal} fits />)
    expect(screen.queryByText(/Nährwert/)).toBeNull()
  })

  it('die Beispielinhalt-Markierung der Mahlzeit bleibt, die Nährwerte bekommen keine eigene (AC-9)', () => {
    render(<MealDetail meal={{ ...meal, nutrition }} fits />)
    expect(screen.getAllByText(/Beispielinhalt/)).toHaveLength(1)
  })
})
