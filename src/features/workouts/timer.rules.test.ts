import { createTimer, formatSeconds, isExpired, pause, remainingMs, remainingSeconds, start } from './timer.rules'

const T0 = 1_000_000

describe('Timer (AC-9)', () => {
  it('steht vor dem Start auf voller Länge', () => {
    const timer = createTimer(30)
    expect(timer.status).toBe('idle')
    expect(remainingSeconds(timer, T0 + 99_999)).toBe(30)
    expect(isExpired(timer, T0 + 99_999)).toBe(false)
  })

  it('zählt nach dem Start herunter', () => {
    const timer = start(createTimer(30), T0)
    expect(remainingSeconds(timer, T0)).toBe(30)
    expect(remainingSeconds(timer, T0 + 10_200)).toBe(20)
    expect(remainingSeconds(timer, T0 + 29_001)).toBe(1)
    expect(isExpired(timer, T0 + 29_999)).toBe(false)
  })

  it('friert die Restzeit beim Pausieren ein und setzt sie beim Fortsetzen fort', () => {
    const paused = pause(start(createTimer(30), T0), T0 + 12_000)
    expect(paused).toEqual({ status: 'paused', durationMs: 30_000, remainingMs: 18_000 })
    expect(remainingSeconds(paused, T0 + 500_000)).toBe(18)

    const resumed = start(paused, T0 + 500_000)
    expect(remainingSeconds(resumed, T0 + 500_000)).toBe(18)
    expect(remainingSeconds(resumed, T0 + 508_000)).toBe(10)
  })

  it('ist an seinem Ende abgelaufen und fällt nicht unter null', () => {
    const timer = start(createTimer(30), T0)
    expect(isExpired(timer, T0 + 30_000)).toBe(true)
    expect(remainingMs(timer, T0 + 45_000)).toBe(0)
    expect(pause(timer, T0 + 45_000)).toBe(timer)
  })

  it('ignoriert einen zweiten Start während er läuft', () => {
    const timer = start(createTimer(30), T0)
    expect(start(timer, T0 + 5_000)).toBe(timer)
  })
})

describe('Timer im Hintergrund (EC-4)', () => {
  it('zeigt nach langer Abwesenheit die tatsächliche Restzeit bzw. das Ende', () => {
    const timer = start(createTimer(60), T0)
    // The page was hidden for 40 s: no ticks arrived meanwhile, the end point still holds.
    expect(remainingSeconds(timer, T0 + 40_000)).toBe(20)
    expect(isExpired(timer, T0 + 10 * 60_000)).toBe(true)
    expect(remainingSeconds(timer, T0 + 10 * 60_000)).toBe(0)
  })
})

describe('formatSeconds', () => {
  it('zeigt Minuten und Sekunden', () => {
    expect(formatSeconds(45)).toBe('0:45')
    expect(formatSeconds(120)).toBe('2:00')
    expect(formatSeconds(0)).toBe('0:00')
    expect(formatSeconds(-3)).toBe('0:00')
  })
})
