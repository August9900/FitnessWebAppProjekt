export {}

const collectAccountExport = vi.fn()
vi.mock('@/features/account/account.data', () => ({ collectAccountExport }))

const { GET } = await import('./route')

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /profil/export (AC-15)', () => {
  it('delivers the export as a JSON download that is never cached', async () => {
    collectAccountExport.mockResolvedValue({ format: 'pulse-account-export', account: { id: 'u1' } })
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toMatch(/^attachment; filename="pulse-daten-\d{4}-\d{2}-\d{2}\.json"$/)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ format: 'pulse-account-export', account: { id: 'u1' } })
  })

  it('refuses without a session (AC-1, AC-12)', async () => {
    collectAccountExport.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
    expect(response.headers.get('content-disposition')).toBeNull()
  })

  it('sends no file when part of the data cannot be read', async () => {
    collectAccountExport.mockRejectedValue(new Error('Profile could not be read (42501).'))
    const response = await GET()
    expect(response.status).toBe(500)
    expect(response.headers.get('content-disposition')).toBeNull()
  })
})
