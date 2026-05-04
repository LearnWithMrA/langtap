// ─────────────────────────────────────────────
// File: engine/kotoba-selection.ts
// Purpose: Weighted word selection for Kotoba practice.
//          Selects the next word based on mastery scores and
//          word counter values. Generates kanji distractors
//          from the word bank. Pure functions only.
// Depends on: engine/mastery.ts, engine/counter.ts,
//             engine/constants.ts, types/word.types.ts
// ─────────────────────────────────────────────

import { getMasteryWeight } from '@/engine/mastery'
import { getWordCounterWeight } from '@/engine/counter'
import { MAX_WORD_COUNTER } from '@/engine/constants'
import { weightedRandomDraw } from '@/engine/selection'
import type { WordBankEntry, WordMasteryScoreMap, WordCounterMap } from '@/types/word.types'

// ── Types ─────────────────────────────────────

export type KotobaSelectionResult = {
  word: WordBankEntry
  updatedCounters: WordCounterMap
  didReset: boolean
}

type WeightedWord = WordBankEntry & { weight: number }

// ── Pool building ─────────────────────────────

export function buildKotobaWordPool(
  unlockedWordIds: Set<string>,
  wordBank: readonly WordBankEntry[],
  wordScores: WordMasteryScoreMap,
  wordCounters: WordCounterMap,
): WeightedWord[] {
  const result: WeightedWord[] = []
  for (const word of wordBank) {
    if (!unlockedWordIds.has(word.id)) continue
    if ((wordCounters[word.id] ?? 0) >= MAX_WORD_COUNTER) continue
    const score = wordScores[word.id] ?? 0
    const counter = wordCounters[word.id] ?? 0
    const weight = getMasteryWeight(score) * getWordCounterWeight(counter)
    result.push({ ...word, weight })
  }
  return result
}

// ── Selection ─────────────────────────────────

export function selectNextKotobaWord(
  unlockedWordIds: Set<string>,
  wordBank: readonly WordBankEntry[],
  wordScores: WordMasteryScoreMap,
  wordCounters: WordCounterMap,
  rng: () => number = Math.random,
): KotobaSelectionResult | null {
  if (unlockedWordIds.size === 0) return null

  const pool = buildKotobaWordPool(unlockedWordIds, wordBank, wordScores, wordCounters)

  if (pool.length > 0) {
    const selected = weightedRandomDraw(pool, rng)
    return { word: selected, updatedCounters: wordCounters, didReset: false }
  }

  const resetCounters: WordCounterMap = { ...wordCounters }
  for (const id of unlockedWordIds) {
    if (id in resetCounters) {
      resetCounters[id] = 0
    }
  }

  const retryPool = buildKotobaWordPool(unlockedWordIds, wordBank, wordScores, resetCounters)
  if (retryPool.length === 0) return null

  const selected = weightedRandomDraw(retryPool, rng)
  return { word: selected, updatedCounters: resetCounters, didReset: true }
}

// ── Kanji distractors ─────────────────────────

export function generateKotobaDistractors(
  correctKanji: string,
  count: number,
  wordBank: readonly WordBankEntry[],
  rng: () => number = Math.random,
): string[] {
  const targetLength = [...correctKanji].length
  const sameLength: string[] = []
  const fallback: string[] = []

  for (const word of wordBank) {
    if (word.kanji !== null && word.kanji !== correctKanji) {
      if ([...word.kanji].length === targetLength) {
        sameLength.push(word.kanji)
      } else {
        fallback.push(word.kanji)
      }
    }
  }

  const shuffledSame = [...new Set(sameLength)].sort(() => rng() - 0.5)
  const distractors = shuffledSame.slice(0, count)

  if (distractors.length < count) {
    const shuffledFallback = [...new Set(fallback)].sort(() => rng() - 0.5)
    distractors.push(...shuffledFallback.slice(0, count - distractors.length))
  }

  return distractors
}
