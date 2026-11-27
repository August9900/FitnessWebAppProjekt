'use client'

import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { NUTRITION_TEXTS, nutritionLines, type Nutrition } from '../nutrition.rules'

/**
 * „Nährwerte pro Portion“ at the end of a meal's detail (AC-1 to AC-5): closed on every page open,
 * the numbers only after opening. The trigger is a real button (Enter/Space, aria-expanded, ≥ 48 px);
 * no animation, so reduced motion needs no special case (EC-5). Neutral text only — no percentages,
 * colours or judgements (AC-3). Lines wrap on narrow screens (EC-4).
 */
export function NutritionSection({ nutrition }: { nutrition: Nutrition }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="max-w-xl">
      <Collapsible className="rounded-lg border">
        <h2 id={headingId} className="text-xl font-semibold">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-auto min-h-12 w-full justify-between whitespace-normal px-4 py-3 text-left text-xl font-semibold">
              {NUTRITION_TEXTS.title}
              <ChevronDown aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent className="space-y-3 border-t px-4 py-4">
          <dl className="grid gap-x-6 gap-y-1 [grid-template-columns:max-content_1fr]">
            {nutritionLines(nutrition).map((line) => (
              <div key={line.label} className="contents">
                <dt className="text-muted-foreground">{line.label}:</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">{NUTRITION_TEXTS.note}</p>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
