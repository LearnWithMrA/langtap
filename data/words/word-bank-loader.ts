// ─────────────────────────────────────────────
// File: data/words/word-bank-loader.ts
// Purpose: Lazy loader for word bank and kotoba level data.
//          Word banks are content (~290 KB gzip total for all 5
//          levels). Kotoba level maps are progression structure
//          (only the selected level needed at a time).
//          Provides preloadAllWordBanks() for eager warming and
//          preloadPracticeDataForLevel(level) for level-specific
//          Kotoba map loading.
// Depends on: data/words/n5.ts, n4.ts, n3.ts, n2.ts, n1.ts,
//             data/words/kotoba-levels/
// ─────────────────────────────────────────────

import type { WordBankEntry } from '@/types/word.types'
import type { JlptLevel } from '@/types/user.types'
import type { KotobaLevel } from '@/data/words/kotoba-levels'

// ── Constants ─────────────────────────────────

const ALL_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

// ── Cache ─────────────────────────────────────

const wordBankCache = new Map<JlptLevel, WordBankEntry[]>()
const kotobaLevelsCache = new Map<JlptLevel, readonly KotobaLevel[]>()
const pendingWordBank = new Map<JlptLevel, Promise<WordBankEntry[]>>()
const pendingKotobaLevels = new Map<JlptLevel, Promise<readonly KotobaLevel[]>>()

// ── Word bank loader ──────────────────────────

export function loadWordBank(level: JlptLevel): Promise<WordBankEntry[]> {
  const cached = wordBankCache.get(level)
  if (cached) return Promise.resolve(cached)

  const pending = pendingWordBank.get(level)
  if (pending) return pending

  const promise = importWordBank(level).then((words) => {
    wordBankCache.set(level, words)
    pendingWordBank.delete(level)
    return words
  })

  pendingWordBank.set(level, promise)
  return promise
}

export function getWordBankSync(level: JlptLevel): WordBankEntry[] | null {
  return wordBankCache.get(level) ?? null
}

export function preloadAllWordBanks(): Promise<WordBankEntry[][]> {
  return Promise.all(ALL_LEVELS.map((level) => loadWordBank(level)))
}

export function getAllWordBanksSync(): WordBankEntry[] | null {
  const banks: WordBankEntry[] = []
  for (const level of ALL_LEVELS) {
    const cached = wordBankCache.get(level)
    if (!cached) return null
    banks.push(...cached)
  }
  return banks
}

// ── Kotoba levels loader ──────────────────────

export function loadKotobaLevels(level: JlptLevel): Promise<readonly KotobaLevel[]> {
  const cached = kotobaLevelsCache.get(level)
  if (cached) return Promise.resolve(cached)

  const pending = pendingKotobaLevels.get(level)
  if (pending) return pending

  const promise = importKotobaLevels(level).then((levels) => {
    kotobaLevelsCache.set(level, levels)
    pendingKotobaLevels.delete(level)
    return levels
  })

  pendingKotobaLevels.set(level, promise)
  return promise
}

export function getKotobaLevelsSync(level: JlptLevel): readonly KotobaLevel[] | null {
  return kotobaLevelsCache.get(level) ?? null
}

export function preloadPracticeDataForLevel(
  level: JlptLevel,
): Promise<[WordBankEntry[][], readonly KotobaLevel[]]> {
  return Promise.all([preloadAllWordBanks(), loadKotobaLevels(level)])
}

// ── Dynamic imports ───────────────────────────

async function importWordBank(level: JlptLevel): Promise<WordBankEntry[]> {
  switch (level) {
    case 'N5':
      return (await import('./n5')).N5_WORDS
    case 'N4':
      return (await import('./n4')).N4_WORDS
    case 'N3':
      return (await import('./n3')).N3_WORDS
    case 'N2':
      return (await import('./n2')).N2_WORDS
    case 'N1':
      return (await import('./n1')).N1_WORDS
  }
}

async function importKotobaLevels(level: JlptLevel): Promise<readonly KotobaLevel[]> {
  switch (level) {
    case 'N5':
      return (await import('./kotoba-levels/n5')).N5_LEVELS
    case 'N4':
      return (await import('./kotoba-levels/n4')).N4_LEVELS
    case 'N3':
      return (await import('./kotoba-levels/n3')).N3_LEVELS
    case 'N2':
      return (await import('./kotoba-levels/n2')).N2_LEVELS
    case 'N1':
      return (await import('./kotoba-levels/n1')).N1_LEVELS
  }
}
