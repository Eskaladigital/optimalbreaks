// ============================================
// OPTIMAL BREAKS — Root Layout
// ============================================

import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://optimalbreaks.com'),
  title: {
    default: 'Optimal Breaks',
    template: '%s | Optimal Breaks',
  },
  description:
    'Archive, magazine and guide to breakbeat culture—history, artists, scenes and dancefloor memory (EN/ES).',
  keywords: [
    'breakbeat',
    'breaks',
    'UK bass',
    'nu skool breaks',
    'big beat',
    'jungle',
    'drum and bass',
    'rave',
    'electronic music',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Optimal Breaks',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
