// ============================================
// OPTIMAL BREAKS — Root Layout
// ============================================

import type { Metadata } from 'next'
import { generatedOgImageUrl, SITE_URL } from '@/lib/seo'

const defaultOg = generatedOgImageUrl('en')
const rootTitle = 'The breakbeat bible — archive, history and culture'
const rootDescription =
  'Breakbeat history from the Bronx to UK bass: timeline, artists, scenes, labels, events, mixes and blog. Bilingual archive (EN/ES).'

export const metadata: Metadata = {
  metadataBase: new URL('https://optimalbreaks.com'),
  title: {
    default: `${rootTitle} | Optimal Breaks`,
    template: '%s | Optimal Breaks',
  },
  description: rootDescription,
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
    url: `${SITE_URL}/en`,
    title: rootTitle,
    description: rootDescription,
    siteName: 'Optimal Breaks',
    locale: 'en_US',
    alternateLocale: ['es_ES'],
    images: [{ url: defaultOg, width: 1200, height: 630, alt: 'Optimal Breaks — The breakbeat bible' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: rootTitle,
    description: rootDescription,
    images: [defaultOg],
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
