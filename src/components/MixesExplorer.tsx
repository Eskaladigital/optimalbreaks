'use client'

import { useState } from 'react'
import CardThumbnail from '@/components/CardThumbnail'
import ViewToggle, { type ViewMode } from '@/components/ViewToggle'
import type { Mix } from '@/types/database'

interface Props {
  mixes: Mix[]
  dict: { view_large: string; view_compact: string; view_list: string }
  lang: string
}

export default function MixesExplorer({ mixes, dict, lang }: Props) {
  const [view, setView] = useState<ViewMode>('compact')

  return (
    <div>
      <div className="flex justify-end mb-5">
        <ViewToggle view={view} setView={setView} labels={dict} />
      </div>

      {view === 'large' ? (
        <LargeGrid mixes={mixes} lang={lang} />
      ) : view === 'compact' ? (
        <CompactGrid mixes={mixes} lang={lang} />
      ) : (
        <ListView mixes={mixes} lang={lang} />
      )}
    </div>
  )
}

function PlayLink({ mix }: { mix: Mix }) {
  if (mix.embed_url) {
    return (
      <a href={mix.embed_url} target="_blank" rel="noopener noreferrer" className="absolute bottom-3 right-3 bg-[var(--ink)] text-[var(--yellow)] no-underline hover:bg-[var(--red)] hover:text-white transition-colors" style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, fontSize: '11px', letterSpacing: '2px', padding: '4px 12px', transform: 'rotate(2deg)' }}>
        ▶ PLAY
      </a>
    )
  }
  return (
    <div className="absolute bottom-3 right-3 bg-[var(--ink)] text-[var(--yellow)]" style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, fontSize: '11px', letterSpacing: '2px', padding: '4px 12px', transform: 'rotate(2deg)' }}>
      ▶ {mix.platform?.toUpperCase()}
    </div>
  )
}

function LargeGrid({ mixes, lang }: { mixes: Mix[]; lang: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-[18px]">
      {mixes.map((m) => (
        <div
          key={m.slug}
          className="border-[3px] border-[var(--ink)] relative transition-all duration-150 bg-[var(--paper)] sm:hover:rotate-[-1deg] sm:hover:shadow-[6px_6px_0_var(--ink)] overflow-hidden group"
        >
          <CardThumbnail src={m.image_url} alt={m.title} aspectClass="aspect-[16/10]" />
          <div className="p-5 sm:p-7 relative">
            <div className="absolute -top-[6px] left-[20px] w-[60px] h-[18px] z-[1]" style={{ background: 'var(--tape)', transform: 'rotate(-2deg)' }} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="cutout red" style={{ margin: 0 }}>{m.mix_type?.replace('_', ' ')}</span>
              <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '11px', color: 'var(--dim)' }}>
                {m.year} · {m.duration_minutes} min
              </span>
            </div>
            <div className="mt-3" style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 'clamp(14px, 2.5vw, 18px)', textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              {m.title}
            </div>
            <div className="mt-2" style={{ fontFamily: "'Darker Grotesque', sans-serif", fontWeight: 900, fontSize: '14px', color: 'var(--red)' }}>
              {m.artist_name}
            </div>
            <PlayLink mix={m} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CompactGrid({ mixes, lang }: { mixes: Mix[]; lang: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 border-4 border-[var(--ink)]">
      {mixes.map((m) => (
        <div
          key={m.slug}
          className="border-b-[3px] border-r-[3px] border-[var(--ink)] transition-all duration-150 hover:bg-[var(--yellow)] group flex flex-col overflow-hidden"
        >
          <CardThumbnail src={m.image_url} alt={m.title} aspectClass="aspect-square" />
          <div className="p-3 flex flex-col flex-grow min-h-0">
            <div style={{ fontFamily: "'Darker Grotesque', sans-serif", fontWeight: 900, fontSize: '11px', color: 'var(--red)' }}>
              {m.artist_name}
            </div>
            <div className="mt-1" style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 'clamp(11px, 2vw, 14px)', textTransform: 'uppercase', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {m.title}
            </div>
            <div className="flex gap-1 mt-1">
              <span className="cutout red" style={{ fontSize: '7px', padding: '0px 4px', margin: 0 }}>{m.mix_type?.replace('_', ' ')}</span>
            </div>
            {m.embed_url && (
              <a href={m.embed_url} target="_blank" rel="noopener noreferrer" className="mt-2 bg-[var(--ink)] text-[var(--yellow)] no-underline hover:bg-[var(--red)] hover:text-white transition-colors text-center" style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, fontSize: '9px', letterSpacing: '1px', padding: '2px 6px' }}>
                ▶ PLAY
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ListView({ mixes, lang }: { mixes: Mix[]; lang: string }) {
  return (
    <div className="border-4 border-[var(--ink)]">
      {mixes.map((m) => (
        <div
          key={m.slug}
          className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 border-b-[2px] border-[var(--ink)] transition-all duration-150 hover:bg-[var(--yellow)] group"
        >
          <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 overflow-hidden border-[2px] border-[var(--ink)]">
            <CardThumbnail src={m.image_url} alt={m.title} aspectClass="aspect-square" frameClass="" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="truncate" style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: 'clamp(12px, 2.5vw, 16px)', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
              {m.title}
            </div>
            <div className="mt-[2px]" style={{ fontFamily: "'Darker Grotesque', sans-serif", fontWeight: 900, fontSize: '12px', color: 'var(--red)' }}>
              {m.artist_name}
            </div>
          </div>
          <div className="hidden sm:flex gap-2 shrink-0 items-center">
            <span className="cutout red" style={{ fontSize: '8px', padding: '1px 6px', margin: 0 }}>{m.mix_type?.replace('_', ' ')}</span>
            <span className="cutout outline" style={{ fontSize: '8px', padding: '1px 6px', margin: 0 }}>{m.year}</span>
            {m.embed_url && (
              <a href={m.embed_url} target="_blank" rel="noopener noreferrer" className="bg-[var(--ink)] text-[var(--yellow)] no-underline hover:bg-[var(--red)] hover:text-white transition-colors" style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, fontSize: '9px', letterSpacing: '1px', padding: '2px 8px' }}>
                ▶
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
