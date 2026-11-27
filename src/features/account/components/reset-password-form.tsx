'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { resetConfirmSchema, resetRequestSchema, type ResetConfirmInput, type ResetRequestInput } from '../account.schema'
import { confirmPasswordReset, requestPasswordReset, type FormState } from '../auth.actions'
import { toFormData, useServerForm } from './use-server-form'

/**
 * Two steps on one page: request a code, then enter code and new password. The address stays in
 * the form state and travels in the POST body only — never in the URL.
 */
export function ResetPasswordForm() {
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState<FormState | null>(null)
  const [resending, startResend] = useTransition()

  const request = useServerForm<ResetRequestInput>({
    schema: resetRequestSchema,
    action: requestPasswordReset,
    defaultValues: { email: '' },
    onResult: (result) => {
      if (result.status === 'success' && result.step === 'confirm') {
        const address = result.values?.email ?? ''
        setEmail(address)
        confirm.form.reset({ email: address, code: '', password: '' })
        setNotice(result)
        setStep('confirm')
      }
    },
  })

  const confirm = useServerForm<ResetConfirmInput>({
    schema: resetConfirmSchema,
    action: confirmPasswordReset,
    defaultValues: { email: '', code: '', password: '' },
    onResult: (result) => {
      setNotice(result)
      if (result.step === 'request') setStep('request')
    },
  })

  function resendCode() {
    startResend(async () => {
      const result = await requestPasswordReset({ status: 'idle' }, toFormData({ email }))
      if (result) setNotice(result)
    })
  }

  function switchAddress() {
    setNotice(null)
    request.setState({ status: 'idle' })
    setStep('request')
  }

  const noticeAlert = notice?.message ? (
    <Alert variant={notice.status === 'error' ? 'destructive' : 'default'} role={notice.status === 'error' ? 'alert' : 'status'}>
      <AlertDescription>{notice.message}</AlertDescription>
    </Alert>
  ) : null

  if (step === 'request') {
    return (
      <Form {...request.form}>
        <form method="post" onSubmit={request.onSubmit} noValidate className="space-y-6">
          {request.state.message && request.state.status === 'error' ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{request.state.message}</AlertDescription>
            </Alert>
          ) : (
            noticeAlert
          )}

          <FormField
            control={request.form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail-Adresse</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" inputMode="email" className="h-12" {...field} />
                </FormControl>
                <FormDescription>Wir schicken dir einen 6-stelligen Code, der 10 Minuten gültig ist.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-12 w-full" disabled={request.pending}>
            {request.pending ? 'Code wird angefordert …' : 'Code anfordern'}
          </Button>

          <p className="text-sm text-muted-foreground">
            Passwort wieder eingefallen?{' '}
            <Link href="/anmelden" className="font-medium text-foreground underline underline-offset-4">
              Anmelden
            </Link>
          </p>
        </form>
      </Form>
    )
  }

  return (
    <Form {...confirm.form}>
      <form method="post" onSubmit={confirm.onSubmit} noValidate className="space-y-6">
        {noticeAlert}

        <p className="text-sm text-muted-foreground">
          Code für <span className="font-medium text-foreground">{email}</span>.{' '}
          <button type="button" onClick={switchAddress} className="underline underline-offset-4">
            Andere Adresse verwenden
          </button>
        </p>

        <FormField
          control={confirm.form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code aus der E-Mail</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="h-12 font-mono tracking-[0.3em]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={confirm.form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Neues Passwort</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" className="h-12" {...field} />
              </FormControl>
              <FormDescription>Mindestens 12 Zeichen. Eine Passphrase aus mehreren Wörtern ist ideal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-12 w-full" disabled={confirm.pending}>
          {confirm.pending ? 'Wird gespeichert …' : 'Neues Passwort speichern'}
        </Button>

        <Button type="button" variant="outline" className="h-12 w-full" onClick={resendCode} disabled={resending}>
          {resending ? 'Neuer Code wird angefordert …' : 'Neuen Code anfordern'}
        </Button>
      </form>
    </Form>
  )
}
