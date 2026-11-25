import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { WorkoutStep } from '@/features/workouts/workouts.rules'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const deleteCustomWorkout = vi.fn()
vi.mock('../custom-workouts.actions', () => ({ deleteCustomWorkout }))

const { CustomWorkoutDetail } = await import('./custom-workout-detail')

const ID = '55555555-5555-4555-8555-555555555555'
const steps: WorkoutStep[] = [
  {
    position: 1,
    mode: 'time',
    amount: 30,
    exercise: { id: 'kniebeuge', name: 'Kniebeuge', instructions: 'Geh langsam in die Knie.', easierName: 'Kniebeuge am Stuhl', easierInstructions: 'Setz dich kurz.', equipment: ['mat'] },
  },
  {
    position: 2,
    mode: 'reps',
    amount: 10,
    exercise: { id: 'marschieren', name: 'Marschieren', instructions: 'Heb die Knie.', easierName: 'Langsam gehen', easierInstructions: 'Geh ruhig.', equipment: [] },
  },
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
  deleteCustomWorkout.mockResolvedValue({ ok: true })
})

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

function show() {
  return render(<CustomWorkoutDetail id={ID} name="Mein Mix" steps={steps} />)
}

async function openDelete() {
  await click(screen.getByRole('button', { name: 'Löschen' }))
  return screen.getByRole('alertdialog')
}

describe('CustomWorkoutDetail', () => {
  it('zeigt Name, Ausstattung, Sicherheitshinweis und die Folge mit Werten und Anleitung (AC-7)', () => {
    show()
    expect(screen.getByRole('heading', { level: 1, name: 'Mein Mix' })).toBeInTheDocument()
    expect(screen.getByText('Matte')).toBeInTheDocument()
    expect(screen.getByText('Hör auf deinen Körper. Bei Schmerzen hörst du auf.')).toBeInTheDocument()
    const items = within(screen.getAllByRole('list')[0]).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('30 Sekunden')
    expect(items[1]).toHaveTextContent('10 Wiederholungen')
    expect(items[0]).toHaveTextContent('Geh langsam in die Knie.')
  })

  it('verlinkt jeden Übungsnamen auf die Bibliothek (AC-7)', () => {
    show()
    expect(screen.getByRole('link', { name: 'Kniebeuge' })).toHaveAttribute('href', '/bewegung/uebungen/kniebeuge')
  })

  it('startet die Durchführung mit der „leichter“-Auswahl (AC-8)', async () => {
    show()
    expect(screen.getByRole('link', { name: "Los geht's" })).toHaveAttribute('href', `/bewegung/eigene/${ID}/los`)
    const leichter = within(screen.getAllByRole('listitem')[1]).getByRole('switch', { name: 'Leichter' })
    await act(async () => fireEvent.click(leichter))
    expect(screen.getByRole('link', { name: "Los geht's" })).toHaveAttribute('href', `/bewegung/eigene/${ID}/los?leichter=2`)
  })

  it('führt zum Bearbeiten (AC-9)', () => {
    show()
    expect(screen.getByRole('link', { name: 'Bearbeiten' })).toHaveAttribute('href', `/bewegung/eigene/${ID}/bearbeiten`)
  })

  it('fragt vor dem Löschen nach und löscht erst nach Bestätigung (AC-10)', async () => {
    show()
    const dialog = await openDelete()
    expect(within(dialog).getByRole('heading', { name: 'Workout „Mein Mix“ löschen?' })).toBeInTheDocument()
    expect(deleteCustomWorkout).not.toHaveBeenCalled()
    await click(within(dialog).getByRole('button', { name: 'Löschen' }))
    expect(deleteCustomWorkout).toHaveBeenCalledWith({ id: ID })
    expect(push).toHaveBeenCalledWith('/bewegung')
  })

  it('löscht mit „Abbrechen“ nichts', async () => {
    show()
    const dialog = await openDelete()
    await click(within(dialog).getByRole('button', { name: 'Abbrechen' }))
    expect(deleteCustomWorkout).not.toHaveBeenCalled()
  })

  it('zeigt einen Fehler im Dialog und bleibt auf der Seite (EC-5)', async () => {
    deleteCustomWorkout.mockResolvedValue({ ok: false, reason: 'failed' })
    show()
    const dialog = await openDelete()
    await click(within(dialog).getByRole('button', { name: 'Löschen' }))
    expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('Das hat gerade nicht geklappt.')
    expect(push).not.toHaveBeenCalled()
  })

  it('sperrt das Löschen, solange es läuft — Doppeltipps löschen einmal (EC-4)', async () => {
    let finish: (value: unknown) => void = () => {}
    deleteCustomWorkout.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    show()
    const dialog = await openDelete()
    const confirm = within(dialog).getByRole('button', { name: 'Löschen' })
    await click(confirm)
    await click(confirm)
    expect(deleteCustomWorkout).toHaveBeenCalledTimes(1)
    expect(confirm).toBeDisabled()
    await act(async () => finish({ ok: true }))
    expect(push).toHaveBeenCalledTimes(1)
  })
})
