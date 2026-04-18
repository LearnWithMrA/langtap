// ------------------------------------------------------------
// File: components/audio/audio-player.tsx
// Purpose: Translucent lo-fi background music player. Phase 1
//          placeholder: displays song title and play/pause button
//          but plays nothing until audio tracks are sourced in
//          Sprint 10. Does not break if no audio source exists.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useKeySound } from '@/hooks/useKeySound'

// -- Icons --------------------------------------------------

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

// -- Component ----------------------------------------------

export function AudioPlayer(): ReactNode {
  const [isPlaying, setIsPlaying] = useState(false)
  const { playSound } = useKeySound()

  const handleToggle = useCallback((): void => {
    playSound('ui-audio-toggle')
    setIsPlaying((prev) => !prev)
    // No actual audio playback in Phase 1
  }, [playSound])

  return (
    <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
      <button
        type="button"
        onClick={handleToggle}
        className="h-7 w-7 flex items-center justify-center rounded-full bg-white/50 text-warm-800 hover:text-sage-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-300 cursor-pointer"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? <IconPause /> : <IconPlay />}
      </button>
      <span className="text-xs text-warm-600 truncate max-w-[100px]">Lo-fi</span>
    </div>
  )
}
