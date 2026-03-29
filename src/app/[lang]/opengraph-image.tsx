// ============================================
// OPTIMAL BREAKS — Open Graph image (1200×630)
// ============================================

import { ImageResponse } from 'next/og'
import type { Locale } from '@/lib/i18n-config'
import { i18n } from '@/lib/i18n-config'
import { DefaultOgImage } from '@/lib/DefaultOgImage'

export const alt = 'Optimal Breaks — The breakbeat bible'

export const size = { width: 1200, height: 630 }

export const contentType = 'image/png'

type Props = { params: Promise<{ lang: string }> }

export default async function Image({ params }: Props) {
  const { lang: raw } = await params
  const lang: Locale = i18n.locales.includes(raw as Locale) ? (raw as Locale) : i18n.defaultLocale

  return new ImageResponse(<DefaultOgImage lang={lang} />, {
    ...size,
  })
}
