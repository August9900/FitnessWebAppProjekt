'use server'

// PROJ-7 server action. Checks the session and validates the input on the server; the database
// checks once more that the action is the person's own, marked "done", and still on the
// confirmation card (AC-16). Returns a result instead of throwing; failures are logged with the
// action name and a database code only — no answers, no user id (EC-3).
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/features/account/account.data'
import { saveFeedbackAnswer } from './feedback.data'
import { saveFeedbackSchema } from './feedback.schema'

const TODAY_PATH = '/heute'

/**
 * "not_possible": the card is no longer valid — "Rückgängig" or a new check-in, perhaps on
 * another device. Nothing was saved; "Heute" is refreshed to show the actual state (EC-4).
 */
export type SaveFeedbackResult = { ok: true } | { ok: false; reason: 'not_possible' | 'invalid' | 'failed' }

/** One tap on one answer (AC-3, AC-6): saved right away, replacing the earlier answer to that question. */
export async function saveFeedback(input: unknown): Promise<SaveFeedbackResult> {
  const user = await requireUser()
  const parsed = saveFeedbackSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid' }
  const { actionId, question, value } = parsed.data

  try {
    const outcome = await saveFeedbackAnswer(user.id, actionId, question, value)
    if (outcome === 'not_possible') {
      revalidatePath(TODAY_PATH)
      return { ok: false, reason: 'not_possible' }
    }
    return { ok: true }
  } catch (error) {
    console.error('[feedback] saveFeedback failed', { reason: error instanceof Error ? error.message : 'unknown' })
    return { ok: false, reason: 'failed' }
  }
}
