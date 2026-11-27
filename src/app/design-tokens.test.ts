// AC-11: every text/background pair of the PULSE tokens reaches at least 4.5:1 in light and dark.
// Reads the real values from globals.css, so a changed token is checked, not a copy of it.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8')

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`  ${selector} {`)
  if (start === -1) throw new Error(`Block ${selector} not found in globals.css`)
  const body = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

function luminance(hsl: string): number {
  const [h, s, l] = hsl.replace(/%/g, '').split(/\s+/).map(Number)
  const sat = s / 100
  const light = l / 100
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const PAIRS: Array<[text: string, background: string]> = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'secondary'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'secondary'],
  ['primary-foreground', 'primary'],
  ['primary-foreground', 'primary-hover'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['sidebar-foreground', 'sidebar-background'],
  ['sidebar-foreground', 'sidebar-accent'],
]

describe.each([
  ['hell', ':root'],
  ['dunkel', '.dark'],
])('Kontrast im Schema %s (AC-11)', (_name, selector) => {
  const values = tokens(selector)

  it.each(PAIRS)('%s auf %s erreicht mindestens 4,5:1', (text, background) => {
    expect(values[text], `--${text} fehlt`).toBeDefined()
    expect(values[background], `--${background} fehlt`).toBeDefined()
    expect(contrast(values[text], values[background])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('contrast()', () => {
  it('kennt die Extremwerte', () => {
    expect(contrast('0 0% 0%', '0 0% 100%')).toBeCloseTo(21, 0)
    expect(contrast('0 0% 50%', '0 0% 50%')).toBeCloseTo(1, 5)
  })
})

describe('Rundung und Schriften (AC-10)', () => {
  it('nutzt die gemeinsame Rundung und beide Schriften', () => {
    expect(tokens(':root').radius).toBe('14px')
    expect(css).toMatch(/--font-sans:\s*var\(--font-inter\)/)
    expect(css).toMatch(/--font-display:\s*var\(--font-unbounded\)/)
  })
})

describe('reduzierte Bewegung (AC-15)', () => {
  it('reagiert auf Geräteeinstellung und eigenen Schalter', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(css).toMatch(/html\[data-reduce-motion='true'\]/)
  })
})
