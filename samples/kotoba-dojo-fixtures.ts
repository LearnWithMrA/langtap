// ─────────────────────────────────────────────
// File: samples/kotoba-dojo-fixtures.ts
// Purpose: Mock Kotoba fixtures for the /dojo/kotoba visual shell. Used
//          while the real word bank (Sprint 5) and mastery store
//          (Sprint 4) are not yet wired up.
//          Every JLPT level (N5-N1) is populated with three units of
//          two level groups of twelve words each, so the owner can page
//          through every tab and review the shell at realistic density.
//          Words are hand-authored sample content chosen to be
//          plausibly level-appropriate; the real pipeline (CONTENT.md
//          §7.3, Sprint 5) will replace them with JMdict-derived data.
//          Scores follow a deterministic pattern per group so each
//          group contains at least one tile in every heat band, two
//          tiles that need manual unlock (low score, in the manual
//          set), and two tiles that stay locked (score below threshold,
//          not in the manual set).
// Depends on: types/kotoba.types.ts, engine/mastery.ts
// ─────────────────────────────────────────────

import { MASTERY_THRESHOLD } from '@/engine/mastery'
import type {
  JlptLevel,
  KotobaDojoFixture,
  KotobaFixtureKey,
  KotobaUnit,
  KotobaWord,
} from '@/types/kotoba.types'
import {
  N5_U1_G1,
  N5_U1_G2,
  N5_U2_G1,
  N5_U2_G2,
  N5_U3_G1,
  N5_U3_G2,
  N4_U1_G1,
  N4_U1_G2,
  N4_U2_G1,
  N4_U2_G2,
  N4_U3_G1,
  N4_U3_G2,
  N3_U1_G1,
  N3_U1_G2,
  N3_U2_G1,
  N3_U2_G2,
  N3_U3_G1,
  N3_U3_G2,
  N2_U1_G1,
  N2_U1_G2,
  N2_U2_G1,
  N2_U2_G2,
  N2_U3_G1,
  N2_U3_G2,
  N1_U1_G1,
  N1_U1_G2,
  N1_U2_G1,
  N1_U2_G2,
  N1_U3_G1,
  N1_U3_G2,
} from '@/samples/kotoba-dojo-words'

// ── Aggregations ──────────────────────────────

type GroupTuple = readonly [readonly KotobaWord[], readonly KotobaWord[]]
type LevelTuple = readonly [GroupTuple, GroupTuple, GroupTuple]

const LEVEL_WORDS: Readonly<Record<JlptLevel, LevelTuple>> = {
  n5: [
    [N5_U1_G1, N5_U1_G2],
    [N5_U2_G1, N5_U2_G2],
    [N5_U3_G1, N5_U3_G2],
  ],
  n4: [
    [N4_U1_G1, N4_U1_G2],
    [N4_U2_G1, N4_U2_G2],
    [N4_U3_G1, N4_U3_G2],
  ],
  n3: [
    [N3_U1_G1, N3_U1_G2],
    [N3_U2_G1, N3_U2_G2],
    [N3_U3_G1, N3_U3_G2],
  ],
  n2: [
    [N2_U1_G1, N2_U1_G2],
    [N2_U2_G1, N2_U2_G2],
    [N2_U3_G1, N2_U3_G2],
  ],
  n1: [
    [N1_U1_G1, N1_U1_G2],
    [N1_U2_G1, N1_U2_G2],
    [N1_U3_G1, N1_U3_G2],
  ],
}

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

const ALL_WORDS: readonly KotobaWord[] = (Object.values(LEVEL_WORDS) as LevelTuple[]).flatMap(
  (level) => level.flatMap((unit) => [...unit[0], ...unit[1]]),
)

const WORDS_BY_ID: Readonly<Record<string, KotobaWord>> = ((): Readonly<
  Record<string, KotobaWord>
> => {
  const out: Record<string, KotobaWord> = {}
  for (const entry of ALL_WORDS) out[entry.id] = entry
  return out
})()

// ── Scoring pattern ───────────────────────────
// Twelve positions per group. Picked so each group exercises every
// heat band plus two manual-unlocks (positions 4 and 9) and two locked
// tiles (positions 5 and 11 - score below UNLOCK_THRESHOLD and not in
// the manual set).

const SCORE_PATTERN: readonly number[] = [
  MASTERY_THRESHOLD + 5, // 0: gold (45)
  28, // 1: heat-4
  15, // 2: heat-3
  7, // 3: heat-2
  2, // 4: heat-1 (manual unlock required)
  0, // 5: locked
  38, // 6: heat-4
  20, // 7: heat-4
  12, // 8: heat-3
  4, // 9: heat-1 (manual unlock required)
  8, // 10: heat-2
  0, // 11: locked
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

const VARIETY_SCORES: Readonly<Record<string, number>> = ((): Readonly<Record<string, number>> => {
  const out: Record<string, number> = {}
  for (const level of Object.values(LEVEL_WORDS)) {
    for (const unit of level) {
      for (const group of unit) {
        Object.assign(out, buildScoresForGroup(group))
      }
    }
  }
  return out
})()

const VARIETY_MANUAL_WORDS: readonly string[] = ((): readonly string[] => {
  const out: string[] = []
  for (const level of Object.values(LEVEL_WORDS)) {
    for (const unit of level) {
      for (const group of unit) {
        out.push(...manualUnlocksForGroup(group))
      }
    }
  }
  return out
})()

const COMPLETE_SCORES: Readonly<Record<string, number>> = ((): Readonly<Record<string, number>> => {
  const out: Record<string, number> = {}
  for (const entry of ALL_WORDS) {
    out[entry.id] = MASTERY_THRESHOLD + (entry.id.charCodeAt(2) % 15)
  }
  return out
})()

// ── Unit builder ──────────────────────────────

function buildUnits(level: JlptLevel): readonly KotobaUnit[] {
  return LEVEL_WORDS[level].map((unitGroups, unitIndex): KotobaUnit => {
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

const LEVELS: Readonly<Record<JlptLevel, readonly KotobaUnit[]>> = {
  n5: buildUnits('n5'),
  n4: buildUnits('n4'),
  n3: buildUnits('n3'),
  n2: buildUnits('n2'),
  n1: buildUnits('n1'),
}

// ── Fixtures ──────────────────────────────────

export const EMPTY_STATE: KotobaDojoFixture = {
  levels: LEVELS,
  words: WORDS_BY_ID,
  mastery: {
    scores: {},
    manuallyUnlockedUnits: [],
    manuallyUnlockedWords: [],
  },
}

export const VARIETY_STATE: KotobaDojoFixture = {
  levels: LEVELS,
  words: WORDS_BY_ID,
  mastery: {
    scores: VARIETY_SCORES,
    manuallyUnlockedUnits: [],
    manuallyUnlockedWords: VARIETY_MANUAL_WORDS,
  },
}

export const COMPLETE_STATE: KotobaDojoFixture = {
  levels: LEVELS,
  words: WORDS_BY_ID,
  mastery: {
    scores: COMPLETE_SCORES,
    manuallyUnlockedUnits: [],
    manuallyUnlockedWords: ALL_WORDS.map((entry) => entry.id),
  },
}

// ── Access ────────────────────────────────────

export function getKotobaFixture(key: KotobaFixtureKey): KotobaDojoFixture {
  switch (key) {
    case 'empty':
      return EMPTY_STATE
    case 'variety':
      return VARIETY_STATE
    case 'complete':
      return COMPLETE_STATE
  }
}
