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
import { selectNextKanaPrompt } from '@/engine/selection'
import { evaluateCharacterAttempt } from '@/engine/scoring'
import { calculateDistanceIncrement } from '@/engine/distance'
import { getPracticeAvailableIds, getWordEligibleIds } from '@/engine/practice-eligibility'
import { MIN_ELIGIBLE_WORDS_FOR_MIXING } from '@/engine/constants'
import { KANA_CHARACTERS, getCharacterById } from '@/data/kana/characters'
import { PROGRESSION_GROUPS, UNLOCK_STEPS } from '@/data/kana/progression-groups'
import { loadWordBank, getWordBankSync } from '@/data/words/word-bank-loader'
import { useMasteryStore } from '@/stores/mastery.store'
import { useCounterStore } from '@/stores/counter.store'
import { useSessionStore } from '@/stores/session.store'
import { useUnlockStore } from '@/stores/unlock.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { WordBankEntry } from '@/types/word.types'
import type { PromptKind } from '@/types/session.types'
import type { CharacterWithMastery } from '@/types/game.types'
import type { JlptLevel } from '@/types/user.types'

// ── Types ─────────────────────────────────────

export type PracticeCharacter = {
  id: string
  kana: string
  romaji: string
}

export type PracticePrompt = {
  kind: PromptKind
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
  practiceIds: Set<string>
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

const SOKUON_IDS = new Set(['h-sokuon', 'k-sokuon'])
const LONGVOWEL_ID = 'k-longvowel'

function getLastVowel(romaji: string): string {
  const vowels = 'aiueo'
  for (let i = romaji.length - 1; i >= 0; i--) {
    if (vowels.includes(romaji[i])) return romaji[i]
  }
  return 'u'
}

function getFirstConsonant(romaji: string): string {
  const vowels = 'aiueo'
  if (romaji.length > 0 && !vowels.includes(romaji[0])) return romaji[0]
  return 't'
}

function buildPracticePromptFromKana(
  result: import('@/types/session.types').KanaSelectionResult,
): PracticePrompt | null {
  if (result.kind === 'character') {
    const char = getCharacterById(result.characterId)
    if (!char) return null
    const syntheticWord: WordBankEntry = {
      id: `char-${char.id}`,
      kana: char.kana,
      kanji: null,
      meaning: ' ',
      jlptLevel: 'N5',
      characterIds: [char.id],
      audioFile: null,
    }
    return {
      kind: 'character',
      word: syntheticWord,
      characters: [{ id: char.id, kana: char.kana, romaji: char.romaji }],
      targetCharacterId: char.id,
    }
  }

  const word = result.word
  if (!word) return null
  const chars: { id: string; kana: string; romaji: string }[] = []
  for (const charId of word.characterIds) {
    const char = getCharacterById(charId)
    if (!char) return null
    chars.push({ id: char.id, kana: char.kana, romaji: char.romaji })
  }

  const characters: PracticeCharacter[] = chars.map((c, i) => {
    if (SOKUON_IDS.has(c.id)) {
      const next = chars[i + 1]
      return { id: c.id, kana: c.kana, romaji: next ? getFirstConsonant(next.romaji) : 't' }
    }
    if (c.id === LONGVOWEL_ID) {
      const prev = chars[i - 1]
      return { id: c.id, kana: c.kana, romaji: prev ? getLastVowel(prev.romaji) : 'u' }
    }
    return c
  })

  return { kind: 'word', word, characters, targetCharacterId: result.characterId }
}

// ── Hook ──────────────────────────────────────

export function usePracticeSession(preferredLevel: JlptLevel = 'N5'): UsePracticeSessionReturn {
  const initRef = useRef(false)
  const [wordBankData, setWordBankData] = useState<WordBankEntry[] | null>(() =>
    getWordBankSync(preferredLevel),
  )

  useEffect(() => {
    if (wordBankData) return
    let mounted = true
    loadWordBank(preferredLevel).then((words) => {
      if (mounted) setWordBankData(words)
    })
    return (): void => {
      mounted = false
    }
  }, [preferredLevel, wordBankData])

  const [{ prompt, isEmpty }] = useState(() => {
    const { bootstrapped } = useUnlockStore.getState()
    const cachedBank = getWordBankSync(preferredLevel)
    if (!bootstrapped || !cachedBank) {
      return { prompt: null as PracticePrompt | null, isEmpty: true }
    }
    const s = useMasteryStore.getState().scores
    const ls = useMasteryStore.getState().learningScores
    const manualIds = new Set(useOnboardingStore.getState().selectedCharacterIds)
    const practiceIds = getPracticeAvailableIds(ls, manualIds, PROGRESSION_GROUPS, UNLOCK_STEPS)
    const wordEligibleIds = getWordEligibleIds(ls, manualIds)
    if (practiceIds.size === 0) {
      return { prompt: null as PracticePrompt | null, isEmpty: true }
    }
    const cwm = buildCharactersWithMastery(s)
    const result = selectNextKanaPrompt(
      cwm,
      cachedBank,
      {},
      practiceIds,
      wordEligibleIds,
      manualIds,
      ls,
      preferredLevel,
      MIN_ELIGIBLE_WORDS_FOR_MIXING,
    )
    if (!result) return { prompt: null as PracticePrompt | null, isEmpty: true }
    useCounterStore.getState().bulkLoad(result.updatedCounters)
    const built = buildPracticePromptFromKana(result)
    initRef.current = true
    return { prompt: built, isEmpty: !built }
  })

  const [currentPrompt, setPrompt] = useState<PracticePrompt | null>(prompt)
  const [currentIsEmpty, setIsEmpty] = useState(isEmpty)

  const scores = useMasteryStore((s) => s.scores)
  const learningScores = useMasteryStore((s) => s.learningScores)
  const bootstrapped = useUnlockStore((s) => s.bootstrapped)
  const increment = useMasteryStore((s) => s.increment)
  const incrementLearning = useMasteryStore((s) => s.incrementLearning)

  const counters = useCounterStore((s) => s.counters)
  const incrementCounter = useCounterStore((s) => s.increment)
  const bulkLoadCounters = useCounterStore((s) => s.bulkLoad)
  const resetAllCounters = useCounterStore((s) => s.resetAll)

  const startSession = useSessionStore((s) => s.startSession)
  const recordCorrect = useSessionStore((s) => s.recordCorrect)
  const recordWrong = useSessionStore((s) => s.recordWrong)

  const recomputeUnlocks = useUnlockStore((s) => s.recompute)

  const manualUnlockIds = useOnboardingStore((s) => s.selectedCharacterIds)

  const manualSet = useRef(new Set(manualUnlockIds))
  useEffect(() => {
    manualSet.current = new Set(manualUnlockIds)
  }, [manualUnlockIds])

  const practiceIdsRef = useRef(
    getPracticeAvailableIds(learningScores, manualSet.current, PROGRESSION_GROUPS, UNLOCK_STEPS),
  )
  useEffect(() => {
    practiceIdsRef.current = getPracticeAvailableIds(
      learningScores,
      manualSet.current,
      PROGRESSION_GROUPS,
      UNLOCK_STEPS,
    )
  }, [learningScores])

  const selectNext = useCallback(
    (currentCounters: Record<string, number>): void => {
      if (!wordBankData) return
      const cwm = buildCharactersWithMastery(scores)
      const manual = manualSet.current
      const practiceIds = practiceIdsRef.current
      const wordEligibleIds = getWordEligibleIds(learningScores, manual)
      const result = selectNextKanaPrompt(
        cwm,
        wordBankData,
        currentCounters,
        practiceIds,
        wordEligibleIds,
        manual,
        learningScores,
        preferredLevel,
        MIN_ELIGIBLE_WORDS_FOR_MIXING,
      )

      if (!result) {
        setPrompt(null)
        setIsEmpty(true)
        return
      }

      bulkLoadCounters(result.updatedCounters)
      const built = buildPracticePromptFromKana(result)
      setPrompt(built)
      setIsEmpty(!built)
    },
    [scores, learningScores, preferredLevel, bulkLoadCounters, wordBankData],
  )

  // Fallback: if bootstrap or word bank wasn't ready at init time, select once both are
  useEffect(() => {
    if (!bootstrapped || !wordBankData || initRef.current) return
    initRef.current = true
    startSession()
    resetAllCounters()

    const manual = manualSet.current
    const practiceIds = getPracticeAvailableIds(
      learningScores,
      manual,
      PROGRESSION_GROUPS,
      UNLOCK_STEPS,
    )
    practiceIdsRef.current = practiceIds
    if (practiceIds.size === 0) {
      setIsEmpty(true)
      return
    }
    const wordEligibleIds = getWordEligibleIds(learningScores, manual)
    const cwm = buildCharactersWithMastery(scores)
    const result = selectNextKanaPrompt(
      cwm,
      wordBankData,
      {},
      practiceIds,
      wordEligibleIds,
      manual,
      learningScores,
      preferredLevel,
      MIN_ELIGIBLE_WORDS_FOR_MIXING,
    )
    if (!result) {
      setIsEmpty(true)
      return
    }
    bulkLoadCounters(result.updatedCounters)
    const built = buildPracticePromptFromKana(result)
    setPrompt(built)
    setIsEmpty(!built)
  }, [
    bootstrapped,
    wordBankData,
    scores,
    learningScores,
    startSession,
    resetAllCounters,
    preferredLevel,
    bulkLoadCounters,
  ])

  const handleWordComplete = useCallback(
    (results: CharacterResult[]): void => {
      const isCharacterDrill = currentPrompt?.kind === 'character'

      for (const result of results) {
        if (isCharacterDrill) {
          if (result.isFirstAttemptCorrect) {
            incrementLearning(result.characterId)
          }
        } else {
          const masteryDelta = evaluateCharacterAttempt(result.isFirstAttemptCorrect, true)
          if (masteryDelta > 0) {
            increment(result.characterId)
          }
        }

        if (result.isFirstAttemptCorrect) {
          const distance = calculateDistanceIncrement(result.responseTimeMs, true)
          recordCorrect(result.characterId, distance)
        } else {
          recordWrong(result.characterId)
        }
      }

      if (currentPrompt?.kind === 'word') {
        incrementCounter(currentPrompt.word.id)
      }
    },
    [increment, incrementLearning, recordCorrect, recordWrong, incrementCounter, currentPrompt],
  )

  const advanceToNext = useCallback((): void => {
    recomputeUnlocks(learningScores, new Set(manualUnlockIds))
    selectNext(counters)
  }, [recomputeUnlocks, learningScores, manualUnlockIds, selectNext, counters])

  return {
    prompt: currentPrompt,
    isLoading: !bootstrapped || !wordBankData,
    isEmpty: currentIsEmpty,
    practiceIds: practiceIdsRef.current,
    handleWordComplete,
    advanceToNext,
  }
}
