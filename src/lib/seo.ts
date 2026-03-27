// ============================================
// OPTIMAL BREAKS — SEO helpers (metadata, canonical, OG)
// ============================================

import type { Metadata } from 'next'
import { getDictionary } from '@/lib/dictionaries'
import type { Locale } from '@/lib/i18n-config'

export const SITE_URL = 'https://optimalbreaks.com' as const

export type SeoStaticKey =
  | 'home'
  | 'history'
  | 'artists'
  | 'labels'
  | 'events'
  | 'scenes'
  | 'blog'
  | 'mixes'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'cookies'

type SeoDict = {
  site_name: string
  default_keywords: string
} & Record<SeoStaticKey, { title: string; description: string }>

export async function staticPageMetadata(lang: Locale, path: string, key: SeoStaticKey): Promise<Metadata> {
  const dict = await getDictionary(lang)
  const seo = dict.seo as SeoDict
  const page = seo[key]
  const siteName = seo.site_name
  const url = `${SITE_URL}/${lang}${path}`

  return {
    title: page.title,
    description: page.description,
    keywords: seo.default_keywords.split(',').map((k) => k.trim()),
    alternates: {
      canonical: url,
      languages: {
        es: `${SITE_URL}/es${path}`,
        en: `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName,
      locale: lang === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  }
}

export function detailPageMetadata(
  lang: Locale,
  path: string,
  siteName: string,
  title: string,
  description: string | undefined,
  ogType: 'website' | 'article' | 'profile' = 'website',
): Metadata {
  const url = `${SITE_URL}/${lang}${path}`
  const desc = description?.trim() || ''

  return {
    title,
    description: desc || undefined,
    alternates: {
      canonical: url,
      languages: {
        es: `${SITE_URL}/es${path}`,
        en: `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      title,
      description: desc || undefined,
      url,
      siteName,
      locale: lang === 'es' ? 'es_ES' : 'en_US',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc || undefined,
    },
  }
}

export async function siteNameForLang(lang: Locale): Promise<string> {
  const dict = await getDictionary(lang)
  return (dict.seo as SeoDict).site_name
}
