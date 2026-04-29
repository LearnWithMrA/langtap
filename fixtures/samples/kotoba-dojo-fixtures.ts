// ─────────────────────────────────────────────
// File: samples/kotoba-dojo-fixtures.ts
// Purpose: Mock Kotoba fixtures for the /dojo/kotoba visual shell.
//          N5 words load eagerly (default tab). N4-N1 words load
//          on demand when the user switches tabs, keeping the
//          initial bundle small. Word data is split per JLPT level
//          in samples/kotoba-words-{n5..n1}.ts.
// Depends on: types/kotoba.types.ts, engine/mastery.ts,
//             samples/kotoba-words-n5.ts (eager),
//             samples/kotoba-words-{n4,n3,n2,n1}.ts (lazy)
// ─────────────────────────────────────────────

import { MASTERY_THRESHOLD } from '@/engine/mastery'
import type {
  JlptLevel,
  KotobaDojoFixture,
  KotobaFixtureKey,
  KotobaUnit,
  KotobaWord,
} from '@/types/kotoba.types'

// N5 loads eagerly (default tab, always visible on first render)
import {
  N5_U1_G1,
  N5_U1_G2,
  N5_U2_G1,
  N5_U2_G2,
  N5_U3_G1,
  N5_U3_G2,
} from '@/fixtures/samples/kotoba-words-n5'

// ── Types ─────────────────────────────────────

type GroupTuple = readonly [readonly KotobaWord[], readonly KotobaWord[]]
type LevelTuple = readonly [GroupTuple, GroupTuple, GroupTuple]

type LevelWordModule = {
  [key: string]: readonly KotobaWord[]
}

// ── Lazy level loaders ────────────────────────

const levelWordCache = new Map<JlptLevel, LevelTuple>()

function extractLevelTuple(mod: LevelWordModule, prefix: string): LevelTuple {
  return [
    [mod[`${prefix}_U1_G1`], mod[`${prefix}_U1_G2`]],
    [mod[`${prefix}_U2_G1`], mod[`${prefix}_U2_G2`]],
    [mod[`${prefix}_U3_G1`], mod[`${prefix}_U3_G2`]],
  ] as LevelTuple
}

const N5_TUPLE: LevelTuple = [
  [N5_U1_G1, N5_U1_G2],
  [N5_U2_G1, N5_U2_G2],
  [N5_U3_G1, N5_U3_G2],
]
levelWordCache.set('n5', N5_TUPLE)

async function loadLevelWords(level: JlptLevel): Promise<LevelTuple> {
  const cached = levelWordCache.get(level)
  if (cached) return cached

  let mod: LevelWordModule
  switch (level) {
    case 'n4':
      mod = (await import('@/fixtures/samples/kotoba-words-n4')) as LevelWordModule
      break
    case 'n3':
      mod = (await import('@/fixtures/samples/kotoba-words-n3')) as LevelWordModule
      break
    case 'n2':
      mod = (await import('@/fixtures/samples/kotoba-words-n2')) as LevelWordModule
      break
    case 'n1':
      mod = (await import('@/fixtures/samples/kotoba-words-n1')) as LevelWordModule
      break
    default:
      mod = (await import('@/fixtures/samples/kotoba-words-n5')) as LevelWordModule
  }

  const prefix = level.toUpperCase()
  const tuple = extractLevelTuple(mod, prefix)
  levelWordCache.set(level, tuple)
  return tuple
}

// ── Constants ─────────────────────────────────

const UNIT_RANGES: readonly [string, string, string, string, string, string] = [
  'Levels 1-2',
  'Levels 3-4',
  'Levels 5-6',
  'Levels 7-8',
  'Levels 9-10',
  'Levels 11-12',
]

const UNIT_RANGE_LABELS: readonly [string, string, string] = [
  'Levels 1-4',
  'Levels 5-8',
  'Levels 9-12',
]

// ── Scoring pattern ───────────────────────────

const SCORE_PATTERN: readonly number[] = [
  MASTERY_THRESHOLD + 5,
  28,
  15,
  7,
  2,
  0,
  38,
  20,
  12,
  4,
  8,
  0,
]

const MANUAL_POSITIONS: readonly number[] = [4, 9]

function buildScoresForGroup(words: readonly KotobaWord[]): Readonly<Record<string, number>> {
  const out: Record<string, number> = {}
  words.forEach((entry, i) => {
    out[entry.id] = SCORE_PATTERN[i % SCORE_PATTERN.length] ?? 0
  })
  return out
}

function manualUnlocksForGroup(words: readonly KotobaWord[]): readonly string[] {
  return words
    .filter((_, i) => MANUAL_POSITIONS.includes(i % SCORE_PATTERN.length))
    .map((entry) => entry.id)
}

// ── Unit builder ──────────────────────────────

