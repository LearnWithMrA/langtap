// ─────────────────────────────────────────────
// File: components/audio/audio-player.tsx
// Purpose: Translucent lo-fi background music player. Shuffled
//          playback of CC0 tracks. Play/pause toggle with skip
//          button. Shows current track title. Audio only fetched
//          on user interaction, never on page load.
// Depends on: hooks/useLofiPlayer.ts, hooks/useKeySound.ts
// ─────────────────────────────────────────────

'use client'

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

// ── Component ────────────────────────────────

export function AudioPlayer(): ReactNode {
  const { isPlaying, toggle, skip, previous } = useLofiPlayer()
  const { playSound } = useKeySound()

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
        <button
          type="button"
          onClick={handleSkip}
          className={controlButton}
          aria-label="Next track"
        >
          <IconNext />
        </button>
      )}
    </div>
  )
}
