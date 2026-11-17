/**
 * Input validation for the PROJ-7 server action (SEC-02): one answer to one question of one
 * action. The server validates independently of what the browser sends. Pure: Zod and rules only.
 */
import { z } from 'zod'
import { EFFORT_RATINGS, SUGGEST_AGAIN_ANSWERS } from './feedback.rules'

/** Each question accepts only its own answers (AC-3); unknown keys are refused. */
export const saveFeedbackSchema = z.discriminatedUnion('question', [
  z.strictObject({
    actionId: z.uuid(),
    question: z.literal('effort'),
    value: z.enum(EFFORT_RATINGS),
  }),
  z.strictObject({
    actionId: z.uuid(),
    question: z.literal('suggestAgain'),
    value: z.enum(SUGGEST_AGAIN_ANSWERS),
  }),
])

export type SaveFeedbackInput = z.infer<typeof saveFeedbackSchema>
