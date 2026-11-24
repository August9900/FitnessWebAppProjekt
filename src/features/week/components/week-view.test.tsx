import { render, screen, within } from '@testing-library/react'
import { buildWeek, resolveWeek, type WeekActionInput } from '../week.rules'
import { WeekView } from './week-view'

const BERLIN = 'Europe/Berlin'
const now = new Date('2026-11-24T10:00:00Z') // Tuesday; week Mon 23 – Sun 29 Nov
const created = new Date('2026-10-01T08:00:00Z')

const action = (overrides: Partial<WeekActionInput>): WeekActionInput => ({
  id: crypto.randomUUID(),
  kind: 'move',
  itemId: 'morgen_mobil_5',
  status: 'done',
  startedAt: new Date('2026-11-23T08:00:00Z'),
  title: 'Morgens mobil',
  ...overrides,
})

function show(actions: WeekActionInput[] = [], param?: string) {
  const week = buildWeek(resolveWeek({ param, now, timeZone: BERLIN, accountCreatedAt: created }), actions, BERLIN)
  return render(<WeekView week={week} />)
}

const days = () => within(screen.getAllByRole('list')[0]).getAllByRole('listitem').filter((item) => item.parentElement?.tagName === 'OL')

describe('WeekView', () => {
  it('zeigt die laufende Woche mit Überschrift, Datumsbereich und sieben Tagen (AC-1)', () => {
    show()
    expect(screen.getByRole('heading', { level: 1, name: 'Wochenblick' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Diese Woche · 23.–29. Nov.' })).toBeInTheDocument()
    expect(days().map((day) => day.textContent?.slice(0, 6))).toEqual(['Mo 23.', 'Di 24.', 'Mi 25.', 'Do 26.', 'Fr 27.', 'Sa 28.', 'So 29.'])
  })

  it('markiert heute mit Text und als aktuelles Datum (AC-2)', () => {
    show()
    const today = days()[1]
    expect(today).toHaveAttribute('aria-current', 'date')
    expect(within(today).getByText('heute')).toBeInTheDocument()
    expect(days().filter((day) => day.hasAttribute('aria-current'))).toHaveLength(1)
  })

  it('zeigt leere Tage nur mit einem ruhigen Strich (AC-3)', () => {
    show([action({})])
    const tuesday = days()[1]
    expect(within(tuesday).getByText('–')).toBeInTheDocument()
    expect(tuesday.textContent).not.toMatch(/Lücke|verpasst|fehlt/)
  })

  it('zeigt Einträge mit Titel als Link zum Detail, Art und Zustand (AC-4, AC-7)', () => {
    show([
      action({}),
      action({ kind: 'eat', itemId: 'hummus_brot', title: 'Brot mit Hummus', status: 'started', startedAt: new Date('2026-11-23T12:00:00Z') }),
    ])
    const monday = days()[0]
    expect(within(monday).getByRole('link', { name: 'Morgens mobil' })).toHaveAttribute('href', '/bewegung/morgen_mobil_5')
    expect(within(monday).getByRole('link', { name: 'Brot mit Hummus' })).toHaveAttribute('href', '/essen/hummus_brot')
    const entries = within(monday).getAllByRole('listitem')
    expect(entries[0]).toHaveTextContent('Morgens mobil · Bewegen · geschafft')
    expect(entries[1]).toHaveTextContent('Brot mit Hummus · Essen · angefangen')
  })

  it('bietet nichts zum Markieren, Ändern oder Löschen an (AC-8)', () => {
    show([action({ status: 'started' })])
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText(/Geschafft$|Heute nicht|Löschen|Bearbeiten/)).toBeNull()
  })

  it('zeigt den Überblickssatz ohne Zahl nur nach Geschafftem (AC-9, AC-10)', () => {
    const { unmount } = show([action({})])
    expect(screen.getByText('Diese Woche hast du etwas für dich getan.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 }).parentElement?.textContent).not.toMatch(/\d+\s*(x|×|Mal|geschafft)/)
    unmount()
    show([action({ status: 'started' })])
    expect(screen.queryByText(/etwas für dich getan/)).toBeNull()
  })

  it('zeigt in der leeren laufenden Woche den Hinweis mit dem Weg zu Heute (AC-11)', () => {
    show()
    expect(screen.getByText('Für diese Woche gibt es noch nichts. Auf „Heute“ findest du einen passenden nächsten Schritt.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zu Heute' })).toHaveAttribute('href', '/heute')
  })

  it('zeigt in einer früheren leeren Woche keinen Hinweis, nur die Tage', () => {
    show([], '2026-11-16')
    expect(screen.getByRole('heading', { level: 2, name: 'Vorige Woche · 16.–22. Nov.' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Zu Heute' })).toBeNull()
    expect(screen.getAllByText('–')).toHaveLength(7)
  })

  it('blättert über Links und bietet nur erlaubte Richtungen (AC-12 bis AC-14)', () => {
    const { unmount } = show()
    expect(screen.getByRole('link', { name: 'Vorige Woche' })).toHaveAttribute('href', '/wochenblick?woche=2026-11-16')
    expect(screen.queryByRole('link', { name: 'Nächste Woche' })).toBeNull()
    unmount()

    show([], '2026-09-30')
    expect(screen.getByRole('heading', { level: 2, name: '28. Sept.–4. Okt.' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Vorige Woche' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Nächste Woche' })).toHaveAttribute('href', '/wochenblick?woche=2026-10-05')
  })

  it('zeigt nicht mehr angebotene Inhalte mit Ersatztitel ohne Link (EC-1)', () => {
    show([action({ title: null })])
    expect(within(days()[0]).getByText('Dein Workout')).toBeInTheDocument()
    expect(within(days()[0]).queryByRole('link')).toBeNull()
  })

  it('lässt viele Einträge mit langen Titeln umbrechen statt seitlich zu scrollen (EC-5)', () => {
    const long = 'Ein sehr langer Titel für ein Workout, das auf schmalen Bildschirmen umbrechen muss'
    show(Array.from({ length: 5 }, (_, index) => action({ title: `${long} ${index}`, startedAt: new Date(`2026-11-23T0${index + 5}:00:00Z`) })))
    const entries = within(days()[0]).getAllByRole('listitem')
    expect(entries).toHaveLength(5)
    for (const entry of entries) expect(entry.className).toContain('[overflow-wrap:anywhere]')
    expect(within(days()[0]).getByRole('list').className).toContain('min-w-0')
  })
})
