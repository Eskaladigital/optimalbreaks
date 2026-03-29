// ============================================
// OPTIMAL BREAKS — Google Analytics 4 (gtag.js)
// Implementación estricta y directa. Solo carga tras consentimiento.
// ============================================

'use client'

import Script from 'next/script'
import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function AnalyticsTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (enabled && typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      let url = pathname
      const qs = searchParams.toString()
      if (qs) url += `?${qs}`
      
      ;(window as any).gtag('config', GA_ID, {
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

  if (!GA_ID || !enabled) return null

  // Usamos un <script> nativo para la inicialización en línea
  // para garantizar ejecución inmediata al cambiar el estado a true.
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <script
        id="ga-init"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <AnalyticsTracker enabled={enabled} />
      </Suspense>
    </>
  )
}
