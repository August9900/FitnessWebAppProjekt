'use client'

// The editor for an own workout (PROJ-10 AC-2 to AC-6, AC-9): name and sequence live in the
// browser until "Speichern"; the same schema as the server checks them first and puts hints next
// to the fields. Saving locks the buttons (EC-4); a failure, the limit or "gibt es nicht mehr"
// keep every input (EC-2, EC-3, EC-5). Moving works with buttons only — no dragging (AC-3).
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProfileAnswers } from '@/features/profile/profile.rules'
import { STEP_MODES, type Exercise, type StepMode } from '@/features/workouts/workouts.rules'
import { cn } from '@/lib/utils'
import { saveCustomWorkout, type SaveIntent } from '../custom-workouts.actions'
import {
  CUSTOM_TEXTS,
  LIMITS,
  MODE_LABELS,
  addStep,
  customDetailHref,
  moveStep,
  removeStep,
  setStepAmount,
  setStepMode,
  type CustomStep,
} from '../custom-workouts.rules'
import { fieldErrorsOf, saveCustomWorkoutSchema, type FieldErrors } from '../custom-workouts.schema'
import { ExercisePicker } from './exercise-picker'

type Problem = 'gone' | 'limit' | 'failed'

export function CustomWorkoutEditor({
  intent,
  initial,
  exercises,
  profile,
  cancelHref,
}: {
  intent: SaveIntent
  /** For a new workout the page passes a freshly created id, so a double "Speichern" stays one (EC-4). */
  initial: { id: string; name: string; steps: CustomStep[] }
  exercises: Exercise[]
  profile: Pick<ProfileAnswers, 'places' | 'homeEquipment'>
  cancelHref: string
}) {
  const formId = useId()
  const router = useRouter()
  const [id, setId] = useState(initial.id)
  const [currentIntent, setCurrentIntent] = useState<SaveIntent>(intent)
  const [name, setName] = useState(initial.name)
  const [steps, setSteps] = useState<CustomStep[]>(initial.steps)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [problem, setProblem] = useState<Problem | null>(null)
  const [pending, startTransition] = useTransition()
  // After a successful save the page is left; nothing may be tapped in the meantime (EC-4).
  const [leaving, setLeaving] = useState(false)
  const busy = pending || leaving

  const nameById = new Map(exercises.map((exercise) => [exercise.id, exercise.name]))
  const nameError = `${formId}-name-error`
  const stepsError = `${formId}-steps-error`

  function save(saveId: string, saveIntent: SaveIntent) {
    if (busy) return
    setProblem(null)
    const input = { id: saveId, name, steps }
    const checked = saveCustomWorkoutSchema.safeParse(input)
    if (!checked.success) {
      setErrors(fieldErrorsOf(checked.error))
      return
    }
    setErrors({})
    startTransition(async () => {
      const result = await saveCustomWorkout(input, saveIntent)
      if (result.ok) {
        setLeaving(true)
        router.push(customDetailHref(result.id))
        return
      }
      if (result.reason === 'invalid') setErrors(result.fieldErrors)
      else setProblem(result.reason)
    })
  }

  /** "Als neues Workout speichern": same inputs, a new id (EC-2). */
  function saveAsNew() {
    const newId = crypto.randomUUID()
    setId(newId)
    setCurrentIntent('create')
    save(newId, 'create')
  }

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        save(id, currentIntent)
      }}
      className="max-w-2xl space-y-8"
    >
      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`} className="text-base">
          {CUSTOM_TEXTS.name}
        </Label>
        <Input
          id={`${formId}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={LIMITS.nameMax + 20}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameError : undefined}
          className="h-12"
        />
        {errors.name && (
          <p id={nameError} role="alert" className="text-sm font-medium text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      <section aria-labelledby={`${formId}-steps-title`} className="space-y-4">
        <h2 id={`${formId}-steps-title`} className="text-xl font-semibold">
          {CUSTOM_TEXTS.sequence}
        </h2>
        {errors.steps && (
          <p id={stepsError} role="alert" className="text-sm font-medium text-destructive">
            {errors.steps}
          </p>
        )}

        {steps.length > 0 && (
          <ol className="space-y-3" aria-describedby={errors.steps ? stepsError : undefined}>
            {steps.map((step, index) => {
              const exerciseName = nameById.get(step.exerciseId) ?? step.exerciseId
              const label = `${exerciseName} (Übung ${index + 1})`
              const amountId = `${formId}-amount-${index}`
              const amountError = errors.step?.[index]
              return (
                <li key={`${index}-${step.exerciseId}`} className="space-y-3 rounded-lg border bg-card p-4">
                  <p className="font-medium [overflow-wrap:anywhere]">
                    {index + 1}. {exerciseName}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    <div role="group" aria-label={`${CUSTOM_TEXTS.modeLabel}: ${label}`} className="flex gap-2">
                      {STEP_MODES.map((mode: StepMode) => {
                        const selected = step.mode === mode
                        return (
                          <Button
                            key={mode}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            aria-pressed={selected}
                            onClick={() => setSteps((current) => setStepMode(current, index, mode))}
                            disabled={busy}
                          >
                            {selected && <Check aria-hidden="true" />}
                            {MODE_LABELS[mode]}
                          </Button>
                        )
                      })}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={amountId} className="text-sm">
                        {MODE_LABELS[step.mode]}
                      </Label>
                      <Input
                        id={amountId}
                        type="number"
                        inputMode="numeric"
                        min={step.mode === 'time' ? LIMITS.secondsMin : LIMITS.repsMin}
                        max={step.mode === 'time' ? LIMITS.secondsMax : LIMITS.repsMax}
                        step={step.mode === 'time' ? LIMITS.secondsStep : 1}
                        value={Number.isNaN(step.amount) ? '' : step.amount}
                        onChange={(event) => setSteps((current) => setStepAmount(current, index, Number(event.target.value)))}
                        aria-invalid={amountError ? true : undefined}
                        aria-describedby={amountError ? `${amountId}-error` : undefined}
                        className="h-12 w-28"
                        disabled={busy}
                      />
                    </div>
                  </div>
                  {amountError && (
                    <p id={`${amountId}-error`} role="alert" className="text-sm font-medium text-destructive">
                      {amountError}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSteps((current) => moveStep(current, index, -1))}
                      disabled={busy || index === 0}
                      aria-label={`${CUSTOM_TEXTS.moveUp}: ${label}`}
                    >
                      <ArrowUp aria-hidden="true" />
                      {CUSTOM_TEXTS.moveUp}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSteps((current) => moveStep(current, index, 1))}
                      disabled={busy || index === steps.length - 1}
                      aria-label={`${CUSTOM_TEXTS.moveDown}: ${label}`}
                    >
                      <ArrowDown aria-hidden="true" />
                      {CUSTOM_TEXTS.moveDown}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSteps((current) => removeStep(current, index))}
                      disabled={busy}
                      aria-label={`${CUSTOM_TEXTS.remove}: ${label}`}
                    >
                      <X aria-hidden="true" />
                      {CUSTOM_TEXTS.remove}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <ExercisePicker
          exercises={exercises}
          profile={profile}
          onAdd={(exerciseId) => setSteps((current) => addStep(current, exerciseId))}
          disabled={busy || steps.length >= LIMITS.stepsMax}
        />
      </section>

      {problem && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="space-y-3 text-base">
            <span className="block">
              {problem === 'gone' ? CUSTOM_TEXTS.gone : problem === 'limit' ? CUSTOM_TEXTS.limit : CUSTOM_TEXTS.failed}
            </span>
            {problem === 'gone' && (
              <Button type="button" variant="outline" onClick={saveAsNew} disabled={busy}>
                {CUSTOM_TEXTS.saveAsNew}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>{CUSTOM_TEXTS.cancel}</Link>
        </Button>
        <Button type="submit" disabled={busy} className={cn(busy && 'cursor-wait')}>
          {pending ? CUSTOM_TEXTS.saving : CUSTOM_TEXTS.save}
        </Button>
      </div>
    </form>
  )
}
