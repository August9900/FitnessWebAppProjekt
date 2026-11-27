import {
  canUseWeight,
  chartPoints,
  deleteQuestion,
  entriesInRange,
  formatDate,
  formatWeight,
  isFuture,
  isIsoDate,
  newestFirst,
  parseRange,
  parseWeight,
  rangeStart,
  replaceQuestion,
  todayIn,
  weightHref,
  weightInputValue,
  weightVisible,
  type WeightEntry,
} from './weight.rules'

describe('Wer den Bereich sieht (AC-1, AC-2, AC-14)', () => {
  it.each([
    ['16_plus', true, true],
    ['16_plus', false, false],
    ['12_15', true, false],
    ['12_15', false, false],
    [null, true, false],
    [undefined, undefined, false],
  ] as const)('Altersgruppe %s, Einstellung %s → sichtbar %s', (ageBand, showWeightInNav, expected) => {
    expect(weightVisible({ ageBand, showWeightInNav })).toBe(expected)
  })

  it('nur „ab 16“ darf Gewicht überhaupt nutzen', () => {
    expect(canUseWeight('16_plus')).toBe(true)
    expect(canUseWeight('12_15')).toBe(false)
    expect(canUseWeight(undefined)).toBe(false)
  })
})

describe('Gewicht lesen (AC-4, AC-5)', () => {
  it.each([
    ['72,4', 72.4],
    ['72.4', 72.4],
    ['72', 72],
    [' 30 ', 30],
    ['300,0', 300],
    ['30,0', 30],
  ])('„%s“ → %s kg', (text, kg) => {
    expect(parseWeight(text)).toEqual({ ok: true, weightKg: kg })
  })

  it.each([
    ['', 'missing'],
    ['   ', 'missing'],
    [undefined, 'missing'],
    ['72,45', 'format'],
    ['72,', 'format'],
    ['abc', 'format'],
    ['-72', 'format'],
    ['1e2', 'format'],
    ['72,4 kg', 'format'],
    ['29,9', 'range'],
    ['300,1', 'range'],
    ['999', 'range'],
  ])('„%s“ → %s', (text, reason) => {
    expect(parseWeight(text)).toEqual({ ok: false, reason })
  })
})

describe('Anzeige (AC-9)', () => {
  it('immer mit einer Nachkommastelle und Komma', () => {
    expect(formatWeight(72.4)).toBe('72,4 kg')
    expect(formatWeight(72)).toBe('72,0 kg')
    expect(formatWeight(100.5)).toBe('100,5 kg')
    expect(weightInputValue(72)).toBe('72,0')
  })

  it('Datum ausgeschrieben, unabhängig von der Zeitzone des Servers', () => {
    expect(formatDate('2026-11-25')).toBe('25. November 2026')
    expect(formatDate('2026-03-01')).toBe('1. März 2026')
  })

  it('Fragen nennen Wert und Datum', () => {
    expect(replaceQuestion(72.4)).toBe('Für diesen Tag gibt es schon einen Eintrag (72,4 kg). Ersetzen?')
    expect(deleteQuestion('2026-11-25')).toBe('Eintrag vom 25. November 2026 löschen?')
  })
})

describe('Datum und „heute“ (AC-5, EC-5)', () => {
  it('erkennt nur echte Kalendertage', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('25.11.2026')).toBe(false)
    expect(isIsoDate(undefined)).toBe(false)
  })

  it('„heute“ richtet sich nach der Zeitzone des Geräts', () => {
    const instant = new Date('2026-11-25T23:30:00Z')
    expect(todayIn('Europe/Berlin', instant)).toBe('2026-11-26')
    expect(todayIn('America/New_York', instant)).toBe('2026-11-25')
  })

  it('nur Tage nach heute liegen in der Zukunft', () => {
    expect(isFuture('2026-11-26', '2026-11-25')).toBe(true)
    expect(isFuture('2026-11-25', '2026-11-25')).toBe(false)
    expect(isFuture('2025-01-01', '2026-11-25')).toBe(false)
  })
})

