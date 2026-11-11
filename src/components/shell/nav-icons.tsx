import { Activity, CalendarRange, Sun, UserRound, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { NavAreaKey } from './navigation.rules'

/** One icon per main area, shared by the sidebar and the bottom navigation. */
export const NAV_ICONS: Record<NavAreaKey, LucideIcon> = {
  heute: Sun,
  bewegung: Activity,
  essen: UtensilsCrossed,
  wochenblick: CalendarRange,
  profil: UserRound,
}
