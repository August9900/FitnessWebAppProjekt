'use client'

import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginInput } from '../account.schema'
import { signIn } from '../auth.actions'
import { useServerForm } from './use-server-form'

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const { form, state, pending, onSubmit } = useServerForm<LoginInput>({
    schema: loginSchema,
    action: signIn,
    defaultValues: { email: '', password: '' },
    extraFields: redirectTo ? { weiter: redirectTo } : undefined,
  })

  return (
    <Form {...form}>
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-6">
        {state.message && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{state.message}</AlertDescription>
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
              <div className="flex items-baseline justify-between gap-4">
                <FormLabel>Passwort</FormLabel>
                <Link href="/passwort-vergessen" className="text-sm underline underline-offset-4">
                  Passwort vergessen?
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-12 w-full" disabled={pending}>
          {pending ? 'Anmeldung läuft …' : 'Anmelden'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="font-medium text-foreground underline underline-offset-4">
            Konto erstellen
          </Link>
        </p>
      </form>
    </Form>
  )
}
