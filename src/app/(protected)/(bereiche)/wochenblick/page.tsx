import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { getOwnActionsStartedBetween } from '@/features/today/today.data'
import { TimeZoneSync } from '@/features/week/components/time-zone-sync'
import { WeekView } from '@/features/week/components/week-view'
import { TIME_ZONE_COOKIE, WEEK_PARAM, buildWeek, queryRange, resolveTimeZone, resolveWeek } from '@/features/week/week.rules'

export const metadata: Metadata = { title: 'Wochenblick · PULSE' }

// "Wochenblick" (PROJ-8): one calendar week in the person's local time, read fresh from their own
// action history on every request (EC-3). The week comes from the address (AC-15), the time zone
// from the device cookie with German time as fallback. Reading fails → the area's error boundary (EC-4).
export default async function WochenblickPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { user } = await requireCompletedProfile()
  const [params, cookieStore] = await Promise.all([searchParams, cookies()])

  const rawTimeZone = cookieStore.get(TIME_ZONE_COOKIE)?.value ?? null
  const timeZone = resolveTimeZone(rawTimeZone)
  const window = resolveWeek({
    param: params[WEEK_PARAM],
    now: new Date(),
    timeZone,
    accountCreatedAt: new Date(user.created_at),
  })

  const { from, to } = queryRange(window.monday)
  const actions = await getOwnActionsStartedBetween(user.id, from, to)

  return (
    <>
      <WeekView week={buildWeek(window, actions, timeZone)} />
      <TimeZoneSync cookieValue={rawTimeZone?.slice(0, 64) ?? null} />
    </>
  )
}
