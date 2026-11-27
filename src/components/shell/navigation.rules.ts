/**
 * The app's main areas — the single list both navigations render (docs/app-shell.md).
 * A new entry is a change to PROJ-2. Pure module: no framework, no icons (the components map
 * `key` to an icon). "Gewicht" is the one conditional entry (PROJ-2 AC-19): whether it applies to a
 * person is decided by PROJ-11 and passed in.
 */

export type NavAreaKey = 'heute' | 'bewegung' | 'essen' | 'wochenblick' | 'gewicht' | 'profil'

export type NavArea = {
  key: NavAreaKey
  label: string
  /** Label with a soft hyphen where the narrow bottom navigation may break it. */
  compactLabel: string
  href: string
}

type NavAreaDefinition = NavArea & {
  /** More break points for six entries, where each field is narrower (PROJ-2 EC-4). */
  narrowLabel?: string
  /** Shown only when the person may see "Gewicht" (PROJ-11). */
  onlyWithWeight?: true
}

const SOFT_HYPHEN = '\u00AD'

const ALL_NAV_AREAS: readonly NavAreaDefinition[] = [
  { key: 'heute', label: 'Heute', compactLabel: 'Heute', href: '/heute' },
  {
    key: 'bewegung',
    label: 'Bewegung',
    compactLabel: 'Bewegung',
    narrowLabel: `Be${SOFT_HYPHEN}we${SOFT_HYPHEN}gung`,
    href: '/bewegung',
  },
  { key: 'essen', label: 'Essen', compactLabel: 'Essen', href: '/essen' },
  { key: 'wochenblick', label: 'Wochenblick', compactLabel: `Wochen${SOFT_HYPHEN}blick`, href: '/wochenblick' },
  { key: 'gewicht', label: 'Gewicht', compactLabel: 'Gewicht', href: '/gewicht', onlyWithWeight: true },
  { key: 'profil', label: 'Profil', compactLabel: 'Profil', href: '/profil' },
]

/**
 * The areas for one person: five, or six with "Gewicht" between Wochenblick and Profil (PROJ-2
 * AC-1, AC-2, AC-19). With six, the narrow labels apply so every field still fits at 320 px (EC-4).
 */
export function navAreasFor({ showWeight }: { showWeight: boolean }): NavArea[] {
  const areas = ALL_NAV_AREAS.filter((area) => showWeight || !area.onlyWithWeight)
  const narrow = areas.length > 5
  return areas.map(({ key, label, compactLabel, narrowLabel, href }) => ({
    key,
    label,
    compactLabel: narrow && narrowLabel ? narrowLabel : compactLabel,
    href,
  }))
}

/** The five areas everybody has. */
export const NAV_AREAS: readonly NavArea[] = navAreasFor({ showWeight: false })

/** True for the area's own path and anything below it — "/profil/x", but not "/profilbild". */
export function isActivePath(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function activeArea(pathname: string | null | undefined): NavArea | undefined {
  return ALL_NAV_AREAS.find((area) => isActivePath(pathname, area.href))
}
