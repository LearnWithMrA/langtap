// ─────────────────────────────────────────────
// File: hooks/useDemoKotobaPracticeSession.ts
// Purpose: Adapter for kotoba demo prompts (readings and kanji mode).
//          Reads from the kotoba subset of the demo prompt set
//          sequentially. Returns the same interface as
//          useKotobaPracticeSession so KotobaGameWindow works
//          unchanged. No word mastery store writes. No server calls.
//          In-memory only.
// Depends on: data/demo/demo-prompts.ts, stores/demo.store.ts,
//             hooks/useKotobaPracticeSession.ts (types only)
// ─────────────────────────────────────────────

import { useCallback } from 'react'
import type { UseKotobaPracticeReturn } from '@/hooks/useKotobaPracticeSession'
import { DEMO_KOTOBA_PROMPTS } from '@/data/demo/demo-prompts'
import { useDemoStore } from '@/stores/demo.store'

// ── Hook ─────────────────────────────────────

export function useDemoKotobaPracticeSession(): UseKotobaPracticeReturn {
  const index = useDemoStore((s) => s.kotobaIndex)
  const isComplete = useDemoStore((s) => s.isKotobaComplete)
  const advanceKotoba = useDemoStore((s) => s.advanceKotoba)

  const prompt = isComplete ? null : (DEMO_KOTOBA_PROMPTS[index] ?? null)

  const recordWordComplete = useCallback((): void => {
    // No-op: demo does not write to word mastery stores
  }, [])

  const advanceToNext = useCallback((): void => {
    advanceKotoba()
  }, [advanceKotoba])

  return {
    prompt,
    isLoading: false,
    isEmpty: false,
    kanjiDistractors: [],
    recordWordComplete,
    advanceToNext,
  }
}
