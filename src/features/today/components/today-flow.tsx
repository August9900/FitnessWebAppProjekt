'use client'

// The daily decision on "Heute" (PROJ-6): "Bewegen" or "Essen", then one question per screen —
// a tap answers and moves on — then one main suggestion with up to two alternatives. Answers stay
// in the browser until the suggestion is requested (AC-11); last answers are preselected and
// "Wie letztes Mal" leads straight to the suggestion (AC-5). Every server call locks the buttons
// (EC-4) and keeps the answers on failure (EC-9).
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { SampleContentBadge } from '@/components/content/sample-content-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Effort } from '@/features/meals/meals.rules'
import { EFFORTS } from '@/features/meals/meals.rules'
import type { Place } from '@/features/profile/profile.schema'
import { cn } from '@/lib/utils'
import { requestSuggestion, startAction, type SuggestionItem } from '../today.actions'
import {
  EAT_EFFORT_ANSWER_LABELS,
  ENERGIES,
  ENERGY_LABELS,
  KIND_LABELS,
  MINUTES_OPTIONS,
  PLACE_LABELS,
  TODAY_MESSAGES,
  answersSummary,
  isAnswersStillValid,
  minutesLabel,
  type CheckInAnswers,
  type EatAnswers,
  type Energy,
  type Kind,
  type Minutes,
  type MoveAnswers,
} from '../today.rules'

type Question = 'minutes' | 'energy' | 'place' | 'effort'
type Draft = { minutes?: Minutes; energy?: Energy; place?: Place; effort?: Effort }
type Suggestion = { checkInId: string; kind: Kind; fitsLine: string; items: SuggestionItem[] }

type Step =
  | { name: 'choice' }
  | { name: 'question'; kind: Kind; index: number }
  | { name: 'suggestion'; suggestion: Suggestion }

/** What the last server call left to show; the answers are kept in every case (EC-6, EC-9). */
type Problem = { kind: 'failed'; retry: () => void } | { kind: 'gone' }

const QUESTION_TITLES = {
  minutes: 'Wie viel Zeit hast du?',
  energy: 'Wie viel Energie hast du?',
  place: 'Wo bist du?',
  effort: 'Wie viel geht gerade?',
} satisfies Record<Question, string>

const START_LABELS = { move: "Los geht's", eat: 'Das mach ich' } satisfies Record<Kind, string>
const AREA_LINKS = {
  move: { href: '/bewegung', label: 'Zu Bewegung' },
  eat: { href: '/essen', label: 'Zu Essen' },
} satisfies Record<Kind, { href: string; label: string }>

function questionsOf(kind: Kind, places: Place[]): Question[] {
  if (kind === 'eat') return ['effort']
  // With only one place in the profile, the place question is skipped (AC-2).
  return places.length > 1 ? ['minutes', 'energy', 'place'] : ['minutes', 'energy']
}

function optionsOf(question: Question, places: Place[]): { value: string; label: string }[] {
  switch (question) {
    case 'minutes':
      return MINUTES_OPTIONS.map((value) => ({ value: String(value), label: minutesLabel(value) }))
    case 'energy':
      return ENERGIES.map((value) => ({ value, label: ENERGY_LABELS[value] }))
    case 'place':
      return places.map((value) => ({ value, label: PLACE_LABELS[value] }))
    case 'effort':
      return EFFORTS.map((value) => ({ value, label: EAT_EFFORT_ANSWER_LABELS[value] }))
  }
}

function withAnswer(draft: Draft, question: Question, value: string): Draft {
  if (question === 'minutes') return { ...draft, minutes: Number(value) as Minutes }
  return { ...draft, [question]: value }
}

/** Last answers as a preselection — only the ones the current profile still allows (EC-7). */
function preselectionOf(kind: Kind, last: CheckInAnswers | null, places: Place[]): Draft {
  if (kind === 'eat') return last?.kind === 'eat' ? { effort: last.effort } : {}
  const draft: Draft = places.length === 1 ? { place: places[0] } : {}
  if (last?.kind !== 'move') return draft
  return {
    minutes: last.minutes,
    energy: last.energy,
    place: places.includes(last.place) ? last.place : draft.place,
  }
}

function answersOf(kind: Kind, draft: Draft): CheckInAnswers | null {
  if (kind === 'eat') return draft.effort ? { kind: 'eat', effort: draft.effort } : null
  if (!draft.minutes || !draft.energy || !draft.place) return null
  return { kind: 'move', minutes: draft.minutes, energy: draft.energy, place: draft.place }
}

/**
 * A heading that takes the focus when its screen appears, so screen readers announce the change.
 * On the first page load nothing moves the focus (`focus` is false until the first tap).
 */
