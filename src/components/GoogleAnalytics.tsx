// ============================================
// OPTIMAL BREAKS — Google Analytics 4 (gtag.js) con Consent Mode v2
// Implementación recomendada por Google para Next.js App Router y RGPD.
// ============================================

'use client'

import Script from 'next/script'
import { useEffect } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function updateGoogleConsent(granted: boolean) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    const state = granted ? 'granted' : 'denied'
    ;(window as any).gtag('consent', 'update', {
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
    })
  }
}

export default function GoogleAnalytics() {
  // 1. Escuchar los eventos del banner de cookies
  useEffect(() => {
    // Si la cookie ya existía al cargar la página, actualizamos a granted
    if (typeof document !== 'undefined' && document.cookie.includes('ob_cookie_consent=accepted')) {
      updateGoogleConsent(true)
    }

    const onConsent = (e: Event) => {
      const v = (e as CustomEvent<{ value?: string }>).detail?.value
      updateGoogleConsent(v === 'accepted')
    }
    window.addEventListener('ob-cookie-consent', onConsent)
    return () => window.removeEventListener('ob-cookie-consent', onConsent)
  }, [])

  if (!GA_ID) return null

  return (
    <>
      {/* 2. Configurar Consent Mode v2 por defecto (denied) antes de inicializar GA */}
      <Script id="google-analytics-consent" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);}
          
          // Todo denegado por defecto hasta que el usuario acepte (Consent Mode v2)
          window.gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500
          });
          
          window.gtag('js', new Date());
          window.gtag('config', '${GA_ID}');
        `}
      </Script>
      {/* 3. Cargar el script de GA4. Operará en modo cookieless hasta que se actualice el consentimiento */}
      <Script 
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} 
        strategy="afterInteractive" 
      />
    </>
  )
}
