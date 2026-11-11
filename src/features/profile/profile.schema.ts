import { z } from 'zod'

/** Stored values (database codes) and their German labels — PROJ-3 spec AC-3 to AC-7. */
export const GOALS = ['move_more', 'fitness', 'strength', 'eat_better', 'wellbeing'] as const
export const EXPERIENCES = ['beginner', 'occasional', 'regular'] as const
export const PLACES = ['home', 'outdoors', 'gym'] as const
export const EQUIPMENT = ['mat', 'dumbbells', 'resistance_band', 'pull_up_bar', 'kettlebell', 'none'] as const
export const DIETS = ['omnivore', 'vegetarian', 'vegan'] as const

export type Goal = (typeof GOALS)[number]
export type Experience = (typeof EXPERIENCES)[number]
export type Place = (typeof PLACES)[number]
export type Equipment = (typeof EQUIPMENT)[number]
export type Diet = (typeof DIETS)[number]

/** "Nichts davon" stands alone. */
export const NO_EQUIPMENT: Equipment = 'none'

export const LABELS = {
  goal: {
    move_more: 'Mich mehr bewegen',
    fitness: 'Fitter und ausdauernder werden',
    strength: 'Kräftiger werden',
    eat_better: 'Besser essen',
    wellbeing: 'Mich insgesamt wohler fühlen',
  } satisfies Record<Goal, string>,
  experience: {
    beginner: 'Ich fange gerade an',
    occasional: 'Ich bewege mich ab und zu',
    regular: 'Ich trainiere regelmäßig',
  } satisfies Record<Experience, string>,
  places: {
    home: 'Zuhause',
    outdoors: 'Draußen',
    gym: 'Fitnessstudio',
  } satisfies Record<Place, string>,
  homeEquipment: {
    mat: 'Matte',
    dumbbells: 'Kurzhanteln',
    resistance_band: 'Widerstandsband',
    pull_up_bar: 'Klimmzugstange',
    kettlebell: 'Kettlebell',
    none: 'Nichts davon',
  } satisfies Record<Equipment, string>,
  diet: {
    omnivore: 'Ich esse alles',
    vegetarian: 'Vegetarisch',
    vegan: 'Vegan',
  } satisfies Record<Diet, string>,
} as const

export const MESSAGES = {
  goal: 'Bitte wähle ein Ziel.',
  experience: 'Bitte wähle aus, was am ehesten passt.',
  places: 'Bitte wähle mindestens einen Ort.',
  homeEquipment: 'Bitte wähle aus, was du zuhause hast – oder „Nichts davon“.',
  noneAlone: '„Nichts davon“ lässt sich nicht mit anderen Dingen kombinieren.',
  diet: 'Bitte wähle deine Essensweise.',
  equipmentWithoutHome: 'Die Ausstattung zuhause gilt nur, wenn du „Zuhause“ als Ort gewählt hast.',
} as const

const distinct = <T,>(values: T[]) => new Set(values).size === values.length

export const goalSchema = z.enum(GOALS, { error: MESSAGES.goal })
export const experienceSchema = z.enum(EXPERIENCES, { error: MESSAGES.experience })
export const dietSchema = z.enum(DIETS, { error: MESSAGES.diet })

export const placesSchema = z
  .array(z.enum(PLACES, { error: MESSAGES.places }), { error: MESSAGES.places })
  .min(1, { error: MESSAGES.places })
  .refine(distinct, { error: MESSAGES.places })

export const homeEquipmentSchema = z
  .array(z.enum(EQUIPMENT, { error: MESSAGES.homeEquipment }), { error: MESSAGES.homeEquipment })
  .min(1, { error: MESSAGES.homeEquipment })
  .refine(distinct, { error: MESSAGES.homeEquipment })
  .refine((values) => !values.includes(NO_EQUIPMENT) || values.length === 1, { error: MESSAGES.noneAlone })

/** One answer from the onboarding (one question per step). */
export const answerSchema = z.discriminatedUnion('question', [
  z.object({ question: z.literal('goal'), value: goalSchema }),
  z.object({ question: z.literal('experience'), value: experienceSchema }),
  z.object({ question: z.literal('places'), value: placesSchema }),
  z.object({ question: z.literal('homeEquipment'), value: homeEquipmentSchema }),
  z.object({ question: z.literal('diet'), value: dietSchema }),
])

export type AnswerInput = z.input<typeof answerSchema>
export type Answer = z.output<typeof answerSchema>
export type QuestionKey = Answer['question']

/**
 * The complete answers from the profile form. Equipment is required with "home" and dropped
 * without it (AC-14), so a saved profile is always complete.
 */
export const profileAnswersSchema = z
  .object({
    goal: goalSchema,
    experience: experienceSchema,
    places: placesSchema,
    homeEquipment: homeEquipmentSchema.nullish(),
    diet: dietSchema,
  })
  .superRefine((value, ctx) => {
    if (value.places.includes('home') && !value.homeEquipment) {
      ctx.addIssue({ code: 'custom', path: ['homeEquipment'], message: MESSAGES.homeEquipment })
    }
  })
  .transform((value) => ({
    ...value,
    homeEquipment: value.places.includes('home') ? (value.homeEquipment ?? null) : null,
  }))

export type ProfileAnswersInput = z.input<typeof profileAnswersSchema>
export type CompleteProfileAnswers = z.output<typeof profileAnswersSchema>

/** Field name → first error message, for showing errors at the question. */
export function fieldErrorsOf(error: z.ZodError): Partial<Record<string, string>> {
  const result: Partial<Record<string, string>> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] === 'value' ? 'value' : (issue.path[0] ?? 'form'))
    if (!result[key]) result[key] = issue.message
  }
  return result
}
