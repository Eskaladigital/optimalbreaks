// ============================================
// OPTIMAL BREAKS — DJ Deck with Audio Playback
// Mobile: 2 platters on top, mixer below
// Desktop: platter | mixer | platter
// Scratch, crossfader, real audio
// ============================================

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface DjDeckProps {
  dict: any
}

const TRACKS = [
  { file: '/music/breakbeat_odyssey.mp3', title: 'BREAKBEAT ODYSSEY', artist: 'OPTIMAL BREAKS' },
  { file: '/music/epic_breakbeat_odyssey.mp3', title: 'EPIC ODYSSEY', artist: 'OPTIMAL BREAKS' },
  { file: '/music/epic_groove_odyssey.mp3', title: 'GROOVE ODYSSEY', artist: 'OPTIMAL BREAKS' },
  { file: '/music/the_intensity_that_transforms_the_limits.mp3', title: 'INTENSITY', artist: 'OPTIMAL BREAKS' },
  { file: '/music/the_movement_that_ignites_the_limits.mp3', title: 'MOVEMENT', artist: 'OPTIMAL BREAKS' },
  { file: '/music/epic_breakbeat_odyssey (1).mp3', title: 'EPIC ODYSSEY II', artist: 'OPTIMAL BREAKS' },
]

export default function DjDeck({ dict }: DjDeckProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [leftActive, setLeftActive] = useState(true)
  const [rightActive, setRightActive] = useState(true)
  const [crossfader, setCrossfader] = useState(50)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const [scratchingLeft, setScratchingLeft] = useState(false)
  const [scratchingRight, setScratchingRight] = useState(false)
  const scratchStartY = useRef(0)
  const scratchStartTime = useRef(0)
  const [leftRotation, setLeftRotation] = useState(0)
  const [rightRotation, setRightRotation] = useState(0)
  const animFrameRef = useRef<number>(0)

  // Init audio
  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(TRACKS[currentTrack].file)
      audio.crossOrigin = 'anonymous'
      audio.preload = 'auto'
      audioRef.current = audio
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
      audio.addEventListener('ended', () => {
        const next = (currentTrack + 1) % TRACKS.length
        setCurrentTrack(next)
        audio.src = TRACKS[next].file
        audio.play()
      })
    }
    if (!audioCtxRef.current) {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaElementSource(audioRef.current)
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(ctx.destination)
      sourceRef.current = source
      gainRef.current = gain
    }
  }, [currentTrack])

  // Animate platters + progress
  useEffect(() => {
    const tick = () => {
      if (audioRef.current && isPlaying && !scratchingLeft && !scratchingRight) {
        setProgress(audioRef.current.currentTime)
        const rpm = 33.33 / 60
        setLeftRotation((r) => r + rpm * 6 * 2)
        setRightRotation((r) => r + rpm * 6 * 2)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isPlaying, scratchingLeft, scratchingRight])

  // Crossfader volume
  useEffect(() => {
    if (gainRef.current) {
      const normalizedCf = crossfader / 100
      const vol = 1 - Math.abs(normalizedCf - 0.5) * 0.4
      gainRef.current.gain.setValueAtTime(vol, audioCtxRef.current?.currentTime || 0)
    }
  }, [crossfader])

  const togglePlay = () => {
    initAudio()
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  const toggleDeckLeft = () => setLeftActive((v) => !v)
  const toggleDeckRight = () => setRightActive((v) => !v)

  // Scratch
  const handleScratchStart = (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
    if (!audioRef.current || !isPlaying) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    scratchStartY.current = clientY
    scratchStartTime.current = audioRef.current.currentTime
    if (side === 'left') setScratchingLeft(true)
    else setScratchingRight(true)
    audioRef.current.playbackRate = 0
  }

  const handleScratchMove = (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => {
    if ((side === 'left' && !scratchingLeft) || (side === 'right' && !scratchingRight)) return
    if (!audioRef.current) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const delta = (scratchStartY.current - clientY) * 0.05
    const newTime = Math.max(0, Math.min(scratchStartTime.current + delta, duration))
    audioRef.current.currentTime = newTime
    const rotDelta = (scratchStartY.current - clientY) * 2
    if (side === 'left') setLeftRotation((r) => r + rotDelta * 0.3)
    else setRightRotation((r) => r + rotDelta * 0.3)
    scratchStartY.current = clientY
    scratchStartTime.current = newTime
  }

  const handleScratchEnd = () => {
    setScratchingLeft(false)
    setScratchingRight(false)
    if (audioRef.current && isPlaying) audioRef.current.playbackRate = 1
  }

  const switchTrack = (direction: 1 | -1) => {
    const next = (currentTrack + direction + TRACKS.length) % TRACKS.length
    setCurrentTrack(next)
    if (audioRef.current) {
      audioRef.current.src = TRACKS[next].file
      if (isPlaying) audioRef.current.play()
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  const track = TRACKS[currentTrack]

  return (
    <div className="relative z-[2] max-w-[880px] mx-auto bg-[var(--ink)] border-4 border-[var(--ink)] p-3 sm:p-5 shadow-[8px_8px_0_rgba(0,0,0,0.15)]">
      {/* Tape */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[80px] sm:w-[100px] h-[22px] z-10" style={{ background: 'var(--tape)' }} />

      {/* Top bar — track selector */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-dashed border-white/10 gap-2">
        <div className="hidden sm:block" style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '14px', color: 'var(--yellow)', letterSpacing: '3px' }}>
          {dict.deck_brand}
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-center">
          <button onClick={() => switchTrack(-1)} className="text-white/30 hover:text-[var(--yellow)] transition-colors text-lg px-1">◄</button>
          <div className="text-center truncate max-w-[180px] sm:max-w-[200px]" style={{ fontFamily: "'Courier Prime', monospace", fontSize: '9px', color: 'var(--yellow)', letterSpacing: '1px' }}>
            {track.title}
          </div>
          <button onClick={() => switchTrack(1)} className="text-white/30 hover:text-[var(--yellow)] transition-colors text-lg px-1">►</button>
        </div>
        <div className="hidden lg:block" style={{ fontFamily: "'Courier Prime', monospace", fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}>
          {dict.deck_model}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 px-1">
        <div
          className="h-[3px] bg-white/10 rounded-full relative cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current) return
            const rect = e.currentTarget.getBoundingClientRect()
            audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
          }}
        >
          <div className="h-full bg-[var(--red)] rounded-full transition-all duration-100" style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{fmt(progress)}</span>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{duration ? fmt(duration) : '0:00'}</span>
        </div>
      </div>

      {/* =============================================
          MOBILE: platters row on top, mixer below
          DESKTOP: platter | mixer | platter
          ============================================= */}

      {/* --- DESKTOP LAYOUT (md+) --- */}
      <div className="hidden md:grid grid-cols-[1fr_170px_1fr] gap-3 items-center">
        <Platter side="left" rotation={leftRotation} active={leftActive} playing={isPlaying} scratching={scratchingLeft} track={track} labelColor="red" onToggle={toggleDeckLeft} onScratchStart={handleScratchStart} onScratchMove={handleScratchMove} onScratchEnd={handleScratchEnd} deckLabel={dict.deck_a} dictPlay={dict.play} dictStop={dict.stop} />
        <MixerPanel dict={dict} isPlaying={isPlaying} crossfader={crossfader} setCrossfader={setCrossfader} togglePlay={togglePlay} layout="vertical" />
        <Platter side="right" rotation={rightRotation} active={rightActive} playing={isPlaying} scratching={scratchingRight} track={track} labelColor="yellow" onToggle={toggleDeckRight} onScratchStart={handleScratchStart} onScratchMove={handleScratchMove} onScratchEnd={handleScratchEnd} deckLabel={dict.deck_b} dictPlay={dict.play} dictStop={dict.stop} />
      </div>

      {/* --- MOBILE LAYOUT (<md) --- */}
      <div className="md:hidden">
        {/* Two platters side by side */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Platter side="left" rotation={leftRotation} active={leftActive} playing={isPlaying} scratching={scratchingLeft} track={track} labelColor="red" onToggle={toggleDeckLeft} onScratchStart={handleScratchStart} onScratchMove={handleScratchMove} onScratchEnd={handleScratchEnd} deckLabel={dict.deck_a} dictPlay={dict.play} dictStop={dict.stop} compact />
          <Platter side="right" rotation={rightRotation} active={rightActive} playing={isPlaying} scratching={scratchingRight} track={track} labelColor="yellow" onToggle={toggleDeckRight} onScratchStart={handleScratchStart} onScratchMove={handleScratchMove} onScratchEnd={handleScratchEnd} deckLabel={dict.deck_b} dictPlay={dict.play} dictStop={dict.stop} compact />
        </div>
        {/* Mixer below */}
        <MixerPanel dict={dict} isPlaying={isPlaying} crossfader={crossfader} setCrossfader={setCrossfader} togglePlay={togglePlay} layout="horizontal" />
      </div>
    </div>
  )
}

/* =============================================
   PLATTER — Turntable with tonearm
   compact = mobile smaller version
   ============================================= */
function Platter({
  side, rotation, active, playing, scratching, track, labelColor, onToggle,
  onScratchStart, onScratchMove, onScratchEnd, deckLabel, dictPlay, dictStop, compact = false,
}: {
  side: 'left' | 'right'; rotation: number; active: boolean; playing: boolean; scratching: boolean
  track: { title: string; artist: string }; labelColor: string; onToggle: () => void
  onScratchStart: (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void
  onScratchMove: (side: 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void
  onScratchEnd: () => void
  deckLabel: string; dictPlay: string; dictStop: string; compact?: boolean
}) {
  const labelBg = labelColor === 'red'
    ? 'radial-gradient(circle, var(--red) 0%, #8b0000 100%)'
    : 'radial-gradient(circle, var(--yellow) 0%, #b8a800 100%)'
  const labelText = labelColor === 'red' ? 'white' : 'var(--ink)'

  return (
    <div style={{ opacity: active ? 1 : 0.4, transition: 'opacity 0.2s' }}>
      <div className={`relative flex items-center justify-center bg-[#0e0e12] rounded-md border-2 border-white/[0.06] ${compact ? 'aspect-square' : 'aspect-square'}`}>
        {/* Vinyl platter */}
        <div
          className={`${compact ? 'w-[85%]' : 'w-[82%]'} aspect-square rounded-full relative select-none`}
          style={{
            background: 'repeating-radial-gradient(circle at center, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)',
            border: '2px solid rgba(255,255,255,0.08)',
            transform: `rotate(${rotation}deg)`,
            cursor: scratching ? 'grabbing' : 'grab',
            transition: scratching ? 'none' : 'transform 0.05s linear',
          }}
          onMouseDown={(e) => onScratchStart(side, e)}
          onMouseMove={(e) => onScratchMove(side, e)}
          onMouseUp={onScratchEnd}
          onMouseLeave={onScratchEnd}
          onTouchStart={(e) => onScratchStart(side, e)}
          onTouchMove={(e) => onScratchMove(side, e)}
          onTouchEnd={onScratchEnd}
        >
          {/* Label center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34%] aspect-square rounded-full flex items-center justify-center z-[2]">
            <div className="w-full h-full rounded-full flex flex-col items-center justify-center" style={{ background: labelBg, color: labelText }}>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: compact ? '5px' : '7px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {track.artist}
              </div>
              <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: compact ? '4px' : '5.5px', letterSpacing: '1px', marginTop: '1px', opacity: 0.7 }}>
                {track.title}
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] sm:w-[7px] sm:h-[7px] rounded-full bg-[#0e0e12] border border-white/[0.15]" />
          </div>
          {/* Groove marker */}
          <div className="absolute top-[10%] left-1/2 w-[1px] h-[15%] bg-white/10" />
        </div>

        {/* Tonearm */}
        <div
          className={`absolute top-[6px] right-[8px] sm:right-[10px] z-[5] w-[2px] sm:w-[3px] rounded-[2px] transition-transform duration-500 ${compact ? 'h-[40%]' : 'h-1/2'}`}
          style={{
            background: 'linear-gradient(180deg, #666, #444)',
            transformOrigin: 'top center',
            transform: playing && active && !scratching ? 'rotate(8deg)' : 'rotate(-15deg)',
          }}
        >
          <div className="absolute -top-[3px] -left-[2px] sm:-left-[3px] w-[6px] h-[6px] sm:w-[9px] sm:h-[9px] rounded-full bg-[#555]" />
          <div className="absolute -bottom-[2px] -left-[1px] sm:-left-[2px] w-[5px] h-[7px] sm:w-[7px] sm:h-[10px] bg-[#777] rounded-[1px]" />
        </div>
      </div>

      {/* Deck label + button */}
      <div className={`text-center ${compact ? 'mt-1' : 'mt-2'}`} style={{ fontFamily: "'Courier Prime', monospace", fontSize: compact ? '7px' : '9px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)' }}>
        {deckLabel}
      </div>
      <div className={`flex justify-center ${compact ? 'mt-1' : 'mt-2'}`}>
        <button
          onClick={onToggle}
          className={`border-2 cursor-pointer transition-all duration-100 ${compact ? 'px-2 py-[3px]' : 'px-[18px] py-[5px]'} ${active ? 'bg-[var(--red)] text-white border-[var(--red)]' : 'bg-transparent text-[var(--yellow)] border-white/[0.15] hover:bg-[var(--yellow)] hover:text-[var(--ink)] hover:border-[var(--yellow)]'}`}
          style={{ fontFamily: "'Courier Prime', monospace", fontSize: compact ? '8px' : '10px', letterSpacing: compact ? '1px' : '3px', textTransform: 'uppercase' }}
        >
          {active ? `▶ ${dictPlay}` : `■ ${dictStop}`}
        </button>
      </div>
    </div>
  )
}

/* =============================================
   MIXER PANEL
   layout="vertical" = desktop (tall column)
   layout="horizontal" = mobile (wide row)
   ============================================= */
function MixerPanel({
  dict, isPlaying, crossfader, setCrossfader, togglePlay, layout,
}: {
  dict: any; isPlaying: boolean; crossfader: number; setCrossfader: (v: number) => void
  togglePlay: () => void; layout: 'vertical' | 'horizontal'
}) {
  const isH = layout === 'horizontal'

  return (
    <div className={`bg-[#0a0a0e] border border-white/[0.06] rounded-md ${isH ? 'p-3 flex flex-wrap items-center justify-center gap-3' : 'p-3 flex flex-col gap-3 items-center'}`}>
      {/* Label */}
      <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '7px', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
        {dict.mixer}
      </div>

      {/* VU Meters */}
      <div className={`flex gap-[5px] items-end p-[6px] bg-[#070709] rounded-[3px] border border-white/[0.04] ${isH ? 'h-[50px]' : 'h-[70px]'}`}>
        {[
          { color: 'var(--acid)', min: 8, max: 50, delay: 0 },
          { color: 'var(--acid)', min: 12, max: 60, delay: 0.1 },
          { color: 'var(--yellow)', min: 6, max: 45, delay: 0.2 },
          { color: 'var(--orange)', min: 10, max: 55, delay: 0.15 },
          { color: 'var(--red)', min: 5, max: 40, delay: 0.25 },
          { color: 'var(--red)', min: 8, max: 35, delay: 0.05 },
        ].map((bar, i) => (
          <div
            key={i}
            className={`${isH ? 'w-[5px]' : 'w-[7px]'} rounded-[2px]`}
            style={{
              background: bar.color,
              '--min': `${isPlaying ? (isH ? bar.min * 0.6 : bar.min) : 4}px`,
              '--max': `${isPlaying ? (isH ? bar.max * 0.6 : bar.max) : 6}px`,
              animation: `vuBounce ${isPlaying ? '0.8' : '2'}s ease-in-out infinite`,
              animationDelay: `${bar.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Knobs — 2x2 on desktop, inline on mobile */}
      <div className={`${isH ? 'flex gap-3' : 'grid grid-cols-2 gap-[6px] w-full'}`}>
        <Knob label="HI" colorClass="bg-[var(--acid)]" compact={isH} />
        <Knob label="MID" colorClass="bg-[var(--uv)]" compact={isH} />
        {!isH && <Knob label="LOW" colorClass="bg-[var(--pink)]" compact={false} />}
        {!isH && <Knob label="FX" colorClass="bg-[var(--cyan)]" compact={false} />}
      </div>
      {isH && (
        <div className="flex gap-3">
          <Knob label="LOW" colorClass="bg-[var(--pink)]" compact />
          <Knob label="FX" colorClass="bg-[var(--cyan)]" compact />
        </div>
      )}

      {/* PLAY button */}
      <button
        onClick={togglePlay}
        className={`border-2 cursor-pointer transition-all duration-150 ${isH ? 'px-6 py-2' : 'w-full py-3'} ${isPlaying ? 'bg-[var(--red)] border-[var(--red)] text-white' : 'bg-[var(--yellow)] border-[var(--yellow)] text-[var(--ink)]'}`}
        style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: isH ? '12px' : '14px', letterSpacing: '3px', textTransform: 'uppercase' }}
      >
        {isPlaying ? '■ PAUSE' : '▶ PLAY'}
      </button>

      {/* BPM */}
      <div className={`bg-[#070709] border border-white/[0.04] rounded-[3px] text-center ${isH ? 'px-4 py-2' : 'p-[6px] w-full'}`} style={{ animation: isPlaying ? 'bpmPulse 1s ease-in-out infinite' : 'none' }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: isH ? '18px' : '24px', color: 'var(--yellow)', textShadow: isPlaying ? '0 0 8px rgba(247,231,51,0.3)' : 'none' }}>
          135
        </div>
        <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: '7px', letterSpacing: '3px', color: 'var(--red)' }}>
          {dict.bpm}
        </div>
      </div>

      {/* Crossfader */}
      <div className={`bg-[#070709] rounded-[3px] border border-white/[0.04] ${isH ? 'px-3 py-2 flex-1 min-w-[120px] max-w-[200px]' : 'w-full p-[6px]'}`}>
        <div className="mb-1" style={{ fontFamily: "'Courier Prime', monospace", fontSize: '7px', letterSpacing: '3px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
          {dict.crossfader}
        </div>
        <input
          type="range" min="0" max="100" value={crossfader}
          onChange={(e) => setCrossfader(Number(e.target.value))}
          className="w-full h-[6px] bg-[#222] rounded-[3px] cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-[#777] [&::-webkit-slider-thumb]:to-[#444] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#999] [&::-webkit-slider-thumb]:rounded-[2px] [&::-webkit-slider-thumb]:cursor-grab"
        />
        <div className="flex justify-between mt-1">
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '7px', color: 'rgba(255,255,255,0.2)' }}>A</span>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '7px', color: 'rgba(255,255,255,0.2)' }}>B</span>
        </div>
      </div>
    </div>
  )
}

/* =============================================
   KNOB
   ============================================= */
function Knob({ label, colorClass, compact = false }: { label: string; colorClass: string; compact?: boolean }) {
  const [angle, setAngle] = useState(0)
  return (
    <div className="text-center">
      <label className="block mb-1" style={{ fontFamily: "'Courier Prime', monospace", fontSize: '7px', letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </label>
      <div
        className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border-2 border-[#555] mx-auto relative cursor-pointer transition-transform duration-200`}
        style={{ background: 'conic-gradient(from 220deg, #333, #555, #333)', transform: `rotate(${angle}deg)` }}
        onClick={() => setAngle((a) => (a + 30) % 360)}
      >
        <div className={`absolute top-[2px] sm:top-[3px] left-1/2 -translate-x-1/2 w-[2px] ${compact ? 'h-[6px]' : 'h-[8px]'} rounded-[1px] ${colorClass}`} />
      </div>
    </div>
  )
}
