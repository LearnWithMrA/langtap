// ─────────────────────────────────────────────
// File: hooks/useKotobaTrialSession.ts
// Purpose: Returns a UseKotobaPracticeReturn-shaped sandbox
//          for the kotoba tutorial trial. 3 fixed N5 words
//          (water, dog, cat). No mastery or counter writes.
// Depends on: hooks/useKotobaPracticeSession.ts (types only),
//             data/kana/characters.ts
// ─────────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { UseKotobaPracticeReturn } from '@/hooks/useKotobaPracticeSession'
import type { KotobaPrompt } from '@/types/kotoba.types'

// ── Trial words ───────────────────────────────

const TRIAL_WORDS: KotobaPrompt[] = [
  {
    id: '1371260',
    kanji: '水',
    kana: 'みず',
    english: 'Water',
    characters: [
      { kana: 'み', romaji: 'mi' },
      { kana: 'ず', romaji: 'zu' },
    ],
  },
  {
    id: '1258330',
    kanji: '犬',
    kana: 'いぬ',
    english: 'Dog',
    characters: [
      { kana: 'い', romaji: 'i' },
      { kana: 'ぬ', romaji: 'nu' },
    ],
  },
  {
    id: '1467640',
    kanji: '猫',
    kana: 'ねこ',
    english: 'Cat',
    characters: [
      { kana: 'ね', romaji: 'ne' },
      { kana: 'こ', romaji: 'ko' },
    ],
  },
]

// ── Types ─────────────────────────────────────

type KotobaTrialReturn = UseKotobaPracticeReturn & {
  isComplete: boolean
}

// ── Hook ──────────────────────────────────────

export function useKotobaTrialSession(): KotobaTrialReturn {
  const [index, setIndex] = useState(0)

  const isComplete = index >= TRIAL_WORDS.length
  const prompt = isComplete ? null : (TRIAL_WORDS[index] ?? null)

  const recordWordComplete = useCallback((): void => {
    // No-op: trial does not write to stores
  }, [])

  const advanceToNext = useCallback((): void => {
    setIndex((prev) => prev + 1)
  }, [])

  return {
    prompt,
    isLoading: false,
    isEmpty: false,
    kanjiDistractors: [],
    recordWordComplete,
    advanceToNext,
    isComplete,
  }
}
