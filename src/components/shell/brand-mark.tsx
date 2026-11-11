import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The static PULSE pulse line — the brand motif, never animated (design-system.md). */
function PulseLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 24" fill="none" aria-hidden="true" focusable="false" className={className}>
      <polyline
        points="0,12 16,12 21,4 28,20 34,7 39,12 56,12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** PULSE wordmark (Unbounded) with the pulse line. With `href` it is a link, e.g. back to the start. */
export function BrandMark({ href, className }: { href?: string; className?: string }) {
  const content = (
    <>
      <span className="font-display text-xl font-bold tracking-tight">PULSE</span>
      <PulseLine className="h-5 w-12 text-primary" />
    </>
  )
  const classes = cn('inline-flex items-center gap-2 text-foreground', className)

  if (href) {
    return (
      <Link href={href} className={cn(classes, 'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background')}>
        {content}
      </Link>
    )
  }
  return <span className={classes}>{content}</span>
}
