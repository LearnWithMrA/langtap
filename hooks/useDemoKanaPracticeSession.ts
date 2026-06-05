// ─────────────────────────────────────────────
// File: hooks/useDemoKanaPracticeSession.ts
// Purpose: Adapter for kana demo prompts. Reads from the kana subset
//          of the demo prompt set sequentially (not mastery-weighted).
//          Returns the same interface as usePracticeSession so
//          GameWindow works unchanged. No mastery/counter store writes.
//          No server calls. In-memory only.
// Depends on: data/demo/demo-prompts.ts, stores/demo.store.ts,
//             hooks/usePracticeSession.ts (types only)
// ─────────────────────────────────────────────

import { useCallback } from 'react'
import type { UsePracticeSessionReturn } from '@/hooks/usePracticeSession'
import { DEMO_KANA_PROMPTS } from '@/data/demo/demo-prompts'
import { useDemoStore } from '@/stores/demo.store'

// ── Hook ─────────────────────────────────────

export function useDemoKanaPracticeSession(): UsePracticeSessionReturn {
  const index = useDemoStore((s) => s.kanaIndex)
  const isComplete = useDemoStore((s) => s.isKanaComplete)
  const advanceKana = useDemoStore((s) => s.advanceKana)

  const prompt = isComplete ? null : (DEMO_KANA_PROMPTS[index] ?? null)

  const practiceIds = new Set(
    DEMO_KANA_PROMPTS.flatMap((p) => p.characters.map((c) => c.id)),
  )

  const handleWordComplete = useCallback((): void => {
    // No-op: demo does not write to mastery or counter stores
  }, [])

  const advanceToNext = useCallback((): void => {
    advanceKana()
  }, [advanceKana])

  return {
    prompt,
    isLoading: false,
    isEmpty: false,
    practiceIds,
    handleWordComplete,
    advanceToNext,
  }
}
