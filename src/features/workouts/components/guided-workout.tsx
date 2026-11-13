'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createTimer, formatSeconds, isExpired, pause, remainingSeconds, start, type TimerState } from '../timer.rules'
import { amountLabel, shownExercise, type Workout } from '../workouts.rules'
import { ExerciseView } from './exercise-view'
import { SampleContentBadge } from './sample-content-badge'

/** After every change of exercise, "Weiter" ignores taps this long, so a double tap skips nothing (EC-5). */
export const ADVANCE_LOCK_MS = 400
/** How often a running timer refreshes its number. */
const TICK_MS = 250

/**
 * The guided workout: one exercise per screen with a timer or repetitions, "Zurück", "Weiter" /
 * "Fertig" and "Beenden" (AC-8 to AC-11). Everything lives in the browser — nothing is sent,
 * stored or counted; a reload starts again at the first exercise (EC-3).
 */
export function GuidedWorkout({ workout, initialEasier }: { workout: Workout; initialEasier: number[] }) {
  const steps = workout.steps
  const [index, setIndex] = useState(0)
  const [easier, setEasier] = useState<Set<number>>(() => new Set(initialEasier))
  const [finished, setFinished] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const lockedUntil = useRef(0)
  const stepRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  const isFirstStep = useRef(true)

  const step = steps[index]
  const isLast = index === steps.length - 1

  // A disabled "Zurück" on the first exercise drops the focus; bring it back to the exercise.
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false
      return
    }
    const active = document.activeElement
    if (!active || active === document.body) stepRef.current?.focus()
  }, [index])

  useEffect(() => {
    if (finished) doneRef.current?.focus()
  }, [finished])

  function goTo(nextIndex: number) {
    lockedUntil.current = Date.now() + ADVANCE_LOCK_MS
    setIndex(nextIndex)
    const nextStep = steps[nextIndex]
    const name = shownExercise(nextStep.exercise, easier.has(nextStep.position)).name
    setAnnouncement(`Übung ${nextIndex + 1} von ${steps.length}: ${name}`)
  }

  function handleNext() {
    if (Date.now() < lockedUntil.current) return
    if (isLast) {
      setFinished(true)
      return
    }
    goTo(index + 1)
  }

  function handleBack() {
    if (index > 0) goTo(index - 1)
  }

  function handleEasierChange(value: boolean) {
    setEasier((current) => {
      const next = new Set(current)
      if (value) next.add(step.position)
      else next.delete(step.position)
      return next
    })
  }

  function handleTimerExpired(hadFocus: boolean) {
    setAnnouncement('Zeit abgelaufen')
    // The timer button disappears at the end; keep keyboard users on the way forward.
    if (hadFocus) nextRef.current?.focus()
  }

  if (finished) {
    return (
      <section className="max-w-xl space-y-6 rounded-lg border bg-card p-6">
        <h2 ref={doneRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          Geschafft. Gut gemacht.
        </h2>
        <Button asChild>
          <Link href="/bewegung">Zu Bewegung</Link>
        </Button>
      </section>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div ref={stepRef} tabIndex={-1} className="space-y-6 outline-none">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium">
            Übung {index + 1} von {steps.length}
          </p>
          <SampleContentBadge reviewStatus={workout.reviewStatus} />
        </div>

        <ExerciseView
          step={step}
          easier={easier.has(step.position)}
          onEasierChange={handleEasierChange}
          headingLevel="h2"
          showAmount={false}
        />

        {step.mode === 'time' ? (
          // Keyed by position: a new exercise starts with a fresh timer at full length.
          <StepTimer key={step.position} seconds={step.amount} onStarted={() => setAnnouncement('Timer gestartet')} onExpired={handleTimerExpired} />
        ) : (
          <p className="font-mono text-3xl font-semibold">{amountLabel(step)}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={handleBack} disabled={index === 0}>
          Zurück
        </Button>
        <Button ref={nextRef} type="button" onClick={handleNext}>
          {isLast ? 'Fertig' : 'Weiter'}
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/bewegung/${encodeURIComponent(workout.id)}`}>Beenden</Link>
        </Button>
      </div>

      {/* Announces the change of exercise and the timer's start and end — never every second. */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

/**
 * Countdown for one exercise (AC-9). It remembers its end point, so the number is right again
 * as soon as the page is visible after the screen was off (EC-4). Only a number, no animated
 * circles or bars (EC-6). It never moves on by itself.
 */
function StepTimer({
  seconds,
  onStarted,
  onExpired,
}: {
  seconds: number
  onStarted: () => void
  onExpired: (hadFocus: boolean) => void
}) {
  const [timer, setTimer] = useState<TimerState>(() => createTimer(seconds))
  const [now, setNow] = useState(() => Date.now())
  const buttonRef = useRef<HTMLButtonElement>(null)
  const expiredReported = useRef(false)
  const onExpiredRef = useRef(onExpired)
  const expired = isExpired(timer, now)

  useEffect(() => {
    onExpiredRef.current = onExpired
  })

  useEffect(() => {
    if (timer.status !== 'running' || expired) return
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (isExpired(timer, current) && !expiredReported.current) {
        expiredReported.current = true
        onExpiredRef.current(document.activeElement === buttonRef.current)
      }
    }
    const interval = setInterval(tick, TICK_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [timer, expired])

  function handleToggle() {
    const current = Date.now()
    setNow(current)
    if (timer.status === 'running') {
      setTimer(pause(timer, current))
      return
    }
    setTimer(start(timer, current))
    onStarted()
  }

  const label = timer.status === 'idle' ? 'Start' : timer.status === 'running' ? 'Pause' : 'Weiter zählen'

  return (
    <div className="space-y-4">
      <p className="font-mono text-5xl font-semibold tabular-nums">
        <span className="sr-only">Restzeit </span>
        <span>{formatSeconds(remainingSeconds(timer, now))}</span>
      </p>
      {expired ? (
        <p className="text-lg">Geschafft – weiter, wenn du bereit bist.</p>
      ) : (
        <Button ref={buttonRef} type="button" variant="secondary" onClick={handleToggle}>
          {label}
        </Button>
      )}
    </div>
  )
}
