import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { Exercise } from '@/features/workouts/workouts.rules'
import type { CustomStep } from '../custom-workouts.rules'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const saveCustomWorkout = vi.fn()
vi.mock('../custom-workouts.actions', () => ({ saveCustomWorkout }))

const { CustomWorkoutEditor } = await import('./custom-workout-editor')

const ID = '55555555-5555-4555-8555-555555555555'
const exercise = (id: string, name: string): Exercise => ({
  id,
  name,
  instructions: 'Mach es so.',
  easierName: 'Leichter',
  easierInstructions: 'Mach es leichter.',
  equipment: [],
})
const exercises = [exercise('kniebeuge', 'Kniebeuge'), exercise('marschieren', 'Marschieren')]
const profile = { places: ['home' as const], homeEquipment: ['none' as const] }

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

beforeEach(() => {
  vi.clearAllMocks()
  saveCustomWorkout.mockResolvedValue({ ok: true, id: ID })
})

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

function show(steps: CustomStep[] = [], name = '', intent: 'create' | 'replace' = 'create') {
  return render(
    <CustomWorkoutEditor intent={intent} initial={{ id: ID, name, steps }} exercises={exercises} profile={profile} cancelHref="/bewegung" />
  )
}

const two: CustomStep[] = [
  { exerciseId: 'kniebeuge', mode: 'time', amount: 30 },
  { exerciseId: 'marschieren', mode: 'reps', amount: 10 },
]
const rows = () => within(screen.getAllByRole('list')[0]).getAllByRole('listitem')

