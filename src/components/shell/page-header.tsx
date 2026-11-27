import type { ReactNode } from 'react'

/**
 * Header of every protected page: the area title and room for at most one main action
 * (AC-6). Long titles wrap instead of overflowing (EC-5).
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  /** The single main action of this view, if it has one. */
  action?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-bold leading-tight [overflow-wrap:anywhere]">{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
