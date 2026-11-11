'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ICONS } from './nav-icons'
import { NAV_AREAS, isActivePath } from './navigation.rules'

/** Height of the bottom navigation without the device's safe area — the content keeps this much room. */
export const MOBILE_NAV_HEIGHT = '4.5rem'

/**
 * Fixed bottom navigation below 1024 px (AC-2): five equal fields with icon and visible label.
 * "Wochenblick" may break at its soft hyphen so all five fit at 320 px (EC-4).
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_AREAS.map((area) => {
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
                  'relative flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-center text-sm leading-tight [hyphens:manual]',
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
