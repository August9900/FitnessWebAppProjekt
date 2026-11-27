import { act, fireEvent, render, screen } from '@testing-library/react'

const saveWeightEntry = vi.fn()
vi.mock('../weight.actions', () => ({ saveWeightEntry }))

const { WeightEntryDialog } = await import('./weight-entry-dialog')

const today = '2026-11-25'
const entries = [
  { date: '2026-11-25', weightKg: 72.4 },
  { date: '2026-11-20', weightKg: 73 },
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
  saveWeightEntry.mockResolvedValue({ ok: true })
})

function show(props: Partial<Parameters<typeof WeightEntryDialog>[0]> = {}) {
  const onOpenChange = vi.fn()
  const onSaved = vi.fn()
  render(<WeightEntryDialog open onOpenChange={onOpenChange} onSaved={onSaved} entries={entries} today={today} {...props} />)
  return { onOpenChange, onSaved }
}

const dateInput = () => screen.getByLabelText('Datum')
const weightInput = () => screen.getByLabelText('Gewicht in kg')

async function type(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
}

async function submit() {
  await act(async () => {
    screen.getByRole('button', { name: 'Speichern' }).click()
  })
}

describe('WeightEntryDialog — Eintragen (AC-4, AC-5, EC-5)', () => {
  it('ist mit heute vorausgefüllt, erlaubt kein späteres Datum und speichert', async () => {
    const { onOpenChange, onSaved } = show({ entries: [] })
    expect(screen.getByRole('heading', { name: 'Eintragen' })).toBeInTheDocument()
    expect(dateInput()).toHaveValue('2026-11-25')
    expect(dateInput()).toHaveAttribute('max', '2026-11-25')
    await type(weightInput(), '72,4')
    await submit()
    expect(saveWeightEntry).toHaveBeenCalledWith({ date: '2026-11-25', weight: '72,4', previousDate: null, replace: false })
    expect(onSaved).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('zeigt Hinweise beim betroffenen Feld und sendet nichts (AC-5)', async () => {
    show()
    await type(dateInput(), '2026-11-26')
    await type(weightInput(), '72,45')
    await submit()
    expect(saveWeightEntry).not.toHaveBeenCalled()
    expect(screen.getByText('Das Datum darf nicht in der Zukunft liegen.')).toBeInTheDocument()
    expect(weightInput()).toHaveAttribute('aria-invalid', 'true')
    expect(weightInput()).toHaveAccessibleDescription('Bitte gib eine Zahl mit höchstens einer Nachkommastelle ein, z. B. 72,4.')
  })
})

describe('WeightEntryDialog — vorhandener Tag (AC-6)', () => {
  it('fragt vor dem Ersetzen nach, mit dem gespeicherten Wert, und speichert erst nach „Ersetzen“', async () => {
    show()
    await type(weightInput(), '71')
    await submit()
    expect(saveWeightEntry).not.toHaveBeenCalled()
    expect(screen.getByText('Für diesen Tag gibt es schon einen Eintrag (72,4 kg). Ersetzen?')).toBeInTheDocument()
    await act(async () => {
      screen.getByRole('button', { name: 'Ersetzen' }).click()
    })
    expect(saveWeightEntry).toHaveBeenCalledWith({ date: '2026-11-25', weight: '71', previousDate: null, replace: true })
  })

  it('„Abbrechen“ lässt den alten Eintrag stehen und behält die Eingaben', async () => {
    const { onOpenChange } = show()
    await type(weightInput(), '71')
    await submit()
    await act(async () => {
      screen.getAllByRole('button', { name: 'Abbrechen' })[0].click()
    })
    expect(saveWeightEntry).not.toHaveBeenCalled()
    expect(screen.queryByText(/Ersetzen\?/)).toBeNull()
    expect(weightInput()).toHaveValue('71')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('der gleiche Wert am selben Tag gilt ohne Rückfrage als gespeichert', async () => {
    show()
    await type(weightInput(), '72,4')
    await submit()
    expect(saveWeightEntry).toHaveBeenCalledWith(expect.objectContaining({ replace: false }))
  })

  it('fragt auch, wenn der Server einen Eintrag meldet, den die Liste noch nicht kannte', async () => {
    saveWeightEntry.mockResolvedValueOnce({ ok: false, reason: 'exists', weightKg: 70.1 })
    show({ entries: [] })
    await type(weightInput(), '71')
    await submit()
    expect(screen.getByText('Für diesen Tag gibt es schon einen Eintrag (70,1 kg). Ersetzen?')).toBeInTheDocument()
  })
})

describe('WeightEntryDialog — Ändern (AC-11, EC-3)', () => {
  it('ist mit dem Eintrag vorausgefüllt und sendet das bisherige Datum mit', async () => {
    show({ entry: entries[1] })
    expect(screen.getByRole('heading', { name: 'Eintrag ändern' })).toBeInTheDocument()
    expect(dateInput()).toHaveValue('2026-11-20')
    expect(weightInput()).toHaveValue('73,0')
    await type(weightInput(), '72,8')
    await submit()
    expect(saveWeightEntry).toHaveBeenCalledWith({ date: '2026-11-20', weight: '72,8', previousDate: '2026-11-20', replace: false })
  })

  it('fragt beim Verschieben auf einen belegten Tag nach', async () => {
    show({ entry: entries[1] })
    await type(dateInput(), '2026-11-25')
    await submit()
    expect(saveWeightEntry).not.toHaveBeenCalled()
    expect(screen.getByText(/72,4 kg\). Ersetzen\?/)).toBeInTheDocument()
  })

  it('sagt, wenn es den Eintrag nicht mehr gibt', async () => {
    saveWeightEntry.mockResolvedValueOnce({ ok: false, reason: 'gone' })
    show({ entry: entries[1] })
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Diesen Eintrag gibt es nicht mehr.')
  })
})

describe('WeightEntryDialog — Fehler und Doppeltipps (EC-2, EC-4)', () => {
  it('zeigt bei einem Fehler die Meldung und behält die Eingaben', async () => {
    saveWeightEntry.mockResolvedValueOnce({ ok: false, reason: 'failed' })
    const { onOpenChange } = show({ entries: [] })
    await type(weightInput(), '72,4')
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt. Bitte versuch es noch einmal.')
    expect(weightInput()).toHaveValue('72,4')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('ist während des Speicherns gesperrt — ein zweiter Tipp sendet nichts', async () => {
    let finish: (value: unknown) => void = () => {}
    saveWeightEntry.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    show({ entries: [] })
    await type(weightInput(), '72,4')
    await submit()
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled()
    await submit()
    expect(saveWeightEntry).toHaveBeenCalledTimes(1)
    await act(async () => finish({ ok: true }))
  })
})
