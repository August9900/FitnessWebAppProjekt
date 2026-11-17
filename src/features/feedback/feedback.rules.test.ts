import {
  EFFORT_LABELS,
  QUESTION_TITLES,
  SUGGEST_AGAIN_LABELS,
  adjustmentNote,
  dislikedIds,
  intensityShift,
  type FeedbackSignalRow,
} from './feedback.rules'

const now = new Date('2026-11-17T20:00:00Z')
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 3600_000)

const row = (overrides: Partial<FeedbackSignalRow>): FeedbackSignalRow => ({
  itemId: 'w_a',
  effort: null,
  effortAt: null,
  suggestAgain: null,
  suggestAgainAt: null,
  ...overrides,
})

describe('Fragen und Antworten (AC-1)', () => {
  it('beschriftet die zwei Fragen und ihre Antworten wie in der Spec', () => {
    expect(QUESTION_TITLES).toEqual({ effort: 'Wie war der Aufwand?', suggestAgain: 'Wieder vorschlagen?' })
    expect(Object.values(EFFORT_LABELS)).toEqual(['Zu wenig', 'Passte', 'Zu viel'])
    expect(Object.values(SUGGEST_AGAIN_LABELS)).toEqual(['Gern wieder', 'Lieber nicht'])
  })
})

describe('dislikedIds (AC-9, AC-10, EC-6)', () => {
  it('liefert Inhalte mit „Lieber nicht“', () => {
    expect(
      dislikedIds([
        row({ itemId: 'w_a', suggestAgain: 'no', suggestAgainAt: daysAgo(3) }),
        row({ itemId: 'w_b', suggestAgain: 'yes', suggestAgainAt: daysAgo(3) }),
        row({ itemId: 'w_c', effort: 'too_much', effortAt: daysAgo(1) }),
      ])
    ).toEqual(['w_a'])
  })

  it('lässt je Inhalt die zuletzt gespeicherte Antwort gelten — ein späteres „Gern wieder“ hebt „Lieber nicht“ auf', () => {
    expect(
      dislikedIds([
        row({ itemId: 'w_a', suggestAgain: 'no', suggestAgainAt: daysAgo(10) }),
        row({ itemId: 'w_a', suggestAgain: 'yes', suggestAgainAt: daysAgo(2) }),
      ])
    ).toEqual([])
    expect(
      dislikedIds([
        row({ itemId: 'w_a', suggestAgain: 'no', suggestAgainAt: daysAgo(1) }),
        row({ itemId: 'w_a', suggestAgain: 'yes', suggestAgainAt: daysAgo(9) }),
      ])
    ).toEqual(['w_a'])
  })

  it('gilt unbefristet, auch nach langer Zeit', () => {
    expect(dislikedIds([row({ itemId: 'w_a', suggestAgain: 'no', suggestAgainAt: daysAgo(400) })])).toEqual(['w_a'])
  })

  it('liefert ohne Rückmeldungen nichts', () => {
    expect(dislikedIds([])).toEqual([])
  })
})

describe('intensityShift (AC-11 bis AC-13, EC-8)', () => {
  it('verschiebt nach „Zu viel“ eine Stufe sanfter und nach „Zu wenig“ eine Stufe kräftiger', () => {
    expect(intensityShift([row({ effort: 'too_much', effortAt: daysAgo(1) })], now)).toBe(-1)
    expect(intensityShift([row({ effort: 'too_little', effortAt: daysAgo(1) })], now)).toBe(1)
    expect(intensityShift([row({ effort: 'just_right', effortAt: daysAgo(1) })], now)).toBe(0)
  })

  it('wirkt höchstens 14 Tage ab dem Speicherzeitpunkt', () => {
    expect(intensityShift([row({ effort: 'too_much', effortAt: daysAgo(14) })], now)).toBe(-1)
    expect(intensityShift([row({ effort: 'too_much', effortAt: daysAgo(14.01) })], now)).toBe(0)
  })

  it('lässt nur die zuletzt gespeicherte Aufwand-Rückmeldung zählen', () => {
    expect(
      intensityShift(
        [
          row({ itemId: 'w_a', effort: 'too_much', effortAt: daysAgo(5) }),
          row({ itemId: 'w_b', effort: 'just_right', effortAt: daysAgo(2) }),
        ],
        now
      )
    ).toBe(0)
    expect(
      intensityShift(
        [
          row({ itemId: 'w_a', effort: 'too_little', effortAt: daysAgo(1) }),
          row({ itemId: 'w_b', effort: 'too_much', effortAt: daysAgo(6) }),
        ],
        now
      )
    ).toBe(1)
  })

  it('ignoriert Zeilen ohne Aufwand und liefert ohne Rückmeldung keine Verschiebung', () => {
    expect(intensityShift([row({ suggestAgain: 'no', suggestAgainAt: daysAgo(1) })], now)).toBe(0)
    expect(intensityShift([], now)).toBe(0)
  })
})

describe('adjustmentNote (AC-15)', () => {
  it('erklärt die Richtung der Verschiebung und schweigt ohne Verschiebung', () => {
    expect(adjustmentNote(-1)).toBe('Etwas sanfter, weil es letztes Mal zu viel war.')
    expect(adjustmentNote(1)).toBe('Etwas kräftiger, weil es letztes Mal zu wenig war.')
    expect(adjustmentNote(0)).toBeNull()
  })
})