describe('Zeiträume (AC-7)', () => {
  it('liest den Zeitraum aus der Adresse, Unbekanntes ist „3 Monate“', () => {
    expect(parseRange('1m')).toBe('1m')
    expect(parseRange('1j')).toBe('1j')
    expect(parseRange('5j')).toBe('3m')
    expect(parseRange(undefined)).toBe('3m')
    expect(parseRange(['1m'])).toBe('3m')
  })

  it('Adresse ohne Parameter für den Standard', () => {
    expect(weightHref()).toBe('/gewicht')
    expect(weightHref('3m')).toBe('/gewicht')
    expect(weightHref('1j')).toBe('/gewicht?zeitraum=1j')
  })

  it('beginnt am selben Tag 1, 3 oder 12 Monate früher, am Monatsende gekürzt', () => {
    expect(rangeStart('2026-11-25', '1m')).toBe('2026-10-25')
    expect(rangeStart('2026-11-25', '3m')).toBe('2026-08-25')
    expect(rangeStart('2026-11-25', '1j')).toBe('2025-11-25')
    expect(rangeStart('2026-03-31', '1m')).toBe('2026-02-28')
    expect(rangeStart('2028-03-31', '1m')).toBe('2028-02-29')
    expect(rangeStart('2026-02-15', '3m')).toBe('2025-11-15')
  })

  const entries: WeightEntry[] = [
    { date: '2026-11-25', weightKg: 72 },
    { date: '2026-08-24', weightKg: 74 },
    { date: '2026-08-25', weightKg: 73.5 },
    { date: '2026-11-01', weightKg: 72.6 },
    { date: '2026-11-26', weightKg: 99 },
  ]

  it('nimmt die Einträge des Zeitraums bis heute, älteste zuerst', () => {
    expect(entriesInRange(entries, '3m', '2026-11-25').map((entry) => entry.date)).toEqual([
      '2026-08-25',
      '2026-11-01',
      '2026-11-25',
    ])
  })

  it('die Liste zeigt alle Einträge, neueste zuerst (AC-9)', () => {
    expect(newestFirst(entries).map((entry) => entry.date)).toEqual([
      '2026-11-26',
      '2026-11-25',
      '2026-11-01',
      '2026-08-25',
      '2026-08-24',
    ])
  })
})

describe('Kurve (AC-7, AC-8)', () => {
  const box = { width: 300, height: 120, padding: 10 }

  it('braucht mindestens zwei Einträge', () => {
    expect(chartPoints([], '1m', '2026-11-25', box)).toBeNull()
    expect(chartPoints([{ date: '2026-11-25', weightKg: 72 }], '1m', '2026-11-25', box)).toBeNull()
  })

  it('verteilt die Punkte nach Datum über den Zeitraum und nach Wert in der Höhe', () => {
    const chart = chartPoints(
      [
        { date: '2026-10-25', weightKg: 74 },
        { date: '2026-11-25', weightKg: 72 },
      ],
      '1m',
      '2026-11-25',
      box
    )
    expect(chart).not.toBeNull()
    const [first, last] = chart!.points
    expect(first.x).toBeCloseTo(10)
    expect(last.x).toBeCloseTo(290)
    expect(first.y).toBeLessThan(last.y)
    expect(first.y).toBeGreaterThan(10)
    expect(last.y).toBeLessThan(110)
    expect(chart).toMatchObject({ minKg: 72, maxKg: 74, firstDate: '2026-10-25', lastDate: '2026-11-25' })
  })

  it('ein gleichbleibender Wert liegt mittig', () => {
    const chart = chartPoints(
      [
        { date: '2026-11-20', weightKg: 72 },
        { date: '2026-11-25', weightKg: 72 },
      ],
      '1m',
      '2026-11-25',
      box
    )
    expect(chart!.points.every((point) => Math.abs(point.y - 60) < 0.001)).toBe(true)
  })
})
