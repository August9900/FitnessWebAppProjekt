/**
 * Pure rules for the PROJ-3 answers: which questions are asked, which one is open, when the
 * answers are complete. No IO, no framework.
 */
import type { Diet, Equipment, Experience, Goal, Place, QuestionKey } from './profile.schema'

export type ProfileAnswers = {
  goal: Goal | null
  experience: Experience | null
  places: Place[] | null
  homeEquipment: Equipment[] | null
  diet: Diet | null
}

export const EMPTY_ANSWERS: ProfileAnswers = {
  goal: null,
  experience: null,
  places: null,
  homeEquipment: null,
  diet: null,
}

/** The questions asked for these answers, in order. Equipment only with "home" (AC-6, AC-11). */
export function questionsFor(answers: ProfileAnswers): QuestionKey[] {
  const withHome = answers.places?.includes('home') ?? false
  return withHome
    ? ['goal', 'experience', 'places', 'homeEquipment', 'diet']
    : ['goal', 'experience', 'places', 'diet']
}

export function isAnswered(answers: ProfileAnswers, question: QuestionKey): boolean {
  const value = answers[question]
  return Array.isArray(value) ? value.length > 0 : value != null
}

/** Where the onboarding continues after an interruption (EC-1); null when nothing is open. */
export function firstOpenQuestion(answers: ProfileAnswers): QuestionKey | null {
  return questionsFor(answers).find((question) => !isAnswered(answers, question)) ?? null
}

/** Complete answers open the areas (AC-1) and close the onboarding for good (AC-9, EC-4). */
export function isComplete(answers: ProfileAnswers): boolean {
  return firstOpenQuestion(answers) === null
}

/** Without "home" there is no equipment at home (AC-14). */
export function normalizeAnswers(answers: ProfileAnswers): ProfileAnswers {
  return answers.places?.includes('home') ? answers : { ...answers, homeEquipment: null }
}

/** The answers after one question was answered — the same cleanup the server applies. */
export function applyAnswer<Q extends QuestionKey>(
  answers: ProfileAnswers,
  question: Q,
  value: ProfileAnswers[Q]
): ProfileAnswers {
  return normalizeAnswers({ ...answers, [question]: value })
}

/** Progress shown as "Frage X von Y" (AC-2). */
export function progressOf(answers: ProfileAnswers, question: QuestionKey): { current: number; total: number } {
  const questions = questionsFor(answers)
  return { current: questions.indexOf(question) + 1, total: questions.length }
}

/** Neighbouring questions for "Zurück" and "Weiter". */
export function neighboursOf(answers: ProfileAnswers, question: QuestionKey) {
  const questions = questionsFor(answers)
  const index = questions.indexOf(question)
  return {
    previous: index > 0 ? questions[index - 1] : null,
    next: index >= 0 && index < questions.length - 1 ? questions[index + 1] : null,
  }
}
