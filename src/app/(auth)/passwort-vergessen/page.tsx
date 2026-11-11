import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/account/account.data'
import { ResetPasswordForm } from '@/features/account/components/reset-password-form'

export const metadata: Metadata = { title: 'Passwort vergessen · PULSE' }

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect('/heute')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <p className="mb-8 text-xl font-bold tracking-tight">PULSE</p>
      <h1 className="text-[28px] font-bold leading-tight">Passwort zurücksetzen</h1>
      <p className="mt-2 text-muted-foreground">In zwei kurzen Schritten setzt du ein neues Passwort.</p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </main>
  )
}
