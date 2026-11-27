'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { deleteOwnAccount } from '../account.actions'
import { deleteAccountSchema, type DeleteAccountInput } from '../account.schema'
import { useServerForm } from './use-server-form'

export function DeleteAccountDialog() {
  const { form, state, pending, onSubmit } = useServerForm<DeleteAccountInput>({
    schema: deleteAccountSchema,
    action: deleteOwnAccount,
    defaultValues: { currentPassword: '', confirmation: '' },
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" className="h-12">
          Konto löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form {...form}>
          <form method="post" onSubmit={onSubmit} noValidate className="space-y-6">
            <AlertDialogHeader>
              <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Dein Konto und alle zugehörigen Daten werden sofort gelöscht, und alle Geräte werden abgemeldet. Das kann
                nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {state.message && (
              <Alert variant="destructive" role="alert">
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
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tippe LÖSCHEN zur Bestätigung</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" autoCapitalize="characters" className="h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel type="button" className="h-12" disabled={pending}>
                Abbrechen
              </AlertDialogCancel>
              <Button type="submit" variant="destructive" className="h-12" disabled={pending}>
                {pending ? 'Wird gelöscht …' : 'Endgültig löschen'}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
