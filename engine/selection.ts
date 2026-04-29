// ------------------------------------------------------------
// File: engine/selection.ts
// Purpose: Weighted character and word selection algorithm.
//          Selects the next character to practise based on mastery
//          scores and word counter values.
//          Pure functions only. No side effects.
// Depends on: engine/mastery.ts, engine/unlock.ts, engine/counter.ts,
//             types/game.types.ts, types/word.types.ts, types/session.types.ts
// ------------------------------------------------------------

import { getMasteryWeight } from '@/engine/mastery'
import { isWordEligibleByUnlockedSet } from '@/engine/unlock'
import { getWordCounterWeight, resetCountersForCharacter } from '@/engine/counter'
import { MAX_WORD_COUNTER } from '@/engine/constants'
import type { CharacterWithMastery } from '@/types/game.types'
import type { WordBankEntry, WordCounterMap } from '@/types/word.types'
import type { SelectionResult } from '@/types/session.types'
import type { JlptLevel } from '@/types/user.types'

// ── Types ────────────────────────────────────

type WeightedItem<T> = T & { weight: number }

type WordSelectionResult = {
  word: WordBankEntry
  updatedCounters: WordCounterMap
}

// ── Indexing ─────────────────────────────────

// Builds a lookup from character ID to eligible words (one pass).
// Only words where every character is unlocked are included.
export function buildWordIndex(
  wordBank: WordBankEntry[],
  unlockedIds: Set<string>,
): Map<string, WordBankEntry[]> {
  const index = new Map<string, WordBankEntry[]>()
  for (const word of wordBank) {
    if (!isWordEligibleByUnlockedSet(word.characterIds, unlockedIds)) continue
    for (const charId of word.characterIds) {
      const list = index.get(charId)
      if (list) {
        list.push(word)
      } else {
        index.set(charId, [word])
      }
    }
  }
  return index
}

// ── Weighting ────────────────────────────────

// Builds the weighted character pool from unlocked characters.
// Only characters with at least one eligible word (in the index) are included.
export function buildCharacterWeights(
  characters: CharacterWithMastery[],
  unlockedIds: Set<string>,
): WeightedItem<{ id: string }>[] {
  const result: WeightedItem<{ id: string }>[] = []
  for (const char of characters) {
    if (!unlockedIds.has(char.id)) continue
    result.push({ id: char.id, weight: getMasteryWeight(char.masteryScore) })
  }
  return result
}

// Generic weighted random draw. Preconditions: non-empty, all weights
// finite and non-negative, total weight > 0.
export function weightedRandomDraw<T extends { weight: number }>(items: T[], rng: () => number): T {
  if (items.length === 0) {
    throw new Error('weightedRandomDraw: empty items array')
  }

  let totalWeight = 0
  for (const item of items) {
    if (!Number.isFinite(item.weight) || item.weight < 0) {
      throw new Error('weightedRandomDraw: invalid weight')
    }
    totalWeight += item.weight
  }

  if (totalWeight <= 0) {
    throw new Error('weightedRandomDraw: total weight must be positive')
  }

  const raw = rng()
  const r = Number.isFinite(raw) ? Math.max(0, Math.min(raw, 1 - Number.EPSILON)) : 0
  let threshold = r * totalWeight

  for (const item of items) {
    threshold -= item.weight
    if (threshold < 0) return item
  }

  return items[items.length - 1]
}

// ── Word selection ───────────────────────────

// Selects a word for a specific character following the priority rules
// from GAME_DESIGN.md Section 3.3. Counter increment for the selected
// word is the caller's responsibility.
export function selectWordForCharacter(
  characterId: string,
  wordIndex: Map<string, WordBankEntry[]>,
  wordCounters: WordCounterMap,
  preferredLevel: JlptLevel,
  rng: () => number,
): WordSelectionResult | null {
  const candidates = wordIndex.get(characterId)
  if (!candidates || candidates.length === 0) return null

  let counters = wordCounters

  // Try preferred level first.
  const preferredPool = candidates.filter(
    (w) => w.jlptLevel === preferredLevel && (counters[w.id] ?? 0) < MAX_WORD_COUNTER,
  )
  if (preferredPool.length > 0) {
    return { word: drawByCounterWeight(preferredPool, counters, rng), updatedCounters: counters }
  }

  // Expand to all levels.
  const expandedPool = candidates.filter((w) => (counters[w.id] ?? 0) < MAX_WORD_COUNTER)
  if (expandedPool.length > 0) {
    return { word: drawByCounterWeight(expandedPool, counters, rng), updatedCounters: counters }
  }

  // All at MAX. Reset counters for this character's words and retry.
  const resetIds = candidates.map((w) => w.id)
  counters = resetCountersForCharacter(counters, resetIds)

  const resetPool = candidates.filter(
    (w) => w.jlptLevel === preferredLevel && (counters[w.id] ?? 0) < MAX_WORD_COUNTER,
  )
  const finalPool = resetPool.length > 0 ? resetPool : candidates

  return { word: drawByCounterWeight(finalPool, counters, rng), updatedCounters: counters }
}

// ── Main entry point ─────────────────────────

// Selects the next character and word to practise. Returns null if
// no valid prompt can be constructed (no unlocked characters with
// eligible words).
export function selectNextPrompt(
  characters: CharacterWithMastery[],
  wordBank: WordBankEntry[],
  wordCounters: WordCounterMap,
  unlockedIds: Set<string>,
  preferredLevel: JlptLevel,
  rng: () => number = Math.random,
): SelectionResult | null {
  const wordIndex = buildWordIndex(wordBank, unlockedIds)

  // Build feasible set: unlocked characters that have at least one word.
  const feasible = buildCharacterWeights(characters, unlockedIds).filter((c) => wordIndex.has(c.id))

  if (feasible.length === 0) return null

  const selected = weightedRandomDraw(feasible, rng)

  const wordResult = selectWordForCharacter(
    selected.id,
    wordIndex,
    wordCounters,
    preferredLevel,
    rng,
  )

  if (!wordResult) return null

  return {
    prompt: { characterId: selected.id, word: wordResult.word },
    updatedCounters: wordResult.updatedCounters,
  }
}

// ── Internal helpers ─────────────────────────

function drawByCounterWeight(
  pool: WordBankEntry[],
  counters: WordCounterMap,
  rng: () => number,
): WordBankEntry {
  const weighted = pool.map((w) => ({
    ...w,
    weight: getWordCounterWeight(counters[w.id] ?? 0),
  }))
  return weightedRandomDraw(weighted, rng)
}