function StepHeading({
  children,
  focusKey,
  focus,
  id,
}: {
  children: ReactNode
  focusKey: string
  focus: boolean
  id?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focus) ref.current?.focus()
  }, [focusKey, focus])
  return (
    <h2 ref={ref} id={id} tabIndex={-1} className="font-display text-[28px] font-bold leading-tight outline-none">
      {children}
    </h2>
  )
}

function AnswerButton({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string
  selected: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn('min-h-14 w-full justify-between bg-card px-4 text-left', selected && 'border-2 border-primary')}
    >
      <span>{label}</span>
      {selected && <Check aria-hidden="true" className="size-5" />}
    </Button>
  )
}

export function TodayFlow({
  places,
  lastAnswers,
}: {
  /** The places from the profile, in the fixed order (`placesToAsk`). */
  places: Place[]
  lastAnswers: { move: MoveAnswers | null; eat: EatAnswers | null }
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ name: 'choice' })
  const [drafts, setDrafts] = useState<Record<Kind, Draft>>({
    move: preselectionOf('move', lastAnswers.move, places),
    eat: preselectionOf('eat', lastAnswers.eat, places),
  })
  const [problem, setProblem] = useState<Problem | null>(null)
  // Focus follows the screens only once the person has started; the first load keeps the page order.
  const [interacted, setInteracted] = useState(false)
  const [pending, startTransition] = useTransition()
  // After a successful start the page is left; nothing may be tapped in the meantime (EC-4).
  const [leaving, setLeaving] = useState(false)
  const busy = pending || leaving

  function request(answers: CheckInAnswers) {
    if (busy) return
    setProblem(null)
    startTransition(async () => {
      const result = await requestSuggestion(answers)
      if (!result.ok) {
        setProblem({ kind: 'failed', retry: () => request(answers) })
        return
      }
      setStep({ name: 'suggestion', suggestion: result })
    })
  }

  function start(suggestion: Suggestion, item: SuggestionItem) {
    if (busy) return
    setProblem(null)
    startTransition(async () => {
      const result = await startAction({ checkInId: suggestion.checkInId, itemId: item.id })
      if (result.ok) {
        setLeaving(true)
        router.push(result.href)
        return
      }
      if (result.reason === 'gone') setProblem({ kind: 'gone' })
      else setProblem({ kind: 'failed', retry: () => start(suggestion, item) })
    })
  }

  /** "Wie letztes Mal": the last answers become the current ones and go straight to the suggestion (AC-5). */
  function repeat(answers: CheckInAnswers) {
    if (busy) return
    const { kind, ...values } = answers
    setDrafts((current) => ({ ...current, [kind]: values }))
    request(answers)
  }

  function choose(kind: Kind) {
    setInteracted(true)
    setProblem(null)
    setStep({ name: 'question', kind, index: 0 })
  }

  function answer(kind: Kind, index: number, question: Question, value: string) {
    if (busy) return
    const draft = withAnswer(drafts[kind], question, value)
    setDrafts((current) => ({ ...current, [kind]: draft }))
    const questions = questionsOf(kind, places)
    if (index + 1 < questions.length) {
      setStep({ name: 'question', kind, index: index + 1 })
      return
    }
    const answers = answersOf(kind, draft)
    if (answers) request(answers)
  }

  function back() {
    setProblem(null)
    if (step.name === 'question') {
      setStep(step.index > 0 ? { name: 'question', kind: step.kind, index: step.index - 1 } : { name: 'choice' })
    } else if (step.name === 'suggestion') {
      const kind = step.suggestion.kind
      setStep({ name: 'question', kind, index: questionsOf(kind, places).length - 1 })
    }
  }

  const problemView = problem && (
    <Alert variant={problem.kind === 'failed' ? 'destructive' : 'default'} role="alert">
      <AlertDescription className="space-y-3 text-base">
        <span className="block">{problem.kind === 'failed' ? TODAY_MESSAGES.failed : TODAY_MESSAGES.gone}</span>
        {problem.kind === 'failed' ? (
          <Button type="button" variant="outline" onClick={problem.retry} disabled={busy}>
            Nochmal versuchen
          </Button>
        ) : (
          step.name === 'suggestion' && (
            <NewSuggestionButton
              kind={step.suggestion.kind}
              draft={drafts[step.suggestion.kind]}
              onRequest={request}
              disabled={busy}
            />
          )
        )}
      </AlertDescription>
    </Alert>
  )

  if (step.name === 'choice') {
    return (
      <section aria-labelledby="today-flow-title" className="space-y-6">
        <StepHeading id="today-flow-title" focusKey="choice" focus={interacted}>
          Was brauchst du gerade?
        </StepHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['move', 'eat'] as const).map((kind) => (
            <Button key={kind} type="button" size="lg" variant="outline" onClick={() => choose(kind)} className="min-h-20 bg-card text-lg">
              {KIND_LABELS[kind]}
            </Button>
          ))}
        </div>
      </section>
    )
  }

  if (step.name === 'question') {
    const { kind, index } = step
    const questions = questionsOf(kind, places)
    const question = questions[index]
    const draft = drafts[kind]
    const last = lastAnswers[kind]
    const repeatable = index === 0 && last && isAnswersStillValid(last, { places }) ? last : null
    const selected = question === 'minutes' ? String(draft.minutes ?? '') : (draft[question] ?? '')

    return (
      <section aria-label={KIND_LABELS[kind]} className="space-y-6">
        {repeatable && (
          <div className="space-y-2">
            <Button type="button" variant="secondary" onClick={() => repeat(repeatable)} disabled={busy} className="h-auto min-h-12 w-full flex-col items-start gap-0.5 py-3 text-left sm:w-auto">
              <span>Wie letztes Mal</span>
              <span className="text-sm font-normal text-muted-foreground">{answersSummary(repeatable)}</span>
            </Button>
          </div>
        )}

        <StepHeading focusKey={`${kind}-${question}`} focus={interacted}>{QUESTION_TITLES[question]}</StepHeading>

        <div role="group" aria-label={QUESTION_TITLES[question]} className="grid gap-3">
          {optionsOf(question, places).map((option) => (
            <AnswerButton
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onClick={() => answer(kind, index, question, option.value)}
              disabled={busy}
            />
          ))}
        </div>

        {pending && (
          <p role="status" className="text-muted-foreground">
            Einen Moment …
          </p>
        )}
        {problemView}

        <Button type="button" variant="ghost" onClick={back} disabled={busy}>
          Zurück
        </Button>
      </section>
    )
  }

  const { suggestion } = step
  const [main, ...alternatives] = suggestion.items

  if (!main) {
    return (
      <section className="space-y-6">
        <StepHeading focusKey={`empty-${suggestion.checkInId}`} focus={interacted}>{TODAY_MESSAGES.nothingFits}</StepHeading>
        <p className="text-muted-foreground">{suggestion.fitsLine}</p>
        {problemView}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={back} disabled={busy}>
            Andere Angaben wählen
          </Button>
          <Button asChild variant="ghost">
            <Link href={AREA_LINKS[suggestion.kind].href}>{AREA_LINKS[suggestion.kind].label}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <StepHeading focusKey={`suggestion-${suggestion.checkInId}`} focus={interacted}>Dein Vorschlag</StepHeading>

      <Card className="border-primary shadow-lg">
        <CardContent className="space-y-4 p-6">
          <h3 className="text-xl font-semibold [overflow-wrap:anywhere]">
            <Link href={main.href} className="underline-offset-4 hover:underline">
              {main.title}
            </Link>
          </h3>
          <p>{main.detail}</p>
          <p className="text-muted-foreground">{suggestion.fitsLine}</p>
          <SampleContentBadge reviewStatus={main.reviewStatus} />
          <Button type="button" size="lg" onClick={() => start(suggestion, main)} disabled={busy} className="w-full sm:w-auto">
            {START_LABELS[suggestion.kind]}
          </Button>
        </CardContent>
      </Card>

      {problemView}

      {alternatives.length > 0 && (
        <section aria-labelledby="alternatives-title" className="space-y-3">
          <h3 id="alternatives-title" className="text-base font-medium text-muted-foreground">
            Oder stattdessen
          </h3>
          <ul className="space-y-3">
            {alternatives.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={item.href} className="font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => start(suggestion, item)} disabled={busy} aria-label={`Stattdessen das: ${item.title}`}>
                  Stattdessen das
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button type="button" variant="ghost" onClick={back} disabled={busy}>
        Andere Angaben wählen
      </Button>
    </section>
  )
}

/** "Neuer Vorschlag" after "Das gibt es leider nicht mehr.": same answers, a new check-in (EC-6). */
function NewSuggestionButton({
  kind,
  draft,
  onRequest,
  disabled,
}: {
  kind: Kind
  draft: Draft
  onRequest: (answers: CheckInAnswers) => void
  disabled: boolean
}) {
  const answers = answersOf(kind, draft)
  if (!answers) return null
  return (
    <Button type="button" variant="outline" onClick={() => onRequest(answers)} disabled={disabled}>
      Neuer Vorschlag
    </Button>
  )
}
