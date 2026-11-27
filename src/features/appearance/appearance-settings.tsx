'use client'

import { useSyncExternalStore } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { THEME_CHOICES, THEME_LABELS, parseThemeChoice } from './appearance.rules'
import { useAppearance } from './appearance-provider'

const noopSubscribe = () => () => {}

/** Section „Darstellung“ in Profil: colour scheme and „Bewegung reduzieren“, both on this device (AC-14, AC-15). */
export function AppearanceSettings() {
  const { theme, setTheme, userReducesMotion, setUserReducesMotion, deviceReducesMotion } = useAppearance()
  // The stored choice is only known in the browser; render no selection on the server to avoid a mismatch.
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false)

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="font-medium">Farbschema</legend>
        <RadioGroup
          value={inBrowser ? theme : ''}
          onValueChange={(value) => setTheme(parseThemeChoice(value))}
          className="mt-3 gap-3"
        >
          {THEME_CHOICES.map((choice) => (
            <div key={choice} className="flex min-h-12 items-center gap-3 rounded-lg border px-4">
              <RadioGroupItem value={choice} id={`theme-${choice}`} />
              <Label htmlFor={`theme-${choice}`} className="flex-1 cursor-pointer py-3 text-base font-normal">
                {THEME_LABELS[choice]}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p className="mt-3 text-sm text-muted-foreground">„System“ folgt der Einstellung deines Geräts.</p>
      </fieldset>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div>
          <Label htmlFor="reduce-motion" className="text-base font-medium">
            Bewegung reduzieren
          </Label>
          <p id="reduce-motion-hint" className="mt-1 text-sm text-muted-foreground">
            {deviceReducesMotion
              ? 'Dein Gerät reduziert Bewegung bereits.'
              : 'Schaltet Übergänge und Animationen in PULSE ab.'}
          </p>
        </div>
        <Switch
          id="reduce-motion"
          checked={inBrowser && (deviceReducesMotion || userReducesMotion)}
          disabled={deviceReducesMotion}
          onCheckedChange={setUserReducesMotion}
          aria-describedby="reduce-motion-hint"
        />
      </div>

      <p className="text-sm text-muted-foreground">Diese Einstellungen gelten nur auf diesem Gerät.</p>
    </div>
  )
}
