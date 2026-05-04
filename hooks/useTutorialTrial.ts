// ─────────────────────────────────────────────
// File: hooks/useTutorialTrial.ts
// Purpose: Returns a UsePracticeSessionReturn-shaped object
//          for the tutorial trial round. Cycles through 4 fixed
//          prompts (3 characters + 1 word). No mastery, counter,
//          or session store writes. Pure sandbox.
// Depends on: data/tutorial/trial-prompts.ts,
//             hooks/usePracticeSession.ts (types only)
// ─────────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { UsePracticeSessionReturn } from '@/hooks/usePracticeSession'
import { TRIAL_PROMPTS } from '@/data/tutorial/trial-prompts'

// ── Types ─────────────────────────────────────

type TutorialTrialReturn = UsePracticeSessionReturn & {
  isComplete: boolean
}

// ── Hook ──────────────────────────────────────

export function useTutorialTrial(): TutorialTrialReturn {
  const [index, setIndex] = useState(0)

  const isComplete = index >= TRIAL_PROMPTS.length
  const prompt = isComplete ? null : (TRIAL_PROMPTS[index] ?? null)

  const handleWordComplete = useCallback((): void => {
    // No-op: trial does not write to mastery or counter stores
  }, [])

  const advanceToNext = useCallback((): void => {
    setIndex((prev) => prev + 1)
  }, [])

  return {
    prompt,
    isLoading: false,
    isEmpty: false,
    practiceIds: new Set<string>(),
    handleWordComplete,
    advanceToNext,
    isComplete,
  }
}
