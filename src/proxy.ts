// Refreshes the Supabase session on every request before Server Components read it, and sends
// visitors without a session away from protected areas early. This is the fast path only: the
// protected layout, every action and the export route check the session themselves (AC-1, AC-12).
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/heute', '/bewegung', '/essen', '/wochenblick', '/profil']

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refreshes an expired session and writes the new cookies. Do not put code between
  // creating the client and this call.
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/anmelden'
    // Only the internal path travels in the URL — never credentials or personal data.
    loginUrl.search = ''
    loginUrl.searchParams.set('weiter', request.nextUrl.pathname)
    const redirect = NextResponse.redirect(loginUrl)
    // Keep any cookie changes (e.g. a cleared, invalid session) on the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
