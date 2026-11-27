import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/account/account.data'
import { RegisterForm } from '@/features/account/components/register-form'
import { BrandMark } from '@/components/shell/brand-mark'

export const metadata: Metadata = { title: 'Konto erstellen · PULSE' }

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/heute')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <BrandMark href="/" className="mb-8 self-start" />
      <h1 className="font-display text-[28px] font-bold leading-tight">Konto erstellen</h1>
      <p className="mt-2 text-muted-foreground">Mit einem Konto kannst du PULSE auf all deinen Geräten nutzen.</p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </main>
  )
}
