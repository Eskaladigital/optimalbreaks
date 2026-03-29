// ============================================
// OPTIMAL BREAKS — Google Analytics 4 (gtag.js)
// Implementación estricta en JavaScript nativo.
// ============================================

'use client'

import Script from 'next/script'
import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Extender Window para evitar errores de TS
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
      
      window.gtag('config', GA_ID, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, enabled])

  return null
}

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // 1. Mirar la cookie inicial
    if (typeof document !== 'undefined' && document.cookie.includes('ob_cookie_consent=accepted')) {
      setEnabled(true)
    }

    // 2. Escuchar cuando el usuario le da a Aceptar
    const onConsent = (e: Event) => {
      const v = (e as CustomEvent<{ value?: string }>).detail?.value
      if (v === 'accepted') setEnabled(true)
    }
    window.addEventListener('ob-cookie-consent', onConsent)
    return () => window.removeEventListener('ob-cookie-consent', onConsent)
  }, [])

  // Inicializar dataLayer y gtag en JS puro, ya que React no ejecuta <script> inyectados dinámicamente
  if (enabled && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments)
      }
      window.gtag('js', new Date())
    }
  }

  if (!GA_ID || !enabled) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Suspense fallback={null}>
        <AnalyticsTracker enabled={enabled} />
      </Suspense>
    </>
  )
}
