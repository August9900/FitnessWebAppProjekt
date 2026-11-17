import { saveFeedbackSchema } from './feedback.schema'

const ACTION_ID = '33333333-3333-4333-8333-333333333333'

describe('saveFeedbackSchema (AC-3, AC-16)', () => {
  it('nimmt je Frage genau ihre Antworten an', () => {
    for (const value of ['too_little', 'just_right', 'too_much']) {
      expect(saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'effort', value }).success).toBe(true)
    }
    for (const value of ['yes', 'no']) {
      expect(saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'suggestAgain', value }).success).toBe(true)
    }
  })

  it('lehnt Antworten der anderen Frage, unbekannte Werte und Fragen ab', () => {
    expect(saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'effort', value: 'no' }).success).toBe(false)
    expect(saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'suggestAgain', value: 'too_much' }).success).toBe(false)
    expect(saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'effort', value: 'mittel' }).success).toBe(false)
    expect(saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'mood', value: 'yes' }).success).toBe(false)
  })

  it('verlangt eine gültige Aktions-ID und lehnt zusätzliche Felder ab', () => {
    expect(saveFeedbackSchema.safeParse({ actionId: 'x', question: 'effort', value: 'too_much' }).success).toBe(false)
    expect(saveFeedbackSchema.safeParse({ question: 'effort', value: 'too_much' }).success).toBe(false)
    expect(
      saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'effort', value: 'too_much', userId: 'u2' }).success
    ).toBe(false)
    expect(
      saveFeedbackSchema.safeParse({ actionId: ACTION_ID, question: 'effort', value: 'too_much', effortAt: '2020-01-01' })
        .success
    ).toBe(false)
  })
})
