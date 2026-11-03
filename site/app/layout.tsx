import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-instrument-serif', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' })
// Inter with the optical-size axis, the same file foxreach.io self-hosts.
const interDisplay = localFont({
  src: './fonts/InterDisplay-latin.woff2',
  weight: '400 600',
  variable: '--font-inter-display',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const TITLE = 'cold.md - Cold outreach that improves itself'
const DESCRIPTION =
  'An open spec and a Claude Code plugin. One markdown file defines your outbound; eleven skills and one /cold command find and verify leads, draft, send through FoxReach, run A/B tests and propose edits to the file from what got replies.'

export const metadata: Metadata = {
  metadataBase: new URL('https://cold.md'),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'cold.md',
    'claude code cold email',
    'claude code plugin',
    'cold email automation',
    'cold email A/B testing',
    'autoresearch cold email',
    'AI SDR open source',
    'cold email spec',
    'FoxReach',
  ],
  openGraph: {
    title: 'cold.md - Cold outreach that improves itself',
    description: 'One markdown file defines your outbound. Eleven Claude Code skills run it through FoxReach, test it, and propose edits to it from real reply data.',
    url: 'https://cold.md',
    siteName: 'cold.md',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cold.md',
    description: 'Cold outreach that improves itself. Open spec + Claude Code plugin.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://cold.md' },
}

export const viewport: Viewport = { themeColor: '#FFFFFF' }

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'cold.md',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Linux, Windows (Claude Code)',
  description: DESCRIPTION,
  url: 'https://cold.md',
  downloadUrl: 'https://github.com/foxreach/cold-md',
  license: 'https://opensource.org/licenses/MIT',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: 'FoxReach', url: 'https://www.foxreach.io' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${mono.variable} ${interDisplay.variable}`}>
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
        {children}
      </body>
    </html>
  )
}
