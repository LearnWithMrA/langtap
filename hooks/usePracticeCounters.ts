// ------------------------------------------------------------
// File: hooks/usePracticeCounters.ts
// Purpose: Per-input-mode correct-character counters for the
//          practice screen. Persists to localStorage so the
//          values survive reloads. Used for manual testing of
//          the mode-specific scoring flow before the real
//          session/mastery pipeline lands. No server sync.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useCallback, useEffect, useState } from 'react'

// -- Types --------------------------------------------------

type InputMode = 'type' | 'tap' | 'swipe'
type GameType = 'kana' | 'kotoba'
type Counters = Record<InputMode, number>

// -- Constants ----------------------------------------------

const STORAGE_KEY_PREFIX = 'langtap:practice-counters'
const DEFAULTS: Counters = { type: 0, tap: 0, swipe: 0 }

// -- Helpers ------------------------------------------------

function storageKey(gameType: GameType): string {
  return `${STORAGE_KEY_PREFIX}:${gameType}`
}

function loadCounters(gameType: GameType): Counters {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(storageKey(gameType))
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Counters>
    return {
      type: typeof parsed.type === 'number' ? parsed.type : 0,
      tap: typeof parsed.tap === 'number' ? parsed.tap : 0,
      swipe: typeof parsed.swipe === 'number' ? parsed.swipe : 0,
    }
  } catch {
    return DEFAULTS
  }
}

export function clearPracticeCounters(gameType: GameType): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(storageKey(gameType))
}

// -- Hook ---------------------------------------------------

export function usePracticeCounters(gameType: GameType): {
  counters: Counters
  incrementCorrect: (mode: InputMode) => void
} {
  const [counters, setCounters] = useState<Counters>(DEFAULTS)

  useEffect((): void => {
    setCounters(loadCounters(gameType))
  }, [gameType])

  const incrementCorrect = useCallback(
    (mode: InputMode): void => {
      setCounters((prev) => {
        const next: Counters = { ...prev, [mode]: prev[mode] + 1 }
        try {
          window.localStorage.setItem(storageKey(gameType), JSON.stringify(next))
        } catch {
          // Storage unavailable (private mode quota, disabled cookies). In-memory state still works.
        }
        return next
      })
    },
    [gameType],
  )

  return { counters, incrementCorrect }
}
