'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { BrandMark } from './brand-mark'
import { NAV_ICONS } from './nav-icons'
import { NAV_AREAS, isActivePath, type NavArea } from './navigation.rules'

/**
 * Sidebar from 1024 px width (AC-1). Not collapsible; the current area shows a bar, bold text and
 * aria-current. The areas come from the protected layout: five, or six with "Gewicht" (AC-19).
 */
export function DesktopNav({ areas = NAV_AREAS }: { areas?: readonly NavArea[] }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none" className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border lg:flex">
      <SidebarHeader className="px-5 pb-6 pt-8">
        <BrandMark href="/heute" />
      </SidebarHeader>
      <SidebarContent className="px-3">
        <nav aria-label="Hauptnavigation">
          <SidebarMenu className="gap-1">
            {areas.map((area) => {
              const active = isActivePath(pathname, area.href)
              const Icon = NAV_ICONS[area.key]
              return (
                <SidebarMenuItem key={area.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className="relative h-12 gap-3 px-4 text-base text-sidebar-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar data-[active=true]:font-semibold [&>svg]:size-5"
                  >
                    <Link href={area.href} aria-current={active ? 'page' : undefined}>
                      {active && (
                        <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" />
                      )}
                      <Icon aria-hidden="true" />
                      <span>{area.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}
