import { render } from '@testing-library/react'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const { TimeZoneSync } = await import('./time-zone-sync')

function clearCookie() {
  document.cookie = 'pulse_tz=; Path=/; Max-Age=0'
}

function deviceTimeZone(timeZone: string) {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as Intl.ResolvedDateTimeFormatOptions)
}

beforeEach(() => {
  vi.restoreAllMocks()
  refresh.mockClear()
  clearCookie()
})

describe('TimeZoneSync (AC-2, AC-4, EC-2)', () => {
  it('setzt die Gerätezeitzone als Cookie und lädt einmal neu, wenn sie fehlt', () => {
    deviceTimeZone('Europe/Lisbon')
    const { container } = render(<TimeZoneSync cookieValue={null} />)
    expect(document.cookie).toContain('pulse_tz=Europe%2FLisbon')
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(container).toBeEmptyDOMElement()
  })

  it('aktualisiert ein abweichendes Cookie, z. B. nach einer Reise', () => {
    deviceTimeZone('Europe/Helsinki')
    render(<TimeZoneSync cookieValue="Europe/Berlin" />)
    expect(document.cookie).toContain('pulse_tz=Europe%2FHelsinki')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('tut nichts, wenn das Cookie schon stimmt', () => {
    deviceTimeZone('Europe/Berlin')
    render(<TimeZoneSync cookieValue="Europe/Berlin" />)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('lädt nicht neu, wenn der Browser das Cookie nicht annimmt — keine Endlosschleife', () => {
    deviceTimeZone('Europe/Lisbon')
    const cookie = vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {})
    render(<TimeZoneSync cookieValue={null} />)
    expect(cookie).toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })
})
