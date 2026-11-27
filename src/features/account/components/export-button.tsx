'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const FALLBACK_ERROR = 'Der Export ist gerade nicht möglich. Bitte versuche es erneut.'

/** Downloads the account export. A failed export shows an error instead of an incomplete file (AC-15). */
export function ExportButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function download() {
    setState('loading')
    try {
      const response = await fetch('/profil/export', { cache: 'no-store' })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? FALLBACK_ERROR)
      }
      const fileName =
        response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ?? 'pulse-daten.json'
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
      setState('idle')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : FALLBACK_ERROR)
      setState('error')
    }
  }

  return (
    <div className="space-y-4">
      {state === 'error' && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="button" variant="outline" className="h-12" onClick={download} disabled={state === 'loading'}>
        {state === 'loading' ? 'Export wird erstellt …' : 'Meine Daten herunterladen'}
      </Button>
    </div>
  )
}
