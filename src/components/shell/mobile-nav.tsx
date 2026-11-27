'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ICONS } from './nav-icons'
import { NAV_AREAS, isActivePath, type NavArea } from './navigation.rules'

/** Height of the bottom navigation without the device's safe area — the content keeps this much room. */
export const MOBILE_NAV_HEIGHT = '4.5rem'

/**
 * Fixed bottom navigation below 1024 px (AC-2): equal fields with icon and visible label — five, or
 * six with "Gewicht" (AC-19). Labels may break at their soft hyphens; with six they are 12 px so all
 * fit at 320 px (EC-4). Every field stays at least 48 px high.
 */
export function MobileNav({ areas = NAV_AREAS }: { areas?: readonly NavArea[] }) {
  const pathname = usePathname()
  const six = areas.length > 5

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className={cn('grid', six ? 'grid-cols-6' : 'grid-cols-5')}>
        {areas.map((area) => {
          const active = isActivePath(pathname, area.href)
          const Icon = NAV_ICONS[area.key]
          return (
            <li key={area.key}>
              <Link
                href={area.href}
                aria-label={area.label}
                aria-current={active ? 'page' : undefined}
                style={{ minHeight: MOBILE_NAV_HEIGHT }}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-center leading-tight [hyphens:manual]',
                  six ? 'text-xs' : 'text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <span aria-hidden="true" className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-primary" />
                )}
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span>{area.compactLabel}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
