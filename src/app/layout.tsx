import type { Metadata } from 'next'
import { Inter, Unbounded } from 'next/font/google'
import { AppearanceProvider } from '@/features/appearance/appearance-provider'
import { AppearanceScript } from '@/features/appearance/appearance-script'
import './globals.css'

// next/font downloads both fonts at build time and serves them from the app's own address —
// the browser never contacts Google (PROJ-2, AC-12).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const unbounded = Unbounded({ subsets: ['latin'], weight: ['700'], variable: '--font-unbounded', display: 'swap' })

export const metadata: Metadata = {
  title: 'PULSE',
  description: 'Der nächste machbare Schritt für Bewegung und Ernährung – auch an unruhigen Tagen.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // next-themes sets the colour-scheme class before hydration, hence suppressHydrationWarning.
    <html lang="de" suppressHydrationWarning className={`${inter.variable} ${unbounded.variable}`}>
      <head>
        <AppearanceScript />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  )
}
