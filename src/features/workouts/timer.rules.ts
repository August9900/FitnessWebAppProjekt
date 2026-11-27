/**
 * Pure timer arithmetic for the guided workout (AC-9, EC-4). A running timer remembers WHEN it
 * ends, not how many seconds are left, so the remaining time stays correct when the browser
 * throttles a background tab or the screen goes off. No IO, no framework; `now` is passed in.
 */

export type TimerState =
  | { status: 'idle'; durationMs: number }
  | { status: 'running'; durationMs: number; endsAt: number }
  | { status: 'paused'; durationMs: number; remainingMs: number }

export function createTimer(seconds: number): TimerState {
  return { status: 'idle', durationMs: seconds * 1000 }
}

export function remainingMs(timer: TimerState, now: number): number {
  switch (timer.status) {
    case 'idle':
      return timer.durationMs
    case 'paused':
      return timer.remainingMs
    case 'running':
      return Math.max(0, timer.endsAt - now)
  }
}

/** Whole seconds shown to the person; rounds up so "0" appears only at the actual end. */
export function remainingSeconds(timer: TimerState, now: number): number {
  return Math.ceil(remainingMs(timer, now) / 1000)
}

export function isExpired(timer: TimerState, now: number): boolean {
  return timer.status === 'running' && remainingMs(timer, now) === 0
}

/** "Start" from idle, or "Weiter zählen" after a pause: a new end point from the remaining time. */
export function start(timer: TimerState, now: number): TimerState {
  if (timer.status === 'running') return timer
  const left = timer.status === 'paused' ? timer.remainingMs : timer.durationMs
  return { status: 'running', durationMs: timer.durationMs, endsAt: now + left }
}

/** "Pause" freezes the remaining time. An expired timer stays expired. */
export function pause(timer: TimerState, now: number): TimerState {
  if (timer.status !== 'running' || isExpired(timer, now)) return timer
  return { status: 'paused', durationMs: timer.durationMs, remainingMs: remainingMs(timer, now) }
}

/** "0:45" / "2:00". */
export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
