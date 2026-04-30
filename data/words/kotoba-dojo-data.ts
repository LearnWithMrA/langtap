// ─────────────────────────────────────────────
// File: data/words/kotoba-dojo-data.ts
// Purpose: Adapter that builds the data shapes the Kotoba Dojo UI
//          needs from the raw word bank and level definitions.
//          Converts WordBankEntry to KotobaWord, pairs consecutive
//          levels into display groups, and builds word lookup maps.
//          Eager N5 access + lazy loaders for N4-N1.
// Depends on: data/words/, data/words/kotoba-levels/,
//             types/word.types.ts, types/kotoba.types.ts
// ─────────────────────────────────────────────

import type { WordBankEntry } from '@/types/word.types'
import type { KotobaLevelGroup, KotobaWord } from '@/types/kotoba.types'
import type { JlptLevel as JlptLevelLower } from '@/types/kotoba.types'
import type { JlptLevel as JlptLevelUpper } from '@/types/user.types'
import type { KotobaLevel } from '@/data/words/kotoba-levels/types'

// ── JLPT case mappers ────────────────────────

const UPPER_TO_LOWER: Readonly<Record<JlptLevelUpper, JlptLevelLower>> = {
  N5: 'n5',
  N4: 'n4',
  N3: 'n3',
  N2: 'n2',
  N1: 'n1',
}

export function jlptToLowercase(upper: JlptLevelUpper): JlptLevelLower {
  return UPPER_TO_LOWER[upper]
}

// ── WordBankEntry to KotobaWord ──────────────

export function wordBankEntryToKotobaWord(entry: WordBankEntry): KotobaWord {
  return {
    id: entry.id,
    kanji: entry.kanji,
    kana: entry.kana,
    english: entry.meaning,
    jlpt: jlptToLowercase(entry.jlptLevel),
  }
}

// ── Word lookup map ──────────────────────────

export function buildWordLookup(
  wordBank: readonly WordBankEntry[],
  levelWordIds: ReadonlySet<string>,
): Readonly<Record<string, KotobaWord>> {
  const out: Record<string, KotobaWord> = {}
  for (const entry of wordBank) {
    if (levelWordIds.has(entry.id)) {
      out[entry.id] = wordBankEntryToKotobaWord(entry)
    }
  }
  return out
}

// ── Level grouping ───────────────────────────

const LEVELS_PER_GROUP = 2

export function buildKotobaGroups(
  levels: readonly KotobaLevel[],
  jlpt: JlptLevelLower,
): readonly KotobaLevelGroup[] {
  const groups: KotobaLevelGroup[] = []

  for (let i = 0; i < levels.length; i += LEVELS_PER_GROUP) {
    const end = Math.min(i + LEVELS_PER_GROUP, levels.length)
    const levelStart = i + 1
    const levelEnd = end

    const wordIds: string[] = []
    for (let j = i; j < end; j++) {
      wordIds.push(...levels[j].wordIds)
    }

    const label =
      levelStart === levelEnd ? `Level ${levelStart}` : `Levels ${levelStart}-${levelEnd}`

    groups.push({
      id: `${jlpt}-g${i}`,
      label,
      wordIds,
    })
  }

  return groups
}

// ── Collect all word IDs from levels ─────────

function collectWordIds(levels: readonly KotobaLevel[]): Set<string> {
  const ids = new Set<string>()
  for (const level of levels) {
    for (const id of level.wordIds) {
      ids.add(id)
    }
  }
  return ids
}

// ── Per-level dojo data ──────────────────────

export type KotobaDojoLevelData = {
  groups: readonly KotobaLevelGroup[]
  words: Readonly<Record<string, KotobaWord>>
}

export function buildKotobaDojoData(
  levels: readonly KotobaLevel[],
  wordBank: readonly WordBankEntry[],
  jlpt: JlptLevelLower,
): KotobaDojoLevelData {
  const groups = buildKotobaGroups(levels, jlpt)
  const levelWordIds = collectWordIds(levels)
  const words = buildWordLookup(wordBank, levelWordIds)
  return { groups, words }
}

// ── Eager N5 data ────────────────────────────

import { N5_LEVELS } from '@/data/words/kotoba-levels/n5'
import { N5_WORDS } from '@/data/words/n5'

const n5Data = buildKotobaDojoData(N5_LEVELS, N5_WORDS, 'n5')

export function getN5DojoData(): KotobaDojoLevelData {
  return n5Data
}

// ── Lazy loaders for N4-N1 ───────────────────

const dataCache = new Map<JlptLevelLower, KotobaDojoLevelData>()
dataCache.set('n5', n5Data)

export async function loadKotobaDojoData(jlpt: JlptLevelLower): Promise<KotobaDojoLevelData> {
  const cached = dataCache.get(jlpt)
  if (cached) return cached

  let data: KotobaDojoLevelData
  switch (jlpt) {
    case 'n4': {
      const [l, w] = await Promise.all([
        import('@/data/words/kotoba-levels/n4'),
        import('@/data/words/n4'),
      ])
      data = buildKotobaDojoData(l.N4_LEVELS, w.N4_WORDS, 'n4')
      break
    }
    case 'n3': {
      const [l, w] = await Promise.all([
        import('@/data/words/kotoba-levels/n3'),
        import('@/data/words/n3'),
      ])
      data = buildKotobaDojoData(l.N3_LEVELS, w.N3_WORDS, 'n3')
      break
    }
    case 'n2': {
      const [l, w] = await Promise.all([
        import('@/data/words/kotoba-levels/n2'),
        import('@/data/words/n2'),
      ])
      data = buildKotobaDojoData(l.N2_LEVELS, w.N2_WORDS, 'n2')
      break
    }
    case 'n1': {
      const [l, w] = await Promise.all([
        import('@/data/words/kotoba-levels/n1'),
        import('@/data/words/n1'),
      ])
      data = buildKotobaDojoData(l.N1_LEVELS, w.N1_WORDS, 'n1')
      break
    }
    default:
      return n5Data
  }

  dataCache.set(jlpt, data)
  return data
}
