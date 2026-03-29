// ============================================
// OPTIMAL BREAKS — Google Analytics 4 (gtag.js)
// ============================================

'use client'

import Script from 'next/script'
import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

function AnalyticsTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (enabled && typeof window !== 'undefined' && typeof window.gtag === 'function') {
      let url = pathname
      const qs = searchParams.toString()
      if (qs) url += `?${qs}`

      window.gtag('event', 'page_view', {
        page_path: url,
      })
    }
  }, [pathname, searchParams, enabled])

  return null
}

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof document !== 'undefined' && document.cookie.includes('ob_cookie_consent=accepted')) {
      setEnabled(true)
    }

    const onConsent = (e: Event) => {
      const v = (e as CustomEvent<{ value?: string }>).detail?.value
      if (v === 'accepted') setEnabled(true)
    }
    window.addEventListener('ob-cookie-consent', onConsent)
    return () => window.removeEventListener('ob-cookie-consent', onConsent)
  }, [])

  if (!GA_ID || !enabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: true });
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsTracker enabled={enabled} />
      </Suspense>
    </>
  )
}
