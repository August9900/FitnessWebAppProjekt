'use client'

// The onboarding (PROJ-3): one question per screen, progress "Frage X von Y", back without losing
// answers, every answer saved right away so an interruption costs nothing (EC-1).
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { saveOnboardingAnswer } from '../profile.actions'
import {
  applyAnswer,
  firstOpenQuestion,
  isAnswered,
  neighboursOf,
  progressOf,
  type ProfileAnswers,
} from '../profile.rules'
import { LABELS, MESSAGES, NO_EQUIPMENT, type QuestionKey } from '../profile.schema'
import { MultiChoice, SingleChoice, optionsOf } from './answer-options'

const QUESTIONS: Record<QuestionKey, { title: string; hint?: string }> = {
  goal: { title: 'Was möchtest du mit PULSE erreichen?', hint: 'Wähle das, was dir gerade am wichtigsten ist.' },
  experience: { title: 'Wie viel bewegst du dich bisher?' },
  places: { title: 'Wo kannst du dich bewegen?', hint: 'Mehrere Antworten möglich.' },
  homeEquipment: { title: 'Was hast du zuhause?', hint: 'Mehrere Antworten möglich.' },
  diet: { title: 'Wie isst du?' },
}

/** How long the short confirmation stays before "Heute" opens (AC-9). */
export const CONFIRMATION_MS = 1500

export function OnboardingFlow({
  initialAnswers,
  initialQuestion,
}: {
  initialAnswers: ProfileAnswers
  initialQuestion: QuestionKey
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<ProfileAnswers>(initialAnswers)
  const [question, setQuestion] = useState<QuestionKey>(initialQuestion)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => router.push('/heute'), CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [done, router])

  function change<Q extends QuestionKey>(key: Q, value: ProfileAnswers[Q]) {
    setDraft((current) => applyAnswer(current, key, value))
    setFieldError(null)
  }

  function next() {
    if (pending) return
    if (!isAnswered(draft, question)) {
      setFieldError(MESSAGES[question])
      return
    }
    setSaveError(null)
    startTransition(async () => {
      const result = await saveOnboardingAnswer({ question, value: draft[question] })
      if (!result.ok) {
        if (result.fieldError) setFieldError(result.fieldError)
        else setSaveError(result.message ?? null)
        return
      }
      setDraft(result.answers)
      const following = neighboursOf(result.answers, question).next
      if (following) setQuestion(following)
      else if (result.complete) setDone(true)
      else setQuestion(firstOpenQuestion(result.answers) ?? question)
    })
  }

  function back() {
    const previous = neighboursOf(draft, question).previous
    if (previous) {
      setQuestion(previous)
      setFieldError(null)
      setSaveError(null)
    }
  }

  if (done) {
    return (
      <div role="status" className="space-y-6">
        <h1 className="font-display text-[28px] font-bold leading-tight">Danke, das reicht schon.</h1>
        <p className="text-muted-foreground">Deine Angaben sind gespeichert. Gleich geht es weiter zu „Heute“.</p>
        <Button asChild>
          <Link href="/heute">Weiter zu Heute</Link>
        </Button>
      </div>
    )
  }

  const { current, total } = progressOf(draft, question)
  const { previous, next: following } = neighboursOf(draft, question)
  const { title, hint } = QUESTIONS[question]
  const common = { legend: title, hint, error: fieldError ?? undefined, legendAsHeading: true }

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        next()
      }}
      className="space-y-8"
    >
      <p className="text-sm font-medium text-muted-foreground">
        Frage {current} von {total}
      </p>

      {question === 'goal' && (
        <SingleChoice {...common} options={optionsOf(LABELS.goal)} value={draft.goal} onChange={(v) => change('goal', v)} />
      )}
      {question === 'experience' && (
        <SingleChoice
          {...common}
          options={optionsOf(LABELS.experience)}
          value={draft.experience}
          onChange={(v) => change('experience', v)}
        />
      )}
      {question === 'places' && (
        <MultiChoice {...common} options={optionsOf(LABELS.places)} values={draft.places} onChange={(v) => change('places', v)} />
      )}
      {question === 'homeEquipment' && (
        <MultiChoice
          {...common}
          options={optionsOf(LABELS.homeEquipment)}
          values={draft.homeEquipment}
          exclusiveValue={NO_EQUIPMENT}
          onChange={(v) => change('homeEquipment', v)}
        />
      )}
      {question === 'diet' && (
        <SingleChoice {...common} options={optionsOf(LABELS.diet)} value={draft.diet} onChange={(v) => change('diet', v)} />
      )}

      {saveError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="space-y-3">
            <span className="block">{saveError}</span>
            <Button type="submit" variant="outline" disabled={pending}>
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {previous ? (
          <Button type="button" variant="ghost" onClick={back} disabled={pending}>
            Zurück
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Wird gespeichert …' : following ? 'Weiter' : 'Fertig'}
        </Button>
      </div>
    </form>
  )
}
