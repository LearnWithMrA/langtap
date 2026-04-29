// ─────────────────────────────────────────────
// File: hooks/usePracticeSession.ts
// Purpose: Orchestrates the practice game loop. Calls the selection
//          engine, manages session/mastery/counter stores, and exposes
//          a stable interface for GameWindow to consume.
//          Mastery mutates once per character on word completion only.
//          Counter store is the sole mutable authority for word counters.
// Depends on: engine/selection.ts, engine/scoring.ts, engine/distance.ts,
//             stores/mastery.store.ts, stores/counter.store.ts,
//             stores/session.store.ts, stores/unlock.store.ts,
//             data/kana/characters.ts, data/words/index.ts
// ─────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react'
import { selectNextPrompt } from '@/engine/selection'
import { evaluateCharacterAttempt } from '@/engine/scoring'
import { calculateDistanceIncrement } from '@/engine/distance'
import { KANA_CHARACTERS, getCharacterById } from '@/data/kana/characters'
import { WORD_BANK } from '@/data/words'
import { useMasteryStore } from '@/stores/mastery.store'
import { useCounterStore } from '@/stores/counter.store'
import { useSessionStore } from '@/stores/session.store'
import { useUnlockStore } from '@/stores/unlock.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { WordBankEntry } from '@/types/word.types'
import type { SelectionResult } from '@/types/session.types'
import type { CharacterWithMastery } from '@/types/game.types'
import type { JlptLevel } from '@/types/user.types'

// ── Types ─────────────────────────────────────

export type PracticeCharacter = {
  id: string
  kana: string
  romaji: string
}

export type PracticePrompt = {
  word: WordBankEntry
  characters: PracticeCharacter[]
  targetCharacterId: string
}

export type CharacterResult = {
  characterId: string
  isFirstAttemptCorrect: boolean
  responseTimeMs: number
}

export type UsePracticeSessionReturn = {
  prompt: PracticePrompt | null
  isLoading: boolean
  isEmpty: boolean
  handleWordComplete: (results: CharacterResult[]) => void
  advanceToNext: () => void
}

// ── Helpers ───────────────────────────────────

function buildCharactersWithMastery(scores: Record<string, number>): CharacterWithMastery[] {
  return KANA_CHARACTERS.map((c) => ({
    id: c.id,
    masteryScore: scores[c.id] ?? 0,
  }))
}

function buildPracticePrompt(result: SelectionResult): PracticePrompt | null {
  const { word } = result.prompt
  const characters: PracticeCharacter[] = []
  for (const charId of word.characterIds) {
    const char = getCharacterById(charId)
    if (!char) return null
    characters.push({ id: char.id, kana: char.kana, romaji: char.romaji })
  }
  return { word, characters, targetCharacterId: result.prompt.characterId }
}

// ── Hook ──────────────────────────────────────

export function usePracticeSession(preferredLevel: JlptLevel = 'N5'): UsePracticeSessionReturn {
  const [prompt, setPrompt] = useState<PracticePrompt | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const startedRef = useRef(false)

  const scores = useMasteryStore((s) => s.scores)
  const hasHydrated = useMasteryStore((s) => s.hasHydrated)
  const increment = useMasteryStore((s) => s.increment)

  const counters = useCounterStore((s) => s.counters)
  const incrementCounter = useCounterStore((s) => s.increment)
  const bulkLoadCounters = useCounterStore((s) => s.bulkLoad)
  const resetAllCounters = useCounterStore((s) => s.resetAll)

  const startSession = useSessionStore((s) => s.startSession)
  const recordCorrect = useSessionStore((s) => s.recordCorrect)
  const recordWrong = useSessionStore((s) => s.recordWrong)

  const unlockedIds = useUnlockStore((s) => s.unlockedIds)
  const bootstrapUnlocks = useUnlockStore((s) => s.bootstrap)
  const recomputeUnlocks = useUnlockStore((s) => s.recompute)

  const manualUnlockIds = useOnboardingStore((s) => s.selectedCharacterIds)
  const setSelectedBulk = useOnboardingStore((s) => s.setSelectedBulk)

  const selectNext = useCallback(
    (currentCounters: Record<string, number>): void => {
      const cwm = buildCharactersWithMastery(scores)
      const wordBank = WORD_BANK[preferredLevel]
      const result = selectNextPrompt(cwm, wordBank, currentCounters, unlockedIds, preferredLevel)

      if (!result) {
        setPrompt(null)
        setIsEmpty(true)
        return
      }

      bulkLoadCounters(result.updatedCounters)
      const built = buildPracticePrompt(result)
      setPrompt(built)
      setIsEmpty(!built)
    },
    [scores, unlockedIds, preferredLevel, bulkLoadCounters],
  )

  // Trigger mastery store rehydration from localStorage
  useEffect(() => {
    if (!hasHydrated) {
      useMasteryStore.persist.rehydrate()
    }
  }, [hasHydrated])

  // Bootstrap: wait for hydration, then auto-unlock first group if needed
  useEffect(() => {
    if (!hasHydrated || startedRef.current) return
    startedRef.current = true
    const resolvedManual = bootstrapUnlocks(scores, manualUnlockIds)
    if (resolvedManual.length !== manualUnlockIds.length) {
      setSelectedBulk(resolvedManual as string[])
    }
    startSession()
    resetAllCounters()
  }, [
    hasHydrated,
    scores,
    manualUnlockIds,
    bootstrapUnlocks,
    setSelectedBulk,
    startSession,
    resetAllCounters,
  ])

  // Select first prompt after unlock recompute
  useEffect(() => {
    if (!startedRef.current || prompt !== null || isEmpty) return
    if (unlockedIds.size === 0) {
      setIsEmpty(true)
      return
    }
    selectNext(counters)
  }, [unlockedIds, prompt, isEmpty, selectNext, counters])

  const handleWordComplete = useCallback(
    (results: CharacterResult[]): void => {
      for (const result of results) {
        const masteryDelta = evaluateCharacterAttempt(result.isFirstAttemptCorrect, true)
        if (masteryDelta > 0) {
          increment(result.characterId)
        }

        if (result.isFirstAttemptCorrect) {
          const distance = calculateDistanceIncrement(result.responseTimeMs, true)
          recordCorrect(result.characterId, distance)
        } else {
          recordWrong(result.characterId)
        }
      }

      if (prompt) {
        incrementCounter(prompt.word.id)
      }
    },
    [increment, recordCorrect, recordWrong, incrementCounter, prompt],
  )

  const advanceToNext = useCallback((): void => {
    recomputeUnlocks(scores, new Set(manualUnlockIds))
    selectNext(counters)
  }, [recomputeUnlocks, scores, manualUnlockIds, selectNext, counters])

  return {
    prompt,
    isLoading: !hasHydrated,
    isEmpty,
    handleWordComplete,
    advanceToNext,
  }
}
