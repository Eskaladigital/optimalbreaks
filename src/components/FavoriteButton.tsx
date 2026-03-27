// ============================================
// OPTIMAL BREAKS — Favorite / Save Button
// ============================================

'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  isFavorite: boolean
  onToggle: () => void
  lang: string
  label?: string
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ isFavorite, onToggle, lang, label, size = 'md' }: FavoriteButtonProps) {
  const { user } = useAuth()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/${lang}/login`)
      return
    }
    onToggle()
  }

  const isSm = size === 'sm'

  return (
    <button
      onClick={handleClick}
      className={`border-2 cursor-pointer transition-all duration-150 ${
        isFavorite
          ? 'bg-[var(--red)] border-[var(--red)] text-white'
          : 'bg-transparent border-[var(--ink)]/20 text-[var(--ink)]/40 hover:border-[var(--red)] hover:text-[var(--red)]'
      } ${isSm ? 'px-2 py-1' : 'px-3 py-[6px]'}`}
      style={{
        fontFamily: "'Courier Prime', monospace",
        fontWeight: 700,
        fontSize: isSm ? '9px' : '10px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}
      title={isFavorite ? (lang === 'es' ? 'Quitar favorito' : 'Remove favorite') : (lang === 'es' ? 'Añadir favorito' : 'Add favorite')}
    >
      {isFavorite ? '★' : '☆'} {label || ''}
    </button>
  )
}
