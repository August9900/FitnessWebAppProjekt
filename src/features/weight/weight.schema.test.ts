import { WEIGHT_MESSAGES, validateWeightEntry } from './weight.schema'

const today = '2026-11-25'

describe('Eintrag prüfen (AC-5, EC-5)', () => {
  it('nimmt einen gültigen neuen Eintrag', () => {
    expect(validateWeightEntry({ date: '2026-11-25', weight: '72,4' }, today)).toEqual({
      ok: true,
      value: { date: '2026-11-25', weightKg: 72.4, previousDate: null, replace: false },
    })
  })

  it('übernimmt beim Ändern das bisherige Datum und „Ersetzen“ (AC-6, AC-11)', () => {
    expect(validateWeightEntry({ date: '2026-11-20', weight: '71', previousDate: '2026-11-21', replace: true }, today)).toEqual({
      ok: true,
      value: { date: '2026-11-20', weightKg: 71, previousDate: '2026-11-21', replace: true },
    })
  })

  it('„Ersetzen“ gilt nur bei echtem true', () => {
    const result = validateWeightEntry({ date: '2026-11-25', weight: '72', replace: 'true' }, today)
    expect(result.ok && result.value.replace).toBe(false)
  })

  it.each([
    [{ date: '2026-11-25', weight: '' }, { weight: WEIGHT_MESSAGES.weightMissing }],
    [{ date: '2026-11-25', weight: '72,45' }, { weight: WEIGHT_MESSAGES.weightFormat }],
    [{ date: '2026-11-25', weight: '29,9' }, { weight: WEIGHT_MESSAGES.weightRange }],
    [{ date: '', weight: '72' }, { date: WEIGHT_MESSAGES.dateMissing }],
    [{ date: '2026-02-30', weight: '72' }, { date: WEIGHT_MESSAGES.dateMissing }],
    [{ date: '2026-11-26', weight: '72' }, { date: WEIGHT_MESSAGES.dateFuture }],
    [{ date: '2026-11-26', weight: '' }, { date: WEIGHT_MESSAGES.dateFuture, weight: WEIGHT_MESSAGES.weightMissing }],
    [{ date: '2026-11-20', weight: '72', previousDate: 'gestern' }, { date: WEIGHT_MESSAGES.dateMissing }],
  ])('%o → %o', (input, errors) => {
    expect(validateWeightEntry(input, today)).toEqual({ ok: false, errors })
  })

  it('lehnt Unsinn ohne Absturz ab', () => {
    expect(validateWeightEntry(null, today)).toEqual({
      ok: false,
      errors: { date: WEIGHT_MESSAGES.dateMissing, weight: WEIGHT_MESSAGES.weightMissing },
    })
  })
})
