// ─────────────────────────────────────────────
// File: hooks/useKotobaPracticeSession.ts
// Purpose: Orchestrates the Kotoba practice loop. Selects words
//          from the unlocked pool using mastery-weighted selection,
//          builds KotobaPrompt view-models, manages scoring, and
//          generates kanji distractors. Hydration-aware: returns
//          loading state until the word mastery store has rehydrated.
// Depends on: engine/kotoba-selection.ts, engine/kotoba-progression.ts,
//             stores/word-mastery.store.ts, stores/counter.store.ts,
//             data/words/index.ts, data/words/kotoba-levels/,
//             data/kana/characters.ts
// ─────────────────────────────────────────────

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { selectNextKotobaWord, generateKotobaDistractors } from '@/engine/kotoba-selection'
import { getUnlockedKotobaWordIds } from '@/engine/kotoba-progression'
import { getCharacterById } from '@/data/kana/characters'
import { WORD_BANK } from '@/data/words'
import { N5_LEVELS, N4_LEVELS, N3_LEVELS, N2_LEVELS, N1_LEVELS } from '@/data/words/kotoba-levels'
import type { KotobaLevel } from '@/data/words/kotoba-levels'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { useCounterStore } from '@/stores/counter.store'
import type { KotobaPrompt, KotobaPromptCharacter } from '@/types/kotoba.types'
import type { WordBankEntry, WordCounterMap } from '@/types/word.types'
import type { JlptLevel } from '@/types/user.types'

// ── Constants ────────────────────────────────

const KOTOBA_LEVELS: Record<JlptLevel, readonly KotobaLevel[]> = {
  N5: N5_LEVELS,
  N4: N4_LEVELS,
  N3: N3_LEVELS,
  N2: N2_LEVELS,
  N1: N1_LEVELS,
}

const SOKUON_IDS = new Set(['h-sokuon', 'k-sokuon'])
const LONGVOWEL_ID = 'k-longvowel'

// ── Types ────────────────────────────────────

export type UseKotobaPracticeReturn = {
  prompt: KotobaPrompt | null
  isLoading: boolean
  isEmpty: boolean
  kanjiDistractors: string[]
  recordWordComplete: (wasClean: boolean, scoreMultiplier?: number) => void
  advanceToNext: () => void
}

// ── Helpers ──────────────────────────────────

function getAllWordIds(levels: readonly KotobaLevel[]): string[] {
  return levels.flatMap((l) => [...l.wordIds])
}

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

function buildKotobaPrompt(word: WordBankEntry): KotobaPrompt | null {
  const raw: { kana: string; romaji: string; id: string }[] = []
  for (const charId of word.characterIds) {
    const char = getCharacterById(charId)
    if (!char) return null
    raw.push({ kana: char.kana, romaji: char.romaji, id: char.id })
  }

  const characters: KotobaPromptCharacter[] = raw.map((c, i) => {
    if (SOKUON_IDS.has(c.id)) {
      const next = raw[i + 1]
      return { kana: c.kana, romaji: next ? getFirstConsonant(next.romaji) : 't' }
    }
    if (c.id === LONGVOWEL_ID) {
      const prev = raw[i - 1]
      return { kana: c.kana, romaji: prev ? getLastVowel(prev.romaji) : 'u' }
    }
    return { kana: c.kana, romaji: c.romaji }
  })

  return {
    id: word.id,
    kanji: word.kanji,
    kana: word.kana,
    english: word.meaning,
    characters,
  }
}

// ── Hook ─────────────────────────────────────

