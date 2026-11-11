import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/account/account.data'
import { safeRedirectPath } from '@/features/account/account.rules'
import { LoginForm } from '@/features/account/components/login-form'
import { BrandMark } from '@/components/shell/brand-mark'

export const metadata: Metadata = { title: 'Anmelden · PULSE' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ weiter?: string | string[] }> }) {
  const { weiter } = await searchParams
  const target = safeRedirectPath(Array.isArray(weiter) ? weiter[0] : weiter)

  if (await getCurrentUser()) redirect(target)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <BrandMark href="/" className="mb-8 self-start" />
      <h1 className="font-display text-[28px] font-bold leading-tight">Anmelden</h1>
      <p className="mt-2 text-muted-foreground">Schön, dass du da bist.</p>
      <div className="mt-8">
        <LoginForm redirectTo={target} />
      </div>
    </main>
  )
}
