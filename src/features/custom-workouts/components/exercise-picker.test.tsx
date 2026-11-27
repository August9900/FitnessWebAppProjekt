import { act, render, screen, within } from '@testing-library/react'
import type { Exercise } from '@/features/workouts/workouts.rules'
import { ExercisePicker } from './exercise-picker'

const exercise = (id: string, name: string, equipment: Exercise['equipment'] = []): Exercise => ({
  id,
  name,
  instructions: 'Mach es so.',
  easierName: 'Leichter',
  easierInstructions: 'Mach es leichter.',
  equipment,
})

const exercises = [exercise('kniebeuge', 'Kniebeuge'), exercise('beckenheben', 'Beckenheben', ['mat']), exercise('kh_rudern', 'Rudern mit Kurzhanteln', ['dumbbells'])]
const home = { places: ['home' as const], homeEquipment: ['mat' as const] }

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

async function click(element: HTMLElement) {
  await act(async () => {
    element.click()
  })
}

async function open(props: Partial<Parameters<typeof ExercisePicker>[0]> = {}) {
  const onAdd = vi.fn()
  render(<ExercisePicker exercises={exercises} profile={home} onAdd={onAdd} {...props} />)
  await click(screen.getByRole('button', { name: 'Übung hinzufügen' }))
  return { onAdd, dialog: screen.getByRole('dialog') }
}

describe('ExercisePicker (AC-2, AC-4)', () => {
  it('zeigt alle Übungen alphabetisch mit Ausstattung', async () => {
    const { dialog } = await open()
    expect(within(dialog).getByRole('heading', { name: 'Übung hinzufügen' })).toBeInTheDocument()
    const items = within(dialog).getAllByRole('listitem')
    expect(items.map((item) => item.querySelector('p')?.textContent)).toEqual(['Beckenheben', 'Kniebeuge', 'Rudern mit Kurzhanteln'])
    expect(items[0]).toHaveTextContent('Matte')
    expect(items[1]).toHaveTextContent('Ohne Ausstattung')
  })

  it('filtert wie die Bibliothek', async () => {
    const { dialog } = await open()
    await click(within(dialog).getByRole('button', { name: 'Ohne Ausstattung' }))
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(1)
    expect(within(dialog).getByRole('button', { name: 'Ohne Ausstattung' })).toHaveAttribute('aria-pressed', 'true')
    await click(within(dialog).getByRole('button', { name: 'Passt zu meinem Zuhause' }))
    expect(within(dialog).getAllByRole('listitem').map((item) => item.querySelector('p')?.textContent)).toEqual(['Beckenheben', 'Kniebeuge'])
  })

  it('bietet „Passt zu meinem Zuhause“ ohne „Zuhause“ im Profil nicht an', async () => {
    const { dialog } = await open({ profile: { places: ['gym'], homeEquipment: null } })
    expect(within(dialog).queryByRole('button', { name: 'Passt zu meinem Zuhause' })).toBeNull()
  })

  it('fügt Übungen hinzu, auch dieselbe mehrfach, und bleibt dabei offen', async () => {
    const { dialog, onAdd } = await open()
    await click(within(dialog).getByRole('button', { name: 'Hinzufügen: Kniebeuge' }))
    await click(within(dialog).getByRole('button', { name: 'Hinzufügen: Kniebeuge' }))
    expect(onAdd).toHaveBeenNthCalledWith(1, 'kniebeuge')
    expect(onAdd).toHaveBeenNthCalledWith(2, 'kniebeuge')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('lässt sich gesperrt nicht öffnen', () => {
    render(<ExercisePicker exercises={exercises} profile={home} onAdd={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'Übung hinzufügen' })).toBeDisabled()
  })
})
