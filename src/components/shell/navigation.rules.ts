/**
 * The app's main areas — the single list both navigations render (docs/app-shell.md).
 * A new entry is a change to PROJ-2. Pure module: no framework, no icons (the components map
 * `key` to an icon).
 */

export type NavAreaKey = 'heute' | 'bewegung' | 'essen' | 'wochenblick' | 'profil'

export type NavArea = {
  key: NavAreaKey
  label: string
  /** Label with a soft hyphen where the narrow bottom navigation may break it. */
  compactLabel: string
  href: string
}

export const NAV_AREAS: readonly NavArea[] = [
  { key: 'heute', label: 'Heute', compactLabel: 'Heute', href: '/heute' },
  { key: 'bewegung', label: 'Bewegung', compactLabel: 'Bewegung', href: '/bewegung' },
  { key: 'essen', label: 'Essen', compactLabel: 'Essen', href: '/essen' },
  { key: 'wochenblick', label: 'Wochenblick', compactLabel: 'Wochen­blick', href: '/wochenblick' },
  { key: 'profil', label: 'Profil', compactLabel: 'Profil', href: '/profil' },
]

/** True for the area's own path and anything below it — "/profil/x", but not "/profilbild". */
export function isActivePath(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function activeArea(pathname: string | null | undefined): NavArea | undefined {
  return NAV_AREAS.find((area) => isActivePath(pathname, area.href))
}