export function useKotobaPracticeSession(jlptLevel: JlptLevel = 'N5'): UseKotobaPracticeReturn {
  const initRef = useRef(false)

  const levels = KOTOBA_LEVELS[jlptLevel]
  const wordBank = WORD_BANK[jlptLevel]

  const [{ prompt: initialPrompt, isEmpty: initialIsEmpty }] = useState(() => {
    const { hasHydrated, scores, manuallyUnlockedWords } = useWordMasteryStore.getState()
    if (!hasHydrated) {
      return { prompt: null as KotobaPrompt | null, isEmpty: false }
    }

    const ids = getAllWordIds(levels)
    const manual = new Set(manuallyUnlockedWords)
    const unlocked = getUnlockedKotobaWordIds(ids, scores, manual)

    if (unlocked.size === 0) {
      return { prompt: null as KotobaPrompt | null, isEmpty: true }
    }

    const result = selectNextKotobaWord(unlocked, wordBank, scores, {})
    if (!result) {
      return { prompt: null as KotobaPrompt | null, isEmpty: true }
    }

    useCounterStore.getState().bulkLoad(result.updatedCounters)
    const built = buildKotobaPrompt(result.word)
    initRef.current = true
    return { prompt: built, isEmpty: !built }
  })

  const [currentPrompt, setCurrentPrompt] = useState<KotobaPrompt | null>(initialPrompt)
  const [currentIsEmpty, setCurrentIsEmpty] = useState(initialIsEmpty)

  const wordScores = useWordMasteryStore((s) => s.scores)
  const manualUnlocks = useWordMasteryStore((s) => s.manuallyUnlockedWords)
  const hasHydrated = useWordMasteryStore((s) => s.hasHydrated)
  const incrementMastery = useWordMasteryStore((s) => s.increment)

  const counters = useCounterStore((s) => s.counters)
  const bulkLoadCounters = useCounterStore((s) => s.bulkLoad)
  const incrementCounter = useCounterStore((s) => s.increment)

  const allWordIds = useMemo(() => getAllWordIds(levels), [levels])
  const manualUnlockSet = useMemo(() => new Set(manualUnlocks), [manualUnlocks])

  const unlockedWordIds = useMemo(
    () => getUnlockedKotobaWordIds(allWordIds, wordScores, manualUnlockSet),
    [allWordIds, wordScores, manualUnlockSet],
  )

  const selectAndBuild = useCallback(
    (currentCounters: WordCounterMap): KotobaPrompt | null => {
      const result = selectNextKotobaWord(unlockedWordIds, wordBank, wordScores, currentCounters)
      if (!result) return null
      bulkLoadCounters(result.updatedCounters)
      return buildKotobaPrompt(result.word)
    },
    [unlockedWordIds, wordBank, wordScores, bulkLoadCounters],
  )

  useEffect(() => {
    if (!hasHydrated || initRef.current) return
    initRef.current = true

    if (unlockedWordIds.size === 0) {
      setCurrentIsEmpty(true)
      return
    }

    const prompt = selectAndBuild({})
    setCurrentPrompt(prompt)
    setCurrentIsEmpty(!prompt)
  }, [hasHydrated, unlockedWordIds, selectAndBuild])

  const recordWordComplete = useCallback(
    (wasClean: boolean, scoreMultiplier: number = 1): void => {
      if (!currentPrompt) return
      if (wasClean) {
        for (let i = 0; i < scoreMultiplier; i++) {
          incrementMastery(currentPrompt.id)
        }
      }
      incrementCounter(currentPrompt.id)
    },
    [currentPrompt, incrementMastery, incrementCounter],
  )

  const advanceToNext = useCallback((): void => {
    const prompt = selectAndBuild(counters)
    setCurrentPrompt(prompt)
    setCurrentIsEmpty(!prompt)
  }, [selectAndBuild, counters])

  const kanjiDistractors = useMemo((): string[] => {
    if (!currentPrompt?.kanji) return []
    return generateKotobaDistractors(currentPrompt.kanji, 3, wordBank)
  }, [currentPrompt, wordBank])

  return {
    prompt: currentPrompt,
    isLoading: !hasHydrated,
    isEmpty: currentIsEmpty,
    kanjiDistractors,
    recordWordComplete,
    advanceToNext,
  }
}
