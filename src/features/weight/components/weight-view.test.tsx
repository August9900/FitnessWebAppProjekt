import { act, render, screen, within } from '@testing-library/react'

const deleteWeightEntry = vi.fn()
const deleteAllWeightEntries = vi.fn()
const saveWeightEntry = vi.fn()
vi.mock('../weight.actions', () => ({ deleteWeightEntry, deleteAllWeightEntries, saveWeightEntry }))

const { WeightView } = await import('./weight-view')

const today = '2026-11-25'
const entries = [
  { date: '2026-11-25', weightKg: 72.4 },
  { date: '2026-11-10', weightKg: 73 },
  { date: '2026-06-01', weightKg: 75.5 },
]

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  vi.clearAllMocks()
  deleteWeightEntry.mockResolvedValue({ ok: true })
  deleteAllWeightEntries.mockResolvedValue({ ok: true })
})

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

describe('WeightView — leer (AC-10)', () => {
  it('zeigt den Hinweis mit „Eintragen“, keine Kurve und keine Liste', async () => {
    render(<WeightView entries={[]} range="3m" today={today} />)
    expect(screen.getByText('Hier siehst du deinen Verlauf, sobald du etwas einträgst.')).toBeInTheDocument()
    expect(screen.queryByTestId('weight-chart')).toBeNull()
    expect(screen.queryByText('Zu wenige Einträge für eine Kurve.')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
    await click(screen.getAllByRole('button', { name: 'Eintragen' })[1])
    expect(screen.getByRole('dialog', { name: 'Eintragen' })).toBeInTheDocument()
  })
})

describe('WeightView — Verlauf (AC-7 bis AC-9)', () => {
  it('Zeitraum-Wahl als Links, der gewählte mit aria-current und Häkchen', () => {
    render(<WeightView entries={entries} range="1m" today={today} />)
    const nav = screen.getByRole('navigation', { name: 'Zeitraum' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['1 Monat', '/gewicht?zeitraum=1m'],
      ['3 Monate', '/gewicht'],
      ['1 Jahr', '/gewicht?zeitraum=1j'],
    ])
    expect(within(nav).getByRole('link', { current: 'page' })).toHaveTextContent('1 Monat')
    expect(within(nav).getByRole('link', { current: 'page' }).querySelector('svg')).not.toBeNull()
  })

  it('Kurve nur mit den Einträgen des Zeitraums', () => {
    render(<WeightView entries={entries} range="1m" today={today} />)
    expect(screen.getByTestId('weight-chart').querySelectorAll('circle')).toHaveLength(2)
  })

  it('zu wenige Einträge im Zeitraum: Hinweis statt Kurve, Liste bleibt vollständig (AC-8)', () => {
    render(<WeightView entries={[entries[0], entries[2]]} range="1m" today={today} />)
    expect(screen.getByText('Zu wenige Einträge für eine Kurve.')).toBeInTheDocument()
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2)
  })

  it('Liste mit allen Einträgen, neueste zuerst, Datum und kg, Ändern und Löschen (AC-9)', () => {
    render(<WeightView entries={entries} range="1m" today={today} />)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('25. November 202672,4 kg'),
      expect.stringContaining('10. November 202673,0 kg'),
      expect.stringContaining('1. Juni 202675,5 kg'),
    ])
    expect(within(items[0]).getByRole('button', { name: 'Ändern: 25. November 2026' })).toBeInTheDocument()
    expect(within(items[0]).getByRole('button', { name: 'Löschen: 25. November 2026' })).toBeInTheDocument()
  })

  it('„Ändern“ öffnet den Dialog mit dem Eintrag (AC-11)', async () => {
    render(<WeightView entries={entries} range="3m" today={today} />)
    await click(screen.getByRole('button', { name: 'Ändern: 10. November 2026' }))
    const dialog = screen.getByRole('dialog', { name: 'Eintrag ändern' })
    expect(within(dialog).getByLabelText('Datum')).toHaveValue('2026-11-10')
  })
})

describe('WeightView — Löschen (AC-12, AC-13, EC-2, EC-4)', () => {
  it('fragt vor dem Löschen eines Eintrags und löscht erst nach Bestätigung', async () => {
    render(<WeightView entries={entries} range="3m" today={today} />)
    await click(screen.getByRole('button', { name: 'Löschen: 10. November 2026' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Eintrag vom 10. November 2026 löschen?')
    expect(deleteWeightEntry).not.toHaveBeenCalled()
    await click(within(dialog).getByRole('button', { name: 'Löschen' }))
    expect(deleteWeightEntry).toHaveBeenCalledWith({ date: '2026-11-10' })
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('„Abbrechen“ löscht nichts', async () => {
    render(<WeightView entries={entries} range="3m" today={today} />)
    await click(screen.getByRole('button', { name: 'Löschen: 10. November 2026' }))
    await click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }))
    expect(deleteWeightEntry).not.toHaveBeenCalled()
  })

  it('„Alle Einträge löschen“ fragt mit eigenem Text und löscht alles', async () => {
    render(<WeightView entries={entries} range="3m" today={today} />)
    await click(screen.getByRole('button', { name: 'Alle Einträge löschen' }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent('Alle Gewichtseinträge löschen? Das lässt sich nicht rückgängig machen.')
    await click(within(dialog).getByRole('button', { name: 'Löschen' }))
    expect(deleteAllWeightEntries).toHaveBeenCalledTimes(1)
    expect(deleteWeightEntry).not.toHaveBeenCalled()
  })

  it('bleibt bei einem Fehler offen und meldet ihn (EC-4)', async () => {
    deleteWeightEntry.mockResolvedValue({ ok: false, reason: 'failed' })
    render(<WeightView entries={entries} range="3m" today={today} />)
    await click(screen.getByRole('button', { name: 'Löschen: 10. November 2026' }))
    await click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }))
    expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt.')
  })

  it('ist während des Löschens gesperrt — ein zweiter Tipp löscht nicht noch einmal (EC-2)', async () => {
    let finish: (value: unknown) => void = () => {}
    deleteAllWeightEntries.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    render(<WeightView entries={entries} range="3m" today={today} />)
    await click(screen.getByRole('button', { name: 'Alle Einträge löschen' }))
    const confirm = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' })
    await click(confirm)
    expect(confirm).toBeDisabled()
    await click(confirm)
    expect(deleteAllWeightEntries).toHaveBeenCalledTimes(1)
    await act(async () => finish({ ok: true }))
  })
})
