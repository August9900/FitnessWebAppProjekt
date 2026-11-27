'use client'

// Connects a react-hook-form form (client-side checks with the same Zod schema) to a Server
// Action (the real check). Field errors from the server land at their field (AC-21).
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import type { FormState } from '../auth.actions'

export type AccountAction = (prev: FormState, formData: FormData) => Promise<FormState>

export function toFormData(values: Record<string, unknown>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) formData.set(key, String(value))
  }
  return formData
}

export function useServerForm<TValues extends FieldValues>(options: {
  schema: z.ZodType
  action: AccountAction
  defaultValues: DefaultValues<TValues>
  extraFields?: Record<string, string>
  onResult?: (state: FormState) => void
}) {
  const form = useForm<TValues>({
    resolver: zodResolver(options.schema as never) as unknown as Resolver<TValues>,
    defaultValues: options.defaultValues,
  })
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const [pending, startTransition] = useTransition()

  const submit = (values: Record<string, unknown>) => {
    startTransition(async () => {
      const result = await options.action(state, toFormData({ ...values, ...options.extraFields }))
      // A redirect from the action navigates away and leaves nothing to show.
      if (!result) return
      setState(result)
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) form.setError(field as Path<TValues>, { type: 'server', message })
      }
      options.onResult?.(result)
    })
  }

  return {
    form,
    state,
    setState,
    pending,
    onSubmit: form.handleSubmit((values) => submit(values as Record<string, unknown>)),
  }
}
