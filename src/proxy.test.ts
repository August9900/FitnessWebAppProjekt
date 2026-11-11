import { NextRequest } from 'next/server'

const getClaims = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getClaims } }),
}))

const { proxy, isProtectedPath } = await import('./proxy')

function request(path: string) {
  return new NextRequest(new URL(path, 'http://localhost:3000'))
}

describe('isProtectedPath', () => {
  it('covers the protected areas and their sub-paths only', () => {
    expect(isProtectedPath('/heute')).toBe(true)
    expect(isProtectedPath('/profil')).toBe(true)
    expect(isProtectedPath('/profil/export')).toBe(true)
    expect(isProtectedPath('/')).toBe(false)
    expect(isProtectedPath('/anmelden')).toBe(false)
    expect(isProtectedPath('/profilbild')).toBe(false)
  })
})

describe('proxy', () => {
  beforeEach(() => getClaims.mockReset())

  it('redirects a visitor without session from a protected page to the login (AC-1)', async () => {
    getClaims.mockResolvedValue({ data: null, error: null })
    const response = await proxy(request('/profil?tab=konto'))
    expect(response.status).toBe(307)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/anmelden')
    expect(location.searchParams.get('weiter')).toBe('/profil')
    expect(location.searchParams.has('tab')).toBe(false)
  })

  it('lets a signed-in person through to a protected page', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } }, error: null })
    const response = await proxy(request('/heute'))
    expect(response.headers.get('location')).toBeNull()
    expect(response.status).toBe(200)
  })

  it('does not redirect public pages', async () => {
    getClaims.mockResolvedValue({ data: null, error: null })
    const response = await proxy(request('/anmelden'))
    expect(response.headers.get('location')).toBeNull()
  })
})
