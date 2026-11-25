import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireCompletedProfile } from '@/features/profile/profile.data'
import { TimeZoneSync } from '@/features/week/components/time-zone-sync'
import { TIME_ZONE_COOKIE, resolveTimeZone } from '@/features/week/week.rules'
import { WeightView } from '@/features/weight/components/weight-view'
import { getWeightAccess, listOwnWeightEntries } from '@/features/weight/weight.data'
import { RANGE_PARAM, parseRange, todayIn, weightVisible } from '@/features/weight/weight.rules'

export const metadata: Metadata = { title: 'Gewicht · PULSE' }

// "Gewicht" (PROJ-11): the person's own entries as curve and list, read fresh on every request.
// Inside the gate for complete answers (AC-3). For everybody who may not or does not want to see it
// (under 16, hidden) the address answers like an unknown one — no hint at the age (AC-2, AC-14).
// The range comes from the address, "today" from the device's time zone (AC-7, EC-5). Reading
// fails → the area's error boundary, not an empty history (EC-6).
export default async function GewichtPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { user } = await requireCompletedProfile()
  const access = await getWeightAccess(user.id)
  if (!access || !weightVisible(access)) notFound()

  const [params, cookieStore, entries] = await Promise.all([searchParams, cookies(), listOwnWeightEntries(user.id)])
  const rawTimeZone = cookieStore.get(TIME_ZONE_COOKIE)?.value ?? null
  const today = todayIn(resolveTimeZone(rawTimeZone))

  return (
    <>
      <WeightView entries={entries} range={parseRange(params[RANGE_PARAM])} today={today} />
      <TimeZoneSync cookieValue={rawTimeZone?.slice(0, 64) ?? null} />
    </>
  )
}
