// ============================================
// OPTIMAL BREAKS — GDPR Cookie Consent (ePrivacy)
// Granular categories: necessary (always on), analytics
// ============================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

/* ── types ─────────────────────────────────────────── */

export type CookieConsent = {
  necessary: true
  analytics: boolean
}

const COOKIE_NAME = 'ob_consent'
const COOKIE_MAX_AGE = 34_164_000 // ~13 months (EU max)

/* ── helpers ───────────────────────────────────────── */

function writeCookie(consent: CookieConsent) {
  const val = encodeURIComponent(JSON.stringify(consent))
  const secure = window.location.protocol === 'https:' ? ';Secure' : ''
  document.cookie = `${COOKIE_NAME}=${val};max-age=${COOKIE_MAX_AGE};path=/;SameSite=Lax${secure}`
}

export function readConsent(): CookieConsent | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

/* ── component ─────────────────────────────────────── */

export default function CookieBanner({ lang }: { lang: string }) {
  const es = lang === 'es'
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    const saved = readConsent()
    if (!saved) {
      setVisible(true)
    } else {
      setAnalytics(saved.analytics)
    }

    const openBanner = () => {
      const saved = readConsent()
      if (saved) setAnalytics(saved.analytics)
      setShowSettings(true)
      setVisible(true)
    }
    window.addEventListener('ob-open-cookie-banner', openBanner)
    return () => window.removeEventListener('ob-open-cookie-banner', openBanner)
  }, [])

  const save = useCallback((consent: CookieConsent) => {
    writeCookie(consent)
    window.dispatchEvent(
      new CustomEvent('ob-cookie-consent', { detail: consent }),
    )
    setVisible(false)
    setShowSettings(false)
  }, [])

  const acceptAll = () => save({ necessary: true, analytics: true })
  const rejectAll = () => save({ necessary: true, analytics: false })
  const saveSelection = () => save({ necessary: true, analytics })

  if (!visible) return null

  const font = { fontFamily: "'Courier Prime', monospace" } as const
  const btnBase =
    'px-5 py-2.5 border-[3px] border-[var(--ink)] text-center transition-all'
  const btnOutline = `${btnBase} text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]`
  const btnPrimary = `${btnBase} bg-[var(--yellow)] text-[var(--ink)] shadow-[2px_2px_0_0_var(--ink)] hover:translate-y-[2px] hover:shadow-none`
  const btnStyle = { ...font, fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[200] bg-[var(--paper)] text-[var(--ink)] border-t-[6px] border-[var(--ink)] shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
      role="dialog"
      aria-modal="true"
      aria-label={es ? 'Consentimiento de cookies' : 'Cookie consent'}
    >
      <div className="max-w-5xl mx-auto p-5 sm:p-6">
        {/* ── header ── */}
        <h3
          className="font-black text-lg uppercase tracking-tight mb-2"
          style={{ fontFamily: "'Unbounded', sans-serif" }}
        >
          {es ? 'Privacidad y Cookies' : 'Privacy & Cookies'}
        </h3>

        {/* ── description ── */}
        <p
          className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-4"
          style={font}
        >
          {es
            ? 'Utilizamos cookies estrictamente necesarias para el funcionamiento del sitio. Además, con tu permiso, usamos cookies analíticas (Google Analytics) para entender cómo se utiliza la web y mejorar la experiencia. Puedes aceptar todas, rechazar las no esenciales, o configurar tus preferencias. '
            : 'We use strictly necessary cookies for the site to work. With your permission, we also use analytics cookies (Google Analytics) to understand how you use the site and improve your experience. You can accept all, reject non-essential, or customize your preferences. '}
          <Link
            href={`/${lang}/cookies`}
            className="font-bold underline decoration-[var(--red)] underline-offset-2 hover:text-[var(--red)]"
          >
            {es ? 'Política de cookies' : 'Cookie policy'}
          </Link>
        </p>

        {/* ── settings panel ── */}
        {showSettings && (
          <div className="mb-4 border-[3px] border-[var(--ink)] divide-y-[2px] divide-[var(--ink)]">
            {/* necessary */}
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="font-black text-sm uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
                  {es ? 'Necesarias' : 'Necessary'}
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1" style={font}>
                  {es
                    ? 'Imprescindibles: sesión, idioma, preferencia de cookies. No se pueden desactivar.'
                    : 'Essential: session, language, cookie preferences. Cannot be disabled.'}
                </p>
              </div>
              <div
                className="relative w-12 h-7 rounded-full bg-[var(--ink)] cursor-not-allowed opacity-60 shrink-0"
                title={es ? 'Siempre activas' : 'Always active'}
              >
                <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-[var(--yellow)]" />
              </div>
            </div>

            {/* analytics */}
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="font-black text-sm uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
                  {es ? 'Analíticas' : 'Analytics'}
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1" style={font}>
                  {es
                    ? 'Google Analytics: páginas visitadas, tiempo de permanencia. Datos anónimos para mejorar el sitio.'
                    : 'Google Analytics: pages visited, time spent. Anonymous data to improve the site.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics((v) => !v)}
                className={`relative w-12 h-7 rounded-full shrink-0 transition-colors border-2 border-[var(--ink)] ${
                  analytics ? 'bg-[var(--ink)]' : 'bg-[var(--paper-dark)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                    analytics
                      ? 'translate-x-[22px] bg-[var(--yellow)]'
                      : 'translate-x-[3px] bg-[var(--ink)]'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── buttons ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          {showSettings ? (
            <button onClick={saveSelection} className={btnPrimary} style={btnStyle}>
              {es ? 'Guardar preferencias' : 'Save preferences'}
            </button>
          ) : (
            <>
              <button onClick={rejectAll} className={btnOutline} style={btnStyle}>
                {es ? 'Rechazar todas' : 'Reject all'}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={btnOutline}
                style={btnStyle}
              >
                {es ? 'Configurar' : 'Customize'}
              </button>
              <button onClick={acceptAll} className={btnPrimary} style={btnStyle}>
                {es ? 'Aceptar todas' : 'Accept all'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
