'use client'

// Section „Meine Angaben“ in Profil (PROJ-3): all answers in one form, saved as one change.
import { useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { updateProfileAnswers } from '../profile.actions'
import { applyAnswer, type ProfileAnswers } from '../profile.rules'
import { LABELS, NO_EQUIPMENT, fieldErrorsOf, profileAnswersSchema } from '../profile.schema'
import { MultiChoice, SingleChoice, optionsOf } from './answer-options'

type Status = { kind: 'idle' } | { kind: 'saved'; message: string } | { kind: 'failed'; message: string }

export function AnswersForm({ initialAnswers }: { initialAnswers: ProfileAnswers }) {
  const [draft, setDraft] = useState<ProfileAnswers>(initialAnswers)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [pending, startTransition] = useTransition()

  function change<Q extends keyof ProfileAnswers>(key: Q, value: ProfileAnswers[Q]) {
    // Removing "Zuhause" removes the equipment at home as well (AC-14).
    setDraft((current) => applyAnswer(current, key, value))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setStatus({ kind: 'idle' })
  }

  function save() {
    if (pending) return
    const parsed = profileAnswersSchema.safeParse(draft)
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error))
      return
    }
    startTransition(async () => {
      const result = await updateProfileAnswers(draft)
      if (result.ok) {
        setErrors({})
        setStatus({ kind: 'saved', message: result.message })
      } else if (result.fieldErrors) {
        setErrors(result.fieldErrors)
      } else {
        setStatus({ kind: 'failed', message: result.message ?? '' })
      }
    })
  }

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      className="space-y-8"
    >
      <SingleChoice
        legend="Ziel"
        options={optionsOf(LABELS.goal)}
        value={draft.goal}
        onChange={(value) => change('goal', value)}
        error={errors.goal}
      />
      <SingleChoice
        legend="Bewegungserfahrung"
        options={optionsOf(LABELS.experience)}
        value={draft.experience}
        onChange={(value) => change('experience', value)}
        error={errors.experience}
      />
      <MultiChoice
        legend="Wo kannst du dich bewegen?"
        hint="Mehrere Antworten möglich."
        options={optionsOf(LABELS.places)}
        values={draft.places}
        onChange={(value) => change('places', value)}
        error={errors.places}
      />
      {draft.places?.includes('home') && (
        <MultiChoice
          legend="Was hast du zuhause?"
          hint="Mehrere Antworten möglich."
          options={optionsOf(LABELS.homeEquipment)}
          values={draft.homeEquipment}
          exclusiveValue={NO_EQUIPMENT}
          onChange={(value) => change('homeEquipment', value)}
          error={errors.homeEquipment}
        />
      )}
      <SingleChoice
        legend="Essensweise"
        options={optionsOf(LABELS.diet)}
        value={draft.diet}
        onChange={(value) => change('diet', value)}
        error={errors.diet}
      />

      {status.kind === 'failed' && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="space-y-3">
            <span className="block">{status.message}</span>
            <Button type="submit" variant="outline" disabled={pending}>
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Wird gespeichert …' : 'Angaben speichern'}
        </Button>
        {status.kind === 'saved' && (
          <p role="status" className="text-sm font-medium">
            {status.message}
          </p>
        )}
      </div>
    </form>
  )
}
