export {}

const requireUser = vi.fn()
vi.mock('@/features/account/account.data', () => ({ requireUser }))

const saveFeedbackAnswer = vi.fn()
vi.mock('./feedback.data', () => ({ saveFeedbackAnswer }))

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath }))

const { saveFeedback } = await import('./feedback.actions')

const ACTION_ID = '33333333-3333-4333-8333-333333333333'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  requireUser.mockResolvedValue({ id: 'u1', email: 'a@b.de', created_at: 'c', last_sign_in_at: null })
  saveFeedbackAnswer.mockResolvedValue('saved')
})

describe('saveFeedback (AC-3, AC-6, AC-7, AC-16, EC-3, EC-4)', () => {
  it('verlangt eine Sitzung, bevor etwas gespeichert wird', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT:/anmelden'))
    await expect(saveFeedback({ actionId: ACTION_ID, question: 'effort', value: 'too_much' })).rejects.toThrow('REDIRECT')
    expect(saveFeedbackAnswer).not.toHaveBeenCalled()
  })

  it('speichert die Antwort für die eigene Person, ohne „Heute“ neu zu laden', async () => {
    expect(await saveFeedback({ actionId: ACTION_ID, question: 'suggestAgain', value: 'no' })).toEqual({ ok: true })
    expect(saveFeedbackAnswer).toHaveBeenCalledWith('u1', ACTION_ID, 'suggestAgain', 'no')
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('lehnt ungültige Eingaben ab, ohne zu speichern', async () => {
    for (const input of [
      { actionId: ACTION_ID, question: 'effort', value: 'no' },
      { actionId: 'x', question: 'effort', value: 'too_much' },
      { actionId: ACTION_ID, question: 'effort', value: 'too_much', userId: 'u2' },
      null,
    ]) {
      expect(await saveFeedback(input)).toEqual({ ok: false, reason: 'invalid' })
    }
    expect(saveFeedbackAnswer).not.toHaveBeenCalled()
  })

  it('meldet „nicht mehr möglich“ und aktualisiert „Heute“, wenn die Karte nicht mehr gilt (EC-4)', async () => {
    saveFeedbackAnswer.mockResolvedValue('not_possible')
    expect(await saveFeedback({ actionId: ACTION_ID, question: 'effort', value: 'too_much' })).toEqual({
      ok: false,
      reason: 'not_possible',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/heute')
  })

  it('meldet „fehlgeschlagen“ und protokolliert ohne Antwort oder Nutzer-ID (EC-3)', async () => {
    saveFeedbackAnswer.mockRejectedValue(new Error('Feedback could not be saved (08006).'))
    expect(await saveFeedback({ actionId: ACTION_ID, question: 'effort', value: 'too_much' })).toEqual({
      ok: false,
      reason: 'failed',
    })
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain('saveFeedback')
    expect(logged).not.toMatch(/u1|too_much/)
  })
})
