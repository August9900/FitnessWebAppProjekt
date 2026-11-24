'use client'

// Tells the server the device's time zone (PROJ-8 AC-2, AC-4, EC-2): when it differs from the
// cookie the page was rendered with, the cookie is set and the page reloads once. If the browser
// refuses cookies, nothing reloads — the week then stays in German time. Renders nothing.
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TIME_ZONE_COOKIE } from '../week.rules'

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

function readCookie(name: string): string | null {
  const entry = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export function TimeZoneSync({ cookieValue }: { cookieValue: string | null }) {
  const router = useRouter()

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!timeZone || timeZone === cookieValue) return

    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`
    // Reload only if the cookie really arrived — otherwise this would repeat on every load.
    if (readCookie(TIME_ZONE_COOKIE) === timeZone) router.refresh()
  }, [cookieValue, router])

  return null
}
