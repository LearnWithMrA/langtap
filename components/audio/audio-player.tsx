// ─────────────────────────────────────────────
// File: components/audio/audio-player.tsx
// Purpose: Translucent lo-fi background music player. Shuffled
//          playback of CC0 tracks. Play/pause toggle with skip
//          button. Shows current track title. Audio only fetched
//          on user interaction, never on page load.
// Depends on: hooks/useLofiPlayer.ts, hooks/useKeySound.ts
// ─────────────────────────────────────────────

'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLofiPlayer } from '@/hooks/useLofiPlayer'
import { useKeySound } from '@/hooks/useKeySound'

// ── Icons ────────────────────────────────────

function IconPlay(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" stroke="none">
      <path d="M8 5 L19 12 L8 19 Z" />
    </svg>
  )
}

function IconPause(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" stroke="none">
      <rect x={6} y={5} width={4} height={14} rx={1} />
      <rect x={14} y={5} width={4} height={14} rx={1} />
    </svg>
  )
}

function IconPrevious(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" stroke="none">
      <rect x={5} y={5} width={3} height={14} rx={1} />
      <path d="M18 5 L9 12 L18 19 Z" />
    </svg>
  )
}

function IconNext(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" stroke="none">
      <path d="M6 5 L15 12 L6 19 Z" />
      <rect x={16} y={5} width={3} height={14} rx={1} />
    </svg>
  )
}

function IconVolume(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" stroke="none">
      <path d="M3 9 L7 9 L12 5 L12 19 L7 15 L3 15 Z" />
      <path
        d="M15 8.5 Q17 10 17 12 Q17 14 15 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Volume slider ───────────────────────────

function VolumeSlider({
  volume,
  onVolumeChange,
}: {
  volume: number
  onVolumeChange: (v: number) => void
}): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null)

  const updateFromPointer = (clientY: number): void => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = 1 - (clientY - rect.top) / rect.height
    onVolumeChange(Math.max(0, Math.min(1, ratio)))
  }

  const handlePointerDown = (e: React.PointerEvent): void => {
    e.preventDefault()
    updateFromPointer(e.clientY)
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent): void => {
    if (e.buttons === 0) return
    updateFromPointer(e.clientY)
  }

  const fillPercent = Math.round(volume * 100)

  return (
    <div
      ref={trackRef}
      className="w-6 h-24 flex items-end justify-center cursor-pointer touch-none"
      role="slider"
      aria-label="Lo-fi volume"
      aria-valuenow={fillPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className="w-1.5 h-full rounded-full bg-warm-300/50 relative overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-sage-500 rounded-full transition-[height] duration-75"
          style={{ height: `${fillPercent}%` }}
        />
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────

export function AudioPlayer(): ReactNode {
  const { isPlaying, volume, toggle, skip, previous, setVolume } = useLofiPlayer()
  const { playSound } = useKeySound()
  const [volumeOpen, setVolumeOpen] = useState(false)
  const volumeRef = useRef<HTMLDivElement>(null)

  const handleToggle = (): void => {
    playSound('ui-audio-toggle')
    toggle()
  }

  const handlePrevious = (): void => {
    playSound('ui-dropdown')
    previous()
  }

  const handleSkip = (): void => {
    playSound('ui-dropdown')
    skip()
  }

  const handleVolumeToggle = (): void => {
    playSound('ui-dropdown')
    setVolumeOpen((prev) => !prev)
  }

  useEffect(() => {
    if (!volumeOpen) return
    const handleClick = (e: MouseEvent): void => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setVolumeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return (): void => document.removeEventListener('mousedown', handleClick)
  }, [volumeOpen])

  const controlButton =
    'h-7 w-7 flex items-center justify-center rounded-full bg-white/50 text-warm-800 hover:text-sage-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-300 cursor-pointer'

  return (
    <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm rounded-lg px-2 py-1.5">
      <span className="text-xs font-medium text-warm-600 select-none">Lofi</span>
      {isPlaying && (
        <button
          type="button"
          onClick={handlePrevious}
          className={controlButton}
          aria-label="Previous track"
        >
          <IconPrevious />
        </button>
      )}
      <button
        type="button"
        onClick={handleToggle}
        className={controlButton}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? <IconPause /> : <IconPlay />}
      </button>
      {isPlaying && (
        <>
          <button
            type="button"
            onClick={handleSkip}
            className={controlButton}
            aria-label="Next track"
          >
            <IconNext />
          </button>
          <div ref={volumeRef} className="relative">
            <button
              type="button"
              onClick={handleVolumeToggle}
              className={controlButton}
              aria-label="Volume"
              aria-expanded={volumeOpen}
            >
              <IconVolume />
            </button>
            {volumeOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/80 backdrop-blur-sm rounded-lg px-1.5 py-2 shadow-lg">
                <VolumeSlider volume={volume} onVolumeChange={setVolume} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
