import {
  DEFAULT_TIME_ZONE,
  addDays,
  buildWeek,
  dayLabel,
  localDate,
  mondayOf,
  parseDateParam,
  queryRange,
  rangeLabel,
  resolveTimeZone,
  resolveWeek,
  type WeekActionInput,
} from './week.rules'

const BERLIN = 'Europe/Berlin'
const LISBON = 'Europe/Lisbon'
const HELSINKI = 'Europe/Helsinki'

// Tuesday, 24 Nov 2026, 10:00 UTC. Current week: Mon 23 – Sun 29 Nov.
const now = new Date('2026-11-24T10:00:00Z')
const created = new Date('2026-10-01T08:00:00Z') // Thursday → first week starts Mon 28 Sep.

const action = (overrides: Partial<WeekActionInput>): WeekActionInput => ({
  id: crypto.randomUUID(),
  kind: 'move',
  itemId: 'morgen_mobil_5',
  status: 'done',
  startedAt: new Date('2026-11-23T08:00:00Z'),
  title: 'Morgens mobil',
  ...overrides,
})

const window = (param?: string, timeZone = BERLIN) => resolveWeek({ param, now, timeZone, accountCreatedAt: created })

describe('Zeitzone (EC-2)', () => {
  it('nimmt eine bekannte Zeitzone und fällt sonst auf deutsche Zeit zurück', () => {
    expect(resolveTimeZone(LISBON)).toBe(LISBON)
    expect(resolveTimeZone('Mars/Olympus')).toBe(DEFAULT_TIME_ZONE)
    expect(resolveTimeZone('Europe/Berlin<script>')).toBe(DEFAULT_TIME_ZONE)
    expect(resolveTimeZone(undefined)).toBe(DEFAULT_TIME_ZONE)
    expect(resolveTimeZone('x'.repeat(65))).toBe(DEFAULT_TIME_ZONE)
  })

  it('bestimmt das Ortsdatum eines Zeitpunkts, auch nahe Mitternacht', () => {
    const lateUtc = new Date('2026-11-22T23:30:00Z') // Sun 23:30 in Lisbon, Mon 00:30 in Berlin
    expect(localDate(lateUtc, LISBON)).toBe('2026-11-22')
    expect(localDate(lateUtc, BERLIN)).toBe('2026-11-23')
    expect(localDate(new Date('2026-11-23T22:30:00Z'), HELSINKI)).toBe('2026-11-24')
  })

  it('beachtet Sommer- und Winterzeit', () => {
    // 29 Mar 2026: Berlin switches to UTC+2. 22:30 UTC is 00:30 local on the 30th.
    expect(localDate(new Date('2026-03-29T22:30:00Z'), BERLIN)).toBe('2026-03-30')
    // 25 Oct 2026: back to UTC+1. 22:30 UTC is 23:30 local, still the 25th.
    expect(localDate(new Date('2026-10-25T22:30:00Z'), BERLIN)).toBe('2026-10-25')
  })
})

