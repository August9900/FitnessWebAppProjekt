'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { changePassword } from '../account.actions'
import { passwordChangeSchema, type PasswordChangeInput } from '../account.schema'
import { useServerForm } from './use-server-form'

export function PasswordChangeForm() {
  const { form, state, pending, onSubmit } = useServerForm<PasswordChangeInput>({
    schema: passwordChangeSchema,
    action: changePassword,
    defaultValues: { currentPassword: '', newPassword: '' },
    onResult: (result) => {
      if (result.status === 'success') form.reset()
    },
  })

  return (
    <Form {...form}>
      <form method="post" onSubmit={onSubmit} noValidate className="space-y-6">
        {state.message && (
          <Alert variant={state.status === 'error' ? 'destructive' : 'default'} role={state.status === 'error' ? 'alert' : 'status'}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aktuelles Passwort</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Neues Passwort</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" className="h-12" {...field} />
              </FormControl>
              <FormDescription>Mindestens 12 Zeichen. Andere Geräte werden danach abgemeldet.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-12" disabled={pending}>
          {pending ? 'Wird geändert …' : 'Passwort ändern'}
        </Button>
      </form>
    </Form>
  )
}
