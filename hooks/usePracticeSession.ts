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
  const initRef = useRef(false)

  const [{ prompt, isEmpty }] = useState(() => {
    const { bootstrapped, unlockedIds: ids } = useUnlockStore.getState()
    if (!bootstrapped || ids.size === 0) {
      return { prompt: null as PracticePrompt | null, isEmpty: !bootstrapped }
    }
    const s = useMasteryStore.getState().scores
    const cwm = buildCharactersWithMastery(s)
    const wordBank = WORD_BANK[preferredLevel]
    const result = selectNextPrompt(cwm, wordBank, {}, ids, preferredLevel)
    if (!result) return { prompt: null as PracticePrompt | null, isEmpty: true }
    useCounterStore.getState().bulkLoad(result.updatedCounters)
    const built = buildPracticePrompt(result)
    initRef.current = true
    return { prompt: built, isEmpty: !built }
  })

  const [currentPrompt, setPrompt] = useState<PracticePrompt | null>(prompt)
  const [currentIsEmpty, setIsEmpty] = useState(isEmpty)

  const scores = useMasteryStore((s) => s.scores)
  const bootstrapped = useUnlockStore((s) => s.bootstrapped)
  const increment = useMasteryStore((s) => s.increment)

  const counters = useCounterStore((s) => s.counters)
  const incrementCounter = useCounterStore((s) => s.increment)
  const bulkLoadCounters = useCounterStore((s) => s.bulkLoad)
  const resetAllCounters = useCounterStore((s) => s.resetAll)

  const startSession = useSessionStore((s) => s.startSession)
  const recordCorrect = useSessionStore((s) => s.recordCorrect)
  const recordWrong = useSessionStore((s) => s.recordWrong)

  const unlockedIds = useUnlockStore((s) => s.unlockedIds)
  const recomputeUnlocks = useUnlockStore((s) => s.recompute)

  const manualUnlockIds = useOnboardingStore((s) => s.selectedCharacterIds)

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

  // Fallback: if bootstrap wasn't ready at init time, select once it is
  useEffect(() => {
    if (!bootstrapped || initRef.current) return
    initRef.current = true
    startSession()
    resetAllCounters()

    if (unlockedIds.size === 0) {
      setIsEmpty(true)
      return
    }
    const cwm = buildCharactersWithMastery(scores)
    const wordBank = WORD_BANK[preferredLevel]
    const result = selectNextPrompt(cwm, wordBank, {}, unlockedIds, preferredLevel)
    if (!result) {
      setIsEmpty(true)
      return
    }
    bulkLoadCounters(result.updatedCounters)
    const built = buildPracticePrompt(result)
    setPrompt(built)
    setIsEmpty(!built)
  }, [
    bootstrapped,
    unlockedIds,
    scores,
    startSession,
    resetAllCounters,
    preferredLevel,
    bulkLoadCounters,
  ])

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

      if (currentPrompt) {
        incrementCounter(currentPrompt.word.id)
      }
    },
    [increment, recordCorrect, recordWrong, incrementCounter, currentPrompt],
  )

  const advanceToNext = useCallback((): void => {
    recomputeUnlocks(scores, new Set(manualUnlockIds))
    selectNext(counters)
  }, [recomputeUnlocks, scores, manualUnlockIds, selectNext, counters])

  return {
    prompt: currentPrompt,
    isLoading: !bootstrapped,
    isEmpty: currentIsEmpty,
    handleWordComplete,
    advanceToNext,
  }
}
