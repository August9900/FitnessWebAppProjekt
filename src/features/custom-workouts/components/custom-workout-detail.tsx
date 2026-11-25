'use client'

// An own workout (PROJ-10 AC-7, AC-8, AC-10): equipment, the safety note and the sequence with
// "Leichter" and links to the library; "Los geht's" carries the "leichter" choice to the guided
// run; "Löschen" asks first and is locked while it runs (EC-4), a failure says so (EC-5).
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { PageHeader } from '@/components/shell/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { libraryExerciseHref } from '@/features/exercises/exercises.rules'
import { ExerciseView } from '@/features/workouts/components/exercise-view'
import { SAFETY_NOTE, equipmentText, type WorkoutStep } from '@/features/workouts/workouts.rules'
import { deleteCustomWorkout } from '../custom-workouts.actions'
import { CUSTOM_TEXTS, customEditHref, customEquipment, customGuidedHref, deleteQuestion } from '../custom-workouts.rules'

export function CustomWorkoutDetail({ id, name, steps }: { id: string; name: string; steps: WorkoutStep[] }) {
  const router = useRouter()
  const [easier, setEasier] = useState<number[]>([])
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const [leaving, setLeaving] = useState(false)
  const busy = pending || leaving

  function setEasierAt(position: number, value: boolean) {
    setEasier((current) => (value ? [...current, position] : current.filter((entry) => entry !== position)))
  }

  function remove() {
    if (busy) return
    setFailed(false)
    startTransition(async () => {
      const result = await deleteCustomWorkout({ id })
      if (result.ok) {
        setLeaving(true)
        router.push('/bewegung')
        return
      }
      setFailed(true)
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={name}
        action={
          <Button asChild size="lg">
            <Link href={customGuidedHref(id, easier)}>{CUSTOM_TEXTS.start}</Link>
          </Button>
        }
      />

      <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">{CUSTOM_TEXTS.equipment}</dt>
        <dd className="[overflow-wrap:anywhere]">{equipmentText(customEquipment(steps))}</dd>
      </dl>

      <Alert className="max-w-xl">
        <AlertDescription className="text-base text-foreground">{SAFETY_NOTE}</AlertDescription>
      </Alert>

      <section aria-labelledby="custom-sequence-title" className="space-y-4">
        <h2 id="custom-sequence-title" className="text-xl font-semibold">
          {CUSTOM_TEXTS.sequence}
        </h2>
        <ol className="space-y-6">
          {steps.map((step) => (
            <li key={step.position} className="space-y-1 rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">{step.position}. Übung</p>
              <ExerciseView
                step={step}
                easier={easier.includes(step.position)}
                onEasierChange={(value) => setEasierAt(step.position, value)}
                nameHref={libraryExerciseHref(step.exercise) ?? undefined}
              />
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={customEditHref(id)}>{CUSTOM_TEXTS.edit}</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" disabled={busy}>
              {CUSTOM_TEXTS.delete}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteQuestion(name)}</AlertDialogTitle>
              <AlertDialogDescription>Das lässt sich nicht rückgängig machen.</AlertDialogDescription>
            </AlertDialogHeader>
            {/* The dialog stays open after a failed delete, so the message belongs here (EC-5). */}
            {failed && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{CUSTOM_TEXTS.failed}</AlertDescription>
              </Alert>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>{CUSTOM_TEXTS.cancel}</AlertDialogCancel>
              <Button type="button" variant="destructive" onClick={remove} disabled={busy}>
                {CUSTOM_TEXTS.delete}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
