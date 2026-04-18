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
type Counters = Record<InputMode, number>

// -- Constants ----------------------------------------------

const STORAGE_KEY = 'langtap:practice-counters'
const DEFAULTS: Counters = { type: 0, tap: 0, swipe: 0 }

// -- Helpers ------------------------------------------------

function loadCounters(): Counters {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
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

// -- Hook ---------------------------------------------------

export function usePracticeCounters(): {
  counters: Counters
  incrementCorrect: (mode: InputMode) => void
} {
  // Start at defaults for SSR hydration parity, then load from storage on mount
  const [counters, setCounters] = useState<Counters>(DEFAULTS)

  useEffect((): void => {
    setCounters(loadCounters())
  }, [])

  const incrementCorrect = useCallback((mode: InputMode): void => {
    setCounters((prev) => {
      const next: Counters = { ...prev, [mode]: prev[mode] + 1 }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage unavailable (private mode quota, disabled cookies). In-memory state still works.
      }
      return next
    })
  }, [])

  return { counters, incrementCorrect }
}
