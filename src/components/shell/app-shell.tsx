import type { CSSProperties, ReactNode } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { DesktopNav } from './desktop-nav'
import { MOBILE_NAV_HEIGHT, MobileNav } from './mobile-nav'

export const MAIN_CONTENT_ID = 'inhalt'

/**
 * The app frame for every protected page (docs/app-shell.md): skip link first, sidebar from
 * 1024 px, bottom navigation below, and the content in between. Below 1024 px the content keeps
 * room for the bottom navigation and the device's safe area, so nothing is hidden (AC-2, EC-6).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const spacing = {
    '--mobile-nav-space': `calc(${MOBILE_NAV_HEIGHT} + env(safe-area-inset-bottom) + 2rem)`,
  } as CSSProperties

  return (
    <SidebarProvider className="min-h-dvh">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Zum Inhalt springen
      </a>
      <DesktopNav />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        style={spacing}
        className="min-w-0 flex-1 px-4 pb-[var(--mobile-nav-space)] pt-8 focus:outline-none sm:px-6 lg:px-10 lg:pb-12 lg:pt-12"
      >
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
      <MobileNav />
    </SidebarProvider>
  )
}