describe('CustomWorkoutEditor', () => {
  it('fügt über den Auswahl-Dialog Übungen am Ende mit 30 Sekunden hinzu (AC-2)', async () => {
    show()
    await click(screen.getByRole('button', { name: 'Übung hinzufügen' }))
    await click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hinzufügen: Marschieren' }))
    await act(async () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }))
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('1. Marschieren')
    expect(screen.getByLabelText('Sekunden')).toHaveValue(30)
    expect(within(rows()[0]).getByRole('button', { name: 'Sekunden' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('wechselt die Art, ändert den Wert, verschiebt und entfernt per Knopf (AC-3)', async () => {
    show(two, 'Mix')
    await click(within(rows()[0]).getByRole('button', { name: 'Wiederholungen' }))
    expect(within(rows()[0]).getByRole('button', { name: 'Wiederholungen' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(rows()[0]).getByLabelText('Wiederholungen')).toHaveValue(10)

    fireEvent.change(within(rows()[0]).getByLabelText('Wiederholungen'), { target: { value: '12' } })
    expect(within(rows()[0]).getByLabelText('Wiederholungen')).toHaveValue(12)

    expect(screen.getByRole('button', { name: 'Nach oben: Kniebeuge (Übung 1)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nach unten: Marschieren (Übung 2)' })).toBeDisabled()
    await click(screen.getByRole('button', { name: 'Nach unten: Kniebeuge (Übung 1)' }))
    expect(rows().map((row) => row.querySelector('p')?.textContent)).toEqual(['1. Marschieren', '2. Kniebeuge'])

    await click(screen.getByRole('button', { name: 'Entfernen: Marschieren (Übung 1)' }))
    expect(rows().map((row) => row.querySelector('p')?.textContent)).toEqual(['1. Kniebeuge'])
  })

  it('speichert gültige Eingaben und öffnet das Detail (AC-5)', async () => {
    show(two, '  Mein Mix ')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(saveCustomWorkout).toHaveBeenCalledWith({ id: ID, name: '  Mein Mix ', steps: two }, 'create')
    expect(push).toHaveBeenCalledWith(`/bewegung/eigene/${ID}`)
  })

  it('ersetzt beim Bearbeiten das bestehende Workout (AC-9)', async () => {
    show(two, 'Mein Mix', 'replace')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(saveCustomWorkout).toHaveBeenCalledWith(expect.objectContaining({ id: ID }), 'replace')
  })

  it('zeigt Hinweise am Feld und speichert nicht, wenn Eingaben ungültig sind (AC-6)', async () => {
    show([{ exerciseId: 'kniebeuge', mode: 'time', amount: 32 }], 'X')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(saveCustomWorkout).not.toHaveBeenCalled()
    const name = screen.getByLabelText('Name')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(document.getElementById(name.getAttribute('aria-describedby')!)).toHaveTextContent('Gib einen Namen mit 2 bis 40 Zeichen ein.')
    const amount = screen.getByLabelText('Sekunden')
    expect(document.getElementById(amount.getAttribute('aria-describedby')!)).toHaveTextContent('Sekunden: 10 bis 180, in 5er-Schritten.')
  })

  it('verlangt mindestens eine Übung (AC-6)', async () => {
    show([], 'Mein Mix')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Füg mindestens eine Übung hinzu.')).toBeInTheDocument()
    expect(saveCustomWorkout).not.toHaveBeenCalled()
  })

  it('übernimmt Hinweise des Servers, z. B. zu einer nicht mehr vorhandenen Übung', async () => {
    saveCustomWorkout.mockResolvedValue({ ok: false, reason: 'invalid', fieldErrors: { steps: 'Eine Übung gibt es nicht mehr. Bitte entferne sie.' } })
    show(two, 'Mein Mix')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByText('Eine Übung gibt es nicht mehr. Bitte entferne sie.')).toBeInTheDocument()
  })

  it('zeigt die Grenze von 20 und behält die Eingaben (AC-11, EC-3)', async () => {
    saveCustomWorkout.mockResolvedValue({ ok: false, reason: 'limit' })
    show(two, 'Mein Mix')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Du hast schon 20 eigene Workouts. Lösch eines, um ein neues anzulegen.')
    expect(screen.getByLabelText('Name')).toHaveValue('Mein Mix')
    expect(rows()).toHaveLength(2)
    expect(push).not.toHaveBeenCalled()
  })

  it('bietet nach „gibt es nicht mehr“ das Speichern als neues Workout mit denselben Eingaben (EC-2)', async () => {
    saveCustomWorkout.mockResolvedValueOnce({ ok: false, reason: 'gone' })
    show(two, 'Mein Mix', 'replace')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Dieses Workout gibt es nicht mehr.')

    saveCustomWorkout.mockImplementationOnce(async (input: { id: string }) => ({ ok: true, id: input.id }))
    await click(screen.getByRole('button', { name: 'Als neues Workout speichern' }))
    const [input, intent] = saveCustomWorkout.mock.calls[1]
    expect(intent).toBe('create')
    expect(input).toMatchObject({ name: 'Mein Mix', steps: two })
    expect(input.id).not.toBe(ID)
    expect(push).toHaveBeenCalledWith(`/bewegung/eigene/${input.id}`)
  })

  it('zeigt bei einem Fehler die Meldung und behält die Eingaben (EC-5)', async () => {
    saveCustomWorkout.mockResolvedValue({ ok: false, reason: 'failed' })
    show(two, 'Mein Mix')
    await click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt. Bitte versuch es noch einmal.')
    expect(screen.getByLabelText('Name')).toHaveValue('Mein Mix')
  })

  it('sperrt während des Speicherns — Doppeltipps speichern einmal (EC-4)', async () => {
    let finish: (value: unknown) => void = () => {}
    saveCustomWorkout.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    show(two, 'Mein Mix')
    const save = screen.getByRole('button', { name: 'Speichern' })
    await click(save)
    await click(screen.getByRole('button', { name: 'Wird gespeichert …' }))
    expect(saveCustomWorkout).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Wird gespeichert …' })).toBeDisabled()
    await act(async () => finish({ ok: true, id: ID }))
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('sperrt „Übung hinzufügen“ bei 12 Übungen und lässt die Bedienelemente umbrechen (AC-6, EC-8)', () => {
    show(Array.from({ length: 12 }, () => two[0]), 'Mein Mix')
    expect(screen.getByRole('button', { name: 'Übung hinzufügen' })).toBeDisabled()
    expect(rows()[0].querySelector('.flex-col')).not.toBeNull()
  })

  it('führt mit „Abbrechen“ zurück, ohne zu speichern (AC-9)', () => {
    show(two, 'Mein Mix', 'replace')
    expect(screen.getByRole('link', { name: 'Abbrechen' })).toHaveAttribute('href', '/bewegung')
  })
})
