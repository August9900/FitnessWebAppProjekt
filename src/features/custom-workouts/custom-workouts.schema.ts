/**
 * Input validation for PROJ-10 (SEC-02): the same rules in the editor and in the server action
 * (AC-6). Pure: Zod and the limits only.
 */
import { z } from 'zod'
import { STEP_MODES } from '@/features/workouts/workouts.rules'
import { LIMITS } from './custom-workouts.rules'

export const FIELD_MESSAGES = {
  name: `Gib einen Namen mit ${LIMITS.nameMin} bis ${LIMITS.nameMax} Zeichen ein.`,
  stepsEmpty: 'Füg mindestens eine Übung hinzu.',
  stepsTooMany: `Höchstens ${LIMITS.stepsMax} Übungen.`,
  seconds: `Sekunden: ${LIMITS.secondsMin} bis ${LIMITS.secondsMax}, in ${LIMITS.secondsStep}er-Schritten.`,
  reps: `Wiederholungen: ${LIMITS.repsMin} bis ${LIMITS.repsMax}.`,
} as const

const stepSchema = z
  .strictObject({
    exerciseId: z.string().regex(/^[a-z0-9_]{3,40}$/),
    mode: z.enum(STEP_MODES),
    amount: z.number(),
  })
  .superRefine((step, context) => {
    const { amount } = step
    const ok =
      Number.isInteger(amount) &&
      (step.mode === 'time'
        ? amount >= LIMITS.secondsMin && amount <= LIMITS.secondsMax && amount % LIMITS.secondsStep === 0
        : amount >= LIMITS.repsMin && amount <= LIMITS.repsMax)
    if (!ok) {
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: step.mode === 'time' ? FIELD_MESSAGES.seconds : FIELD_MESSAGES.reps,
      })
    }
  })

/** Name is trimmed first; then 2–40 characters (AC-6). */
const nameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(LIMITS.nameMin, FIELD_MESSAGES.name).max(LIMITS.nameMax, FIELD_MESSAGES.name))

export const saveCustomWorkoutSchema = z.strictObject({
  id: z.uuid(),
  name: nameSchema,
  steps: z.array(stepSchema).min(LIMITS.stepsMin, FIELD_MESSAGES.stepsEmpty).max(LIMITS.stepsMax, FIELD_MESSAGES.stepsTooMany),
})

export const deleteCustomWorkoutSchema = z.strictObject({ id: z.uuid() })

export type SaveCustomWorkoutInput = z.infer<typeof saveCustomWorkoutSchema>

/** The hints the editor shows next to each field (AC-6). */
export type FieldErrors = { name?: string; steps?: string; step?: Record<number, string> }

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const [field, index] = issue.path
    if (field === 'name' && !result.name) result.name = issue.message
    else if (field === 'steps' && typeof index === 'number') {
      result.step = { ...result.step, [index]: result.step?.[index] ?? issue.message }
    } else if (field === 'steps' && !result.steps) result.steps = issue.message
  }
  return result
}