describe('Kalenderdaten', () => {
  it('findet den Montag einer Woche und rechnet über Monats- und Jahresgrenzen', () => {
    expect(mondayOf('2026-11-29')).toBe('2026-11-23')
    expect(mondayOf('2026-11-23')).toBe('2026-11-23')
    expect(mondayOf('2027-01-01')).toBe('2026-12-28')
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('liest nur echte Daten im Format JJJJ-MM-TT', () => {
    expect(parseDateParam('2026-11-17')).toBe('2026-11-17')
    expect(parseDateParam('2026-02-30')).toBeNull()
    expect(parseDateParam('2026-11-17T00:00')).toBeNull()
    expect(parseDateParam('17.11.2026')).toBeNull()
    expect(parseDateParam(['2026-11-17'])).toBeNull()
    expect(parseDateParam(undefined)).toBeNull()
  })

  it('liest einen Tag Puffer vor und nach der Woche', () => {
    expect(queryRange('2026-11-23')).toEqual({
      from: new Date('2026-11-22T00:00:00Z'),
      to: new Date('2026-12-01T00:00:00Z'),
    })
  })
})

describe('Welche Woche (AC-1, AC-12 bis AC-15)', () => {
  it('zeigt ohne Angabe die laufende Woche mit heute', () => {
    expect(window()).toEqual({ monday: '2026-11-23', currentMonday: '2026-11-23', earliestMonday: '2026-09-28', today: '2026-11-24' })
  })

  it('nimmt jedes gültige Datum als seine Woche', () => {
    expect(window('2026-11-19').monday).toBe('2026-11-16')
    expect(window('2026-09-28').monday).toBe('2026-09-28')
  })

  it('zeigt bei ungültiger, zukünftiger oder zu früher Woche die laufende (AC-15)', () => {
    expect(window('unsinn').monday).toBe('2026-11-23')
    expect(window('2026-11-30').monday).toBe('2026-11-23')
    expect(window('2026-09-27').monday).toBe('2026-11-23')
  })

  it('bestimmt „heute“ und die laufende Woche in der Zeitzone der Person', () => {
    const sundayNight = new Date('2026-11-29T23:30:00Z') // Mon 30 Nov in Berlin, Sun 29 Nov in Lisbon
    expect(resolveWeek({ param: undefined, now: sundayNight, timeZone: BERLIN, accountCreatedAt: created }).monday).toBe('2026-11-30')
    expect(resolveWeek({ param: undefined, now: sundayNight, timeZone: LISBON, accountCreatedAt: created }).monday).toBe('2026-11-23')
  })
})

describe('Woche aufbauen (AC-1 bis AC-6, EC-2, EC-6)', () => {
  it('liefert sieben Tage Montag bis Sonntag mit Datum und markiert heute', () => {
    const week = buildWeek(window(), [], BERLIN)
    expect(week.days.map((day) => day.label)).toEqual(['Mo 23.', 'Di 24.', 'Mi 25.', 'Do 26.', 'Fr 27.', 'Sa 28.', 'So 29.'])
    expect(week.days.filter((day) => day.isToday).map((day) => day.date)).toEqual(['2026-11-24'])
  })

  it('ordnet Aktionen dem Tag ihres Beginns zu, mit Titel, Art, Zustand und Link, nach Beginn sortiert', () => {
    const week = buildWeek(
      window(),
      [
        action({ id: 'b', startedAt: new Date('2026-11-25T17:00:00Z'), status: 'started', kind: 'eat', itemId: 'hummus_brot', title: 'Brot mit Hummus' }),
        action({ id: 'a', startedAt: new Date('2026-11-25T07:00:00Z') }),
      ],
      BERLIN
    )
    expect(week.days[2].entries).toEqual([
      { id: 'a', kindLabel: 'Bewegen', title: 'Morgens mobil', href: '/bewegung/morgen_mobil_5', statusLabel: 'geschafft' },
      { id: 'b', kindLabel: 'Essen', title: 'Brot mit Hummus', href: '/essen/hummus_brot', statusLabel: 'angefangen' },
    ])
  })

  it('lässt „heute nicht“ weg (AC-5) und zeigt alte, nie markierte Aktionen als „angefangen“ (AC-6, EC-6)', () => {
    const week = buildWeek(
      window(),
      [action({ status: 'skipped' }), action({ id: 'old', status: 'started', startedAt: new Date('2026-11-23T06:00:00Z') })],
      BERLIN
    )
    expect(week.days[0].entries.map((entry) => [entry.id, entry.statusLabel])).toEqual([['old', 'angefangen']])
  })

  it('stellt eine Aktion kurz vor Mitternacht an den Tag ihres Beginns, auch über die Wochengrenze (EC-2)', () => {
    const lateSunday = action({ id: 'late', startedAt: new Date('2026-11-22T22:30:00Z') }) // Sun 23:30 Berlin
    const thisWeek = buildWeek(window(), [lateSunday], BERLIN)
    expect(thisWeek.days.flatMap((day) => day.entries)).toEqual([])
    const lastWeek = buildWeek(window('2026-11-16'), [lateSunday], BERLIN)
    expect(lastWeek.days[6].entries.map((entry) => entry.id)).toEqual(['late'])
  })

  it('ordnet nach der Zeitzone der Person (Lissabon und Helsinki)', () => {
    const instant = new Date('2026-11-23T23:30:00Z') // Mon 23:30 Lisbon, Tue 01:30 Helsinki
    expect(buildWeek(window(undefined, LISBON), [action({ startedAt: instant })], LISBON).days[0].entries).toHaveLength(1)
    expect(buildWeek(window(undefined, HELSINKI), [action({ startedAt: instant })], HELSINKI).days[1].entries).toHaveLength(1)
  })

  it('zeigt bei nicht mehr angebotenem Inhalt den Ersatztitel ohne Link (EC-1)', () => {
    const week = buildWeek(window(), [action({ title: null })], BERLIN)
    expect(week.days[0].entries[0]).toMatchObject({ title: 'Dein Workout', href: null })
  })
})

describe('Überschrift und Überblick (AC-1, AC-9 bis AC-12)', () => {
  it('benennt die laufende und die vorige Woche, ältere nur mit dem Datumsbereich', () => {
    expect(buildWeek(window(), [], BERLIN)).toMatchObject({ heading: 'Diese Woche', range: '23.–29. Nov.', isCurrent: true })
    expect(buildWeek(window('2026-11-16'), [], BERLIN)).toMatchObject({ heading: 'Vorige Woche', range: '16.–22. Nov.' })
    expect(buildWeek(window('2026-10-26'), [], BERLIN)).toMatchObject({ heading: null, range: '26. Okt.–1. Nov.' })
  })

  it('schreibt Jahre dazu, wenn die Woche über ein Jahr reicht oder in einem anderen liegt', () => {
    expect(rangeLabel('2026-12-28', '2026-12-28')).toBe('28. Dez. 2026 – 3. Jan. 2027')
    expect(rangeLabel('2026-11-23', '2027-02-01')).toBe('23. Nov. 2026 – 29. Nov. 2026')
    expect(dayLabel('2027-01-03')).toBe('So 3.')
  })

  it('zeigt den Überblickssatz nur, wenn etwas geschafft wurde — ohne Zahl', () => {
    expect(buildWeek(window(), [action({})], BERLIN).summary).toBe('Diese Woche hast du etwas für dich getan.')
    expect(buildWeek(window('2026-11-16'), [action({ startedAt: new Date('2026-11-17T08:00:00Z') })], BERLIN).summary).toBe(
      'In dieser Woche hast du etwas für dich getan.'
    )
    expect(buildWeek(window(), [action({ status: 'started' })], BERLIN).summary).toBeNull()
    expect(buildWeek(window(), [], BERLIN).summary).toBeNull()
  })

  it('zeigt den Leer-Hinweis nur in der laufenden Woche ohne Eintrag (AC-11)', () => {
    expect(buildWeek(window(), [], BERLIN).showEmptyHint).toBe(true)
    expect(buildWeek(window(), [action({ status: 'started' })], BERLIN).showEmptyHint).toBe(false)
    expect(buildWeek(window('2026-11-16'), [], BERLIN).showEmptyHint).toBe(false)
  })
})

describe('Blättern (AC-12 bis AC-14)', () => {
  it('bietet in der laufenden Woche nur „Vorige Woche“', () => {
    expect(buildWeek(window(), [], BERLIN)).toMatchObject({ previousHref: '/wochenblick?woche=2026-11-16', nextHref: null })
  })

  it('führt aus der vorigen Woche zurück zur laufenden ohne Parameter', () => {
    expect(buildWeek(window('2026-11-16'), [], BERLIN)).toMatchObject({
      previousHref: '/wochenblick?woche=2026-11-09',
      nextHref: '/wochenblick',
    })
  })

  it('bietet in der Woche der Kontoerstellung kein „Vorige Woche“', () => {
    expect(buildWeek(window('2026-10-01'), [], BERLIN)).toMatchObject({
      monday: '2026-09-28',
      previousHref: null,
      nextHref: '/wochenblick?woche=2026-10-05',
    })
  })
})
