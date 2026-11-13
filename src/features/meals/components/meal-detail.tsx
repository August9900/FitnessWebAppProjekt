import { SampleContentBadge } from '@/components/content/sample-content-badge'
import { PageHeader } from '@/components/shell/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ALLERGEN_PACKAGING_NOTE,
  EFFORT_LABELS,
  MEAL_DIET_LABELS,
  NOT_FITTING_NOTE,
  allergenText,
  minutesLabel,
  type Meal,
} from '../meals.rules'

/**
 * The meal detail: key facts, ingredients for one person, steps, "Noch einfacher" and the allergen
 * statement (AC-5 to AC-8). A meal opened by its address that does not fit the person's diet is
 * shown in full with a short note (EC-3). No controls, so no browser code.
 */
export function MealDetail({ meal, fits }: { meal: Meal; fits: boolean }) {
  return (
    <div className="space-y-8">
      <PageHeader title={meal.title} />

      <div className="flex flex-wrap items-center gap-3">
        <SampleContentBadge reviewStatus={meal.reviewStatus} />
        {!fits && <p className="font-medium">{NOT_FITTING_NOTE}</p>}
      </div>

      <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Aufwand</dt>
        <dd>{EFFORT_LABELS[meal.effort]}</dd>
        <dt className="text-muted-foreground">Zeit</dt>
        <dd>{minutesLabel(meal.minutes)}</dd>
        <dt className="text-muted-foreground">Essensweise</dt>
        <dd>{MEAL_DIET_LABELS[meal.diet]}</dd>
      </dl>

      <section aria-labelledby="zutaten-titel" className="space-y-3">
        <h2 id="zutaten-titel" className="text-xl font-semibold">
          Zutaten
        </h2>
        <p className="text-sm text-muted-foreground">Für eine Person</p>
        <ul className="max-w-[70ch] list-disc space-y-1 pl-6">
          {meal.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="zubereitung-titel" className="space-y-3">
        <h2 id="zubereitung-titel" className="text-xl font-semibold">
          Zubereitung
        </h2>
        <ol className="max-w-[70ch] list-decimal space-y-2 pl-6 leading-relaxed">
          {meal.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      <Alert className="max-w-xl">
        <AlertDescription className="text-base text-foreground">
          <span className="font-semibold">Noch einfacher:</span> {meal.easierHint}
        </AlertDescription>
      </Alert>

      <section aria-labelledby="allergene-titel" className="max-w-xl space-y-2">
        <h2 id="allergene-titel" className="text-xl font-semibold">
          Allergene
        </h2>
        <p>{allergenText(meal.allergens)}</p>
        <p className="text-sm text-muted-foreground">{ALLERGEN_PACKAGING_NOTE}</p>
      </section>
    </div>
  )
}
