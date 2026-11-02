import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://cold.md'),
  title: 'cold.md - Cold outreach that improves itself, as a Claude Code plugin',
  description:
    'An open spec and a Claude Code plugin: eleven skills and one /cold command for ICP, lead sourcing, verification, drafting, sending, A/B experiments that rewrite your cold.md, reply triage and reporting. Sends through FoxReach.',
  keywords: [
    'cold.md',
    'claude code cold email',
    'claude code cold outreach',
    'cold email plugin',
    'cold email claude code skill',
    'AI cold email agent',
    'autonomous SDR claude',
    'cold email spec',
    'cold email markdown',
    'cold email A/B testing',
    'autoresearch cold email',
    'FoxReach',
  ],
  openGraph: {
    title: 'cold.md - Cold outreach that improves itself',
    description:
      'One markdown file defines your outbound. Eleven Claude Code skills run it, test it, and propose edits to it from real reply data.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain font-sans">{children}</body>
    </html>
  )
}
