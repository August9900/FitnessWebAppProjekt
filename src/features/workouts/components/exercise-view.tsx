'use client'

import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { amountLabel, shownExercise, type WorkoutStep } from '../workouts.rules'

/**
 * One exercise — name, seconds or repetitions, instructions — with the "Leichter" switch that
 * shows the easier variant instead (AC-6, AC-7). Used by the detail and the guided view.
 */
export function ExerciseView({
  step,
  easier,
  onEasierChange,
  headingLevel = 'h3',
  showAmount = true,
  className,
}: {
  step: WorkoutStep
  easier: boolean
  onEasierChange: (easier: boolean) => void
  headingLevel?: 'h2' | 'h3'
  /** The guided view shows a timer instead of "30 Sekunden". */
  showAmount?: boolean
  className?: string
}) {
  const switchId = useId()
  const Heading = headingLevel
  const shown = shownExercise(step.exercise, easier)

  return (
    <div className={cn('space-y-2', className)}>
      <Heading className={cn('font-semibold', headingLevel === 'h2' ? 'text-xl' : 'text-base')}>{shown.name}</Heading>
      {easier && <p className="text-sm text-muted-foreground">Leichtere Variante</p>}
      {showAmount && <p className="text-sm font-medium">{amountLabel(step)}</p>}
      <p className="max-w-[70ch] leading-relaxed">{shown.instructions}</p>
      <div className="flex min-h-12 items-center gap-3">
        <Switch id={switchId} checked={easier} onCheckedChange={onEasierChange} />
        <Label htmlFor={switchId} className="cursor-pointer py-3 text-base">
          Leichter
        </Label>
      </div>
    </div>
  )
}
