/**
 * Input validation for the PROJ-6 server actions (SEC-02). The server validates every input on
 * its own, independent of what the browser sends. Pure: Zod and rule constants only.
 */
import { z } from 'zod'
import { PLACES } from '@/features/profile/profile.schema'
import { EFFORTS } from '@/features/meals/meals.rules'
import { ENERGIES, MINUTES_OPTIONS } from './today.rules'

const CONTENT_ID = /^[a-z0-9_]{3,40}$/

/** Bewegen: time, energy and place (AC-2). Unknown keys are refused. */
export const moveCheckInSchema = z.strictObject({
  kind: z.literal('move'),
  minutes: z.literal(MINUTES_OPTIONS),
  energy: z.enum(ENERGIES),
  place: z.enum(PLACES),
})

/** Essen: only the effort (AC-3). */
export const eatCheckInSchema = z.strictObject({
  kind: z.literal('eat'),
  effort: z.enum(EFFORTS),
})

export const checkInSchema = z.discriminatedUnion('kind', [moveCheckInSchema, eatCheckInSchema])

/** "Los geht's" / "Das mach ich" / "Stattdessen das": which item of which check-in (AC-12). */
export const startActionSchema = z.strictObject({
  checkInId: z.uuid(),
  itemId: z.string().regex(CONTENT_ID),
})

/** "Geschafft" or "Heute nicht" (AC-14). */
export const concludeActionSchema = z.strictObject({
  actionId: z.uuid(),
  status: z.enum(['done', 'skipped']),
})

/** "Rückgängig" (AC-15). */
export const undoConclusionSchema = z.strictObject({
  actionId: z.uuid(),
})
