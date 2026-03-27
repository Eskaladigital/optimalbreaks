// ============================================
// OPTIMAL BREAKS — Event Status Button
// wishlist → attending → attended → none
// ============================================

'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

type Status = 'wishlist' | 'attending' | 'attended' | null

interface EventStatusButtonProps {
  status: Status
  onSetStatus: (status: Status) => void
  lang: string
}

const STATUS_CONFIG: Record<string, { label_en: string; label_es: string; color: string; icon: string }> = {
  wishlist: { label_en: 'WISHLIST', label_es: 'QUIERO IR', color: 'var(--uv)', icon: '♡' },
  attending: { label_en: 'GOING', label_es: 'VOY', color: 'var(--acid)', icon: '✓' },
  attended: { label_en: 'ATTENDED', label_es: 'FUI', color: 'var(--yellow)', icon: '★' },
}

export default function EventStatusButton({ status, onSetStatus, lang }: EventStatusButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const es = lang === 'es'

  const handleClick = (newStatus: Status) => {
    if (!user) { router.push(`/${lang}/login`); return }
    onSetStatus(status === newStatus ? null : newStatus)
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(STATUS_CONFIG).map(([key, conf]) => {
        const active = status === key
        return (
          <button
            key={key}
            onClick={() => handleClick(key as Status)}
            className={`border-2 cursor-pointer transition-all duration-150 px-2 py-1 ${
              active
                ? 'text-white'
                : 'bg-transparent text-[var(--ink)]/40 hover:text-[var(--ink)]'
            }`}
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontWeight: 700,
              fontSize: '9px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: active ? conf.color : 'transparent',
              borderColor: active ? conf.color : 'rgba(26,26,26,0.15)',
              color: active ? (key === 'attended' ? 'var(--ink)' : 'white') : undefined,
            }}
          >
            {conf.icon} {es ? conf.label_es : conf.label_en}
          </button>
        )
      })}
    </div>
  )
}
