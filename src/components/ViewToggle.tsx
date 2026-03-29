'use client'

export type ViewMode = 'large' | 'compact' | 'list' | 'calendar'

interface ViewToggleProps {
  view: ViewMode
  setView: (v: ViewMode) => void
  labels: {
    view_large: string
    view_compact: string
    view_list: string
    view_calendar?: string
  }
}

export default function ViewToggle({ view, setView, labels }: ViewToggleProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 border-[3px] border-[var(--ink)] bg-[var(--paper)] p-[2px]">
      <ViewBtn active={view === 'large'} onClick={() => setView('large')} label={labels.view_large}>
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="0.5" /><rect x="9" y="1" width="6" height="6" rx="0.5" /><rect x="1" y="9" width="6" height="6" rx="0.5" /><rect x="9" y="9" width="6" height="6" rx="0.5" /></svg>
      </ViewBtn>
      <ViewBtn active={view === 'compact'} onClick={() => setView('compact')} label={labels.view_compact}>
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="3.5" height="3.5" rx="0.3" /><rect x="6.25" y="1" width="3.5" height="3.5" rx="0.3" /><rect x="11.5" y="1" width="3.5" height="3.5" rx="0.3" /><rect x="1" y="6.25" width="3.5" height="3.5" rx="0.3" /><rect x="6.25" y="6.25" width="3.5" height="3.5" rx="0.3" /><rect x="11.5" y="6.25" width="3.5" height="3.5" rx="0.3" /><rect x="1" y="11.5" width="3.5" height="3.5" rx="0.3" /><rect x="6.25" y="11.5" width="3.5" height="3.5" rx="0.3" /><rect x="11.5" y="11.5" width="3.5" height="3.5" rx="0.3" /></svg>
      </ViewBtn>
      <ViewBtn active={view === 'list'} onClick={() => setView('list')} label={labels.view_list}>
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.5" rx="0.3" /><rect x="1" y="6.75" width="14" height="2.5" rx="0.3" /><rect x="1" y="11.5" width="14" height="2.5" rx="0.3" /></svg>
      </ViewBtn>
      {labels.view_calendar ? (
        <ViewBtn active={view === 'calendar'} onClick={() => setView('calendar')} label={labels.view_calendar}>
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M2 5h12v9H2V5zm0 2h12M5 2.5v3M11 2.5v3" fill="none" stroke="currentColor" strokeWidth="1.25" />
            <rect x="4" y="9" width="2.2" height="2.2" rx="0.25" />
            <rect x="6.9" y="9" width="2.2" height="2.2" rx="0.25" />
            <rect x="9.8" y="9" width="2.2" height="2.2" rx="0.25" />
          </svg>
        </ViewBtn>
      ) : null}
    </div>
  )
}

function ViewBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${active ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--ink)] hover:bg-[var(--ink)]/10'}`}
      style={{ fontFamily: "'Courier Prime', monospace" }}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
