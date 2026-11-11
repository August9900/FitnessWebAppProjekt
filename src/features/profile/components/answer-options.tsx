'use client'

// Large, fully clickable choices for the PROJ-3 questions — one shared look for onboarding and
// profile. Single choice uses the shadcn RadioGroup, multiple choice the shadcn Checkbox.
import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export type Option<V extends string> = { value: V; label: string }

type GroupProps = {
  legend: string
  /** Shown under the legend, e.g. "Mehrere Antworten möglich." */
  hint?: string
  error?: string
  /** Render the legend as the page's main heading (onboarding) instead of a field label. */
  legendAsHeading?: boolean
}

function Legend({ legend, hint, legendAsHeading }: Pick<GroupProps, 'legend' | 'hint' | 'legendAsHeading'>) {
  return (
    <>
      <legend
        className={cn(
          legendAsHeading ? 'font-display text-[28px] font-bold leading-tight' : 'text-base font-medium'
        )}
      >
        {legendAsHeading ? <h1>{legend}</h1> : legend}
      </legend>
      {hint && <p className="mt-2 text-muted-foreground">{hint}</p>}
    </>
  )
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className="mt-3 text-sm font-medium text-destructive">
      {error}
    </p>
  )
}

const optionRow =
  'flex min-h-12 items-center gap-3 rounded-lg border bg-card px-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:font-semibold'

export function SingleChoice<V extends string>({
  options,
  value,
  onChange,
  legend,
  hint,
  error,
  legendAsHeading,
}: GroupProps & { options: readonly Option<V>[]; value: V | null; onChange: (value: V) => void }) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <Legend legend={legend} hint={hint} legendAsHeading={legendAsHeading} />
      <RadioGroup value={value ?? ''} onValueChange={(next) => onChange(next as V)} className="mt-4 gap-3">
        {options.map((option) => (
          <div key={option.value} className={optionRow}>
            <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
            <Label htmlFor={`${id}-${option.value}`} className="flex-1 cursor-pointer py-3 text-base font-[inherit]">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <ErrorText id={errorId} error={error} />
    </fieldset>
  )
}

export function MultiChoice<V extends string>({
  options,
  values,
  onChange,
  exclusiveValue,
  legend,
  hint,
  error,
  legendAsHeading,
}: GroupProps & {
  options: readonly Option<V>[]
  values: readonly V[] | null
  onChange: (values: V[]) => void
  /** A value like "Nichts davon" that stands alone: choosing it clears the rest, and vice versa. */
  exclusiveValue?: V
}) {
  const id = useId()
  const errorId = `${id}-error`
  const selected = values ?? []

  function toggle(value: V, checked: boolean) {
    if (!checked) return onChange(selected.filter((entry) => entry !== value))
    if (value === exclusiveValue) return onChange([value])
    onChange([...selected.filter((entry) => entry !== exclusiveValue), value])
  }

  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <Legend legend={legend} hint={hint} legendAsHeading={legendAsHeading} />
      <div className="mt-4 grid gap-3">
        {options.map((option) => (
          <div key={option.value} className={optionRow}>
            <Checkbox
              id={`${id}-${option.value}`}
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked === true)}
            />
            <Label htmlFor={`${id}-${option.value}`} className="flex-1 cursor-pointer py-3 text-base font-[inherit]">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      <ErrorText id={errorId} error={error} />
    </fieldset>
  )
}
