'use client'

import { useId, useState, useTransition, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveWeightEntry } from '../weight.actions'
import { WEIGHT_TEXTS, replaceQuestion, weightInputValue, type WeightEntry } from '../weight.rules'
import { validateWeightEntry, type WeightFieldErrors } from '../weight.schema'

export type WeightEntryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The entry being changed (AC-11); none for a new one (AC-4). */
  entry?: WeightEntry | null
  /** All loaded entries, to ask before replacing a day right away (AC-6). */
  entries: WeightEntry[]
  /** Today in the device's time zone (EC-5). */
  today: string
  onSaved?: () => void
}

/**
 * „Eintragen“ / „Eintrag ändern“: day and kilograms, checked before sending (AC-4, AC-5, AC-11). Asks
 * before a day that already has another value is replaced — from the loaded entries or the server's
 * answer (AC-6). Locked while saving (EC-2); keeps the inputs after a failure (EC-4) and says when
 * the entry is gone (EC-3).
 */
export function WeightEntryDialog(props: WeightEntryDialogProps) {
  // A fresh form each time it opens, prefilled for the entry being changed.
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <WeightEntryForm key={props.entry?.date ?? 'neu'} {...props} />}
    </Dialog>
  )
}

function WeightEntryForm({ onOpenChange, entry, entries, today, onSaved }: WeightEntryDialogProps) {
  const ids = useId()
  const [date, setDate] = useState(entry?.date ?? today)
  const [weight, setWeight] = useState(entry ? weightInputValue(entry.weightKg) : '')
  const [errors, setErrors] = useState<WeightFieldErrors>({})
  const [replaceValue, setReplaceValue] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save(replace: boolean) {
    setMessage(null)
    const input = { date, weight, previousDate: entry?.date ?? null, replace }
    const checked = validateWeightEntry(input, today)
    if (!checked.ok) {
      setErrors(checked.errors)
      return
    }
    setErrors({})

    // Another value on the target day: ask first (AC-6). The same value counts as saved.
    const other = entries.find((existing) => existing.date === checked.value.date && existing.date !== entry?.date)
    if (!replace && other && other.weightKg !== checked.value.weightKg) {
      setReplaceValue(other.weightKg)
      return
    }

    startTransition(async () => {
      const result = await saveWeightEntry(input)
      if (result.ok) {
        setReplaceValue(null)
        onSaved?.()
        onOpenChange(false)
        return
      }
      if (result.reason === 'exists') setReplaceValue(result.weightKg)
      else if (result.reason === 'invalid' && Object.keys(result.fieldErrors).length > 0) setErrors(result.fieldErrors)
      else setMessage(result.reason === 'gone' ? WEIGHT_TEXTS.gone : WEIGHT_TEXTS.failed)
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    save(false)
  }

  const dateId = `${ids}-datum`
  const weightId = `${ids}-gewicht`

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{entry ? WEIGHT_TEXTS.editTitle : WEIGHT_TEXTS.addTitle}</DialogTitle>
        <DialogDescription className="sr-only">{WEIGHT_TEXTS.weightLabel}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={dateId}>{WEIGHT_TEXTS.dateLabel}</Label>
          <Input
            id={dateId}
            type="date"
            value={date}
            max={today}
            onChange={(event) => {
              setDate(event.target.value)
              setReplaceValue(null)
            }}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? `${dateId}-fehler` : undefined}
            className="h-12"
          />
          {errors.date && (
            <p id={`${dateId}-fehler`} className="text-sm text-destructive">
              {errors.date}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={weightId}>{WEIGHT_TEXTS.weightLabel}</Label>
          <Input
            id={weightId}
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value)
              setReplaceValue(null)
            }}
            aria-invalid={errors.weight ? true : undefined}
            aria-describedby={errors.weight ? `${weightId}-fehler` : undefined}
            className="h-12"
          />
          {errors.weight && (
            <p id={`${weightId}-fehler`} className="text-sm text-destructive">
              {errors.weight}
            </p>
          )}
        </div>

        {replaceValue !== null && (
          <div role="alertdialog" aria-labelledby={`${ids}-ersetzen`} className="space-y-3 rounded-lg border p-4">
            <p id={`${ids}-ersetzen`}>{replaceQuestion(replaceValue)}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => save(true)} disabled={pending}>
                {WEIGHT_TEXTS.replace}
              </Button>
              <Button type="button" variant="outline" onClick={() => setReplaceValue(null)} disabled={pending}>
                {WEIGHT_TEXTS.cancel}
              </Button>
            </div>
          </div>
        )}

        {message && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {WEIGHT_TEXTS.cancel}
          </Button>
          <Button type="submit" disabled={pending || replaceValue !== null}>
            {WEIGHT_TEXTS.save}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
