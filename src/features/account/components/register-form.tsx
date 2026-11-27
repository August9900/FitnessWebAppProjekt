'use client'

import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AUTH_MESSAGES } from '../account.rules'
import { MESSAGES, signupSchema, type SignupInput } from '../account.schema'
import { signUp } from '../auth.actions'
import { useServerForm } from './use-server-form'

const AGE_OPTIONS = [
  { value: '12_15', label: '12 bis 15 Jahre' },
  { value: '16_plus', label: '16 Jahre oder älter' },
  { value: 'under_12', label: 'Jünger als 12 Jahre' },
] as const

export function RegisterForm() {
  const { form, state, pending, onSubmit } = useServerForm<SignupInput>({
    schema: signupSchema,
    action: signUp,
    defaultValues: { email: '', password: '', ageBand: undefined },
  })
  const underAge = form.watch('ageBand') === 'under_12'

  return (
    <Form {...form}>
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-6">
        {state.message && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {state.message}
              {state.message === AUTH_MESSAGES.signupUnavailable && (
                <>
                  {' '}
                  <Link href="/anmelden" className="font-medium underline underline-offset-4">
                    Zur Anmeldung
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail-Adresse</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" inputMode="email" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passwort</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" className="h-12" {...field} />
              </FormControl>
              <FormDescription>Mindestens 12 Zeichen. Eine Passphrase aus mehreren Wörtern ist ideal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageBand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wie alt bist du?</FormLabel>
              <FormControl>
                <RadioGroup name={field.name} value={field.value ?? ''} onValueChange={field.onChange} className="gap-3">
                  {AGE_OPTIONS.map((option) => (
                    <div key={option.value} className="flex min-h-12 items-center gap-3 rounded-lg border px-4">
                      <RadioGroupItem value={option.value} id={`age-${option.value}`} />
                      <label htmlFor={`age-${option.value}`} className="flex-1 cursor-pointer py-3">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>Wir fragen nur nach der Altersgruppe, nicht nach deinem Geburtsdatum.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {underAge && (
          <Alert role="status">
            <AlertDescription>{MESSAGES.underAge}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="h-12 w-full" disabled={pending || underAge}>
          {pending ? 'Konto wird erstellt …' : 'Konto erstellen'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Schon ein Konto?{' '}
          <Link href="/anmelden" className="font-medium text-foreground underline underline-offset-4">
            Anmelden
          </Link>
        </p>
      </form>
    </Form>
  )
}
