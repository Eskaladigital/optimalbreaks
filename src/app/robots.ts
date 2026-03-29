// ============================================
// OPTIMAL BREAKS — robots.txt
// ============================================

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/en/login',
        '/es/login',
        '/en/dashboard',
        '/es/dashboard',
        '/*/administrator',
      ],
    },
    sitemap: 'https://www.optimalbreaks.com/sitemap.xml',
  }
}
