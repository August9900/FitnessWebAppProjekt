'use client'

import { useId, useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { setWeightVisibility } from '../weight.actions'
import { WEIGHT_TEXTS } from '../weight.rules'

/**
 * „Gewicht in der Navigation zeigen“ in the profile (AC-14): saved right away for the account, on
 * every device. Hiding keeps the entries. On failure the switch goes back and says so.
 */
export function WeightVisibilitySwitch({ initial }: { initial: boolean }) {
  const id = useId()
  const [checked, setChecked] = useState(initial)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function change(next: boolean) {
    setFailed(false)
    setChecked(next)
    startTransition(async () => {
      const result = await setWeightVisibility({ show: next })
      if (!result.ok) {
        setChecked(!next)
        setFailed(true)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div>
          <Label htmlFor={id} className="text-base font-medium">
            {WEIGHT_TEXTS.visibilityLabel}
          </Label>
          <p id={`${id}-hinweis`} className="mt-1 text-sm text-muted-foreground">
            Ausgeblendet bleiben deine Einträge gespeichert. Gilt auf allen Geräten.
          </p>
        </div>
        <Switch
          id={id}
          checked={checked}
          disabled={pending}
          onCheckedChange={change}
          aria-describedby={`${id}-hinweis`}
        />
      </div>
      {failed && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{WEIGHT_TEXTS.failed}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