function buildUnits(level: JlptLevel, levelWords: LevelTuple): readonly KotobaUnit[] {
  return levelWords.map((unitGroups, unitIndex): KotobaUnit => {
    const [g1, g2] = unitGroups
    const rangeLabels: readonly [string, string] = [
      UNIT_RANGES[unitIndex * 2],
      UNIT_RANGES[unitIndex * 2 + 1],
    ]
    return {
      id: `${level}-u${unitIndex + 1}`,
      label: `Unit ${unitIndex + 1}`,
      levelRange: UNIT_RANGE_LABELS[unitIndex],
      jlpt: level,
      groups: [
        {
          id: `${level}-u${unitIndex + 1}-g1`,
          label: rangeLabels[0],
          wordIds: g1.map((entry) => entry.id),
        },
        {
          id: `${level}-u${unitIndex + 1}-g2`,
          label: rangeLabels[1],
          wordIds: g2.map((entry) => entry.id),
        },
      ],
    }
  })
}

function buildWordsMap(levelWords: LevelTuple): Readonly<Record<string, KotobaWord>> {
  const out: Record<string, KotobaWord> = {}
  for (const unit of levelWords) {
    for (const group of unit) {
      for (const entry of group) {
        out[entry.id] = entry
      }
    }
  }
  return out
}

function buildScores(levelWords: LevelTuple): Readonly<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const unit of levelWords) {
    for (const group of unit) {
      Object.assign(out, buildScoresForGroup(group))
    }
  }
  return out
}

function buildManualUnlocks(levelWords: LevelTuple): readonly string[] {
  const out: string[] = []
  for (const unit of levelWords) {
    for (const group of unit) {
      out.push(...manualUnlocksForGroup(group))
    }
  }
  return out
}

// ── Per-level fixture data ────────────────────

export type KotobaLevelFixture = {
  units: readonly KotobaUnit[]
  words: Readonly<Record<string, KotobaWord>>
  scores: Readonly<Record<string, number>>
  manualUnlocks: readonly string[]
  completeScores: Readonly<Record<string, number>>
  allWordIds: readonly string[]
}

function buildLevelFixture(level: JlptLevel, levelWords: LevelTuple): KotobaLevelFixture {
  const words = buildWordsMap(levelWords)
  const allWords = Object.values(words)
  const completeScores: Record<string, number> = {}
  for (const entry of allWords) {
    completeScores[entry.id] = MASTERY_THRESHOLD + (entry.id.charCodeAt(2) % 15)
  }

  return {
    units: buildUnits(level, levelWords),
    words,
    scores: buildScores(levelWords),
    manualUnlocks: buildManualUnlocks(levelWords),
    completeScores,
    allWordIds: allWords.map((e) => e.id),
  }
}

// ── Sync access for N5 (default tab) ──────────

const n5Fixture = buildLevelFixture('n5', N5_TUPLE)

export function getN5Fixture(): KotobaLevelFixture {
  return n5Fixture
}

// ── Async access for any level ────────────────

const levelFixtureCache = new Map<JlptLevel, KotobaLevelFixture>()
levelFixtureCache.set('n5', n5Fixture)

export async function getLevelFixture(level: JlptLevel): Promise<KotobaLevelFixture> {
  const cached = levelFixtureCache.get(level)
  if (cached) return cached

  const levelWords = await loadLevelWords(level)
  const fixture = buildLevelFixture(level, levelWords)
  levelFixtureCache.set(level, fixture)
  return fixture
}

// ── Legacy sync API (loads all levels eagerly) ─

export function getKotobaFixture(key: KotobaFixtureKey): KotobaDojoFixture {
  const allLevels: JlptLevel[] = ['n5', 'n4', 'n3', 'n2', 'n1']
  const levels: Record<string, readonly KotobaUnit[]> = {}
  const words: Record<string, KotobaWord> = {}
  const scores: Record<string, number> = {}
  const manualUnlocks: string[] = []
  const completeScores: Record<string, number> = {}
  const allWordIds: string[] = []

  for (const level of allLevels) {
    const cached = levelFixtureCache.get(level)
    if (!cached) continue
    levels[level] = cached.units
    Object.assign(words, cached.words)
    Object.assign(scores, cached.scores)
    manualUnlocks.push(...cached.manualUnlocks)
    Object.assign(completeScores, cached.completeScores)
    allWordIds.push(...cached.allWordIds)
  }

  switch (key) {
    case 'empty':
      return {
        levels: levels as Readonly<Record<JlptLevel, readonly KotobaUnit[]>>,
        words,
        mastery: { scores: {}, manuallyUnlockedUnits: [], manuallyUnlockedWords: [] },
      }
    case 'variety':
      return {
        levels: levels as Readonly<Record<JlptLevel, readonly KotobaUnit[]>>,
        words,
        mastery: { scores, manuallyUnlockedUnits: [], manuallyUnlockedWords: manualUnlocks },
      }
    case 'complete':
      return {
        levels: levels as Readonly<Record<JlptLevel, readonly KotobaUnit[]>>,
        words,
        mastery: {
          scores: completeScores,
          manuallyUnlockedUnits: [],
          manuallyUnlockedWords: allWordIds,
        },
      }
  }
}
