'use client'

// The two optional questions after "Geschafft" (PROJ-7): "Wie war der Aufwand?" and "Wieder
// vorschlagen?". A tap saves right away and stays marked — not by colour alone (AC-3); nothing is
// asked again or nagged about (AC-4). Per question at most one save runs at a time; a tap meanwhile
// is held back and sent afterwards, only the last one counts (EC-1). On failure the last saved
// answer stays marked and "Nochmal versuchen" sends the tapped one again (EC-3).
import { Check } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TODAY_MESSAGES } from '@/features/today/today.rules'
import { cn } from '@/lib/utils'
import { saveFeedback } from '../feedback.actions'
import {
  EFFORT_LABELS,
  FEEDBACK_QUESTIONS,
  QUESTION_TITLES,
  SUGGEST_AGAIN_LABELS,
  type FeedbackAnswers,
  type FeedbackQuestion,
} from '../feedback.rules'

const OPTIONS = {
  effort: Object.entries(EFFORT_LABELS),
  suggestAgain: Object.entries(SUGGEST_AGAIN_LABELS),
} satisfies Record<FeedbackQuestion, [string, string][]>

type Answer = { question: FeedbackQuestion; value: string }

export function FeedbackQuestions({ actionId, initial }: { actionId: string; initial: FeedbackAnswers }) {
  const id = useId()
  const [shown, setShown] = useState<Record<FeedbackQuestion, string | null>>(initial)
  const [failure, setFailure] = useState<Answer | null>(null)
  // What the database holds, what is on its way, and what waits behind it — per question.
  const saved = useRef<Record<FeedbackQuestion, string | null>>({ ...initial })
  const inFlight = useRef<Record<FeedbackQuestion, boolean>>({ effort: false, suggestAgain: false })
  const queued = useRef<Partial<Record<FeedbackQuestion, string>>>({})

  function show(question: FeedbackQuestion, value: string | null) {
    setShown((current) => ({ ...current, [question]: value }))
  }

  async function send({ question, value }: Answer) {
    inFlight.current[question] = true
    const result = await saveFeedback({ actionId, question, value })
    inFlight.current[question] = false
    if (result.ok) saved.current[question] = value

    // A newer tap arrived meanwhile: it wins, whatever happened to this one (EC-1).
    const next = queued.current[question]
    if (next !== undefined) {
      delete queued.current[question]
      void send({ question, value: next })
      return
    }

    if (result.ok) return
    show(question, saved.current[question])
    // "not_possible": the card no longer applies; the refreshed page shows the actual state (EC-4).
    if (result.reason !== 'not_possible') setFailure({ question, value })
  }

  function tap(answer: Answer) {
    show(answer.question, answer.value)
    setFailure(null)
    if (inFlight.current[answer.question]) {
      queued.current[answer.question] = answer.value
      return
    }
    void send(answer)
  }

  return (
    <div className="space-y-4">
      {FEEDBACK_QUESTIONS.map((question) => {
        const titleId = `${id}-${question}`
        return (
          <div key={question} role="group" aria-labelledby={titleId} className="space-y-2">
            <p id={titleId} className="text-sm font-medium">
              {QUESTION_TITLES[question]}
            </p>
            <div className="flex flex-wrap gap-2">
              {OPTIONS[question].map(([value, label]) => {
                const selected = shown[question] === value
                return (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    aria-pressed={selected}
                    onClick={() => tap({ question, value })}
                    className={cn('bg-card', selected && 'border-2 border-primary')}
                  >
                    {selected && <Check aria-hidden="true" />}
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}

      {failure && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="space-y-3">
            <span className="block">{TODAY_MESSAGES.failed}</span>
            <Button type="button" variant="outline" onClick={() => tap(failure)}>
              Nochmal versuchen
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
