// ─────────────────────────────────────────────
// File: samples/mastery-fixtures.ts
// Purpose: Mock mastery/unlock fixtures for the Kana Dojo visual shell.
//          Used while the real mastery store (Sprint 4) and Supabase
//          persistence are not yet wired up.
//          Three presets cover the key UI states:
//            - EMPTY_STATE: nothing unlocked, nothing practised.
//            - MID_PROGRESS: Seion Hiragana G1-2 unlocked with mixed scores,
//              one Katakana unlock for illustrating cross-script presence,
//              rest locked. Some scores land in the mastered band (40+) so
//              the gold ring renders.
//            - COMPLETE_STATE: every character unlocked, most scores above
//              the mastery threshold.
//          Wire-format uses a plain string[] (not Set) so the shape can
//          cross the Next.js server/client boundary without serialisation
//          warnings. Clients convert to Set internally for O(1) membership
//          checks (see KanaDojoClient).
// Depends on: data/kana/characters.ts, engine/mastery.ts
// ─────────────────────────────────────────────

import { KANA_CHARACTERS } from '@/data/kana/characters'
import { PROGRESSION_GROUPS } from '@/data/kana/progression-groups'
import { MASTERY_THRESHOLD } from '@/engine/mastery'

// ── Types ─────────────────────────────────────

export type MasteryState = {
  scores: Readonly<Record<string, number>>
  manuallyUnlocked: readonly string[]
}

export type FixtureKey = 'empty' | 'mid' | 'complete' | 'variety'

// ── Helpers ───────────────────────────────────

// Returns all character ids in a given progression group range for a script.
function idsInGroups(
  stage: 'seion' | 'dakuon' | 'yoon',
  script: 'hiragana' | 'katakana',
  maxGroupIndex: number,
): string[] {
  return PROGRESSION_GROUPS.filter(
    (g) => g.stage === stage && g.script === script && g.groupIndex <= maxGroupIndex,
  ).flatMap((g) => [...g.characterIds])
}

// ── Fixtures ──────────────────────────────────

export const EMPTY_STATE: MasteryState = {
  scores: {},
  manuallyUnlocked: [],
}

const MID_PROGRESS_SCORES: Record<string, number> = ((): Record<string, number> => {
  const scores: Record<string, number> = {}
  // Seion Hiragana Group 1: mostly practised, one mastered
  scores['h-a'] = MASTERY_THRESHOLD + 4 // mastered, gold ring
  scores['h-i'] = 18
  scores['h-u'] = 7
  scores['h-e'] = 12
  scores['h-o'] = 25
  scores['h-ka'] = 6
  scores['h-ki'] = 3
  scores['h-ku'] = 15
  scores['h-ke'] = 8
  scores['h-ko'] = 1
  // Seion Hiragana Group 2: freshly unlocked, small scores
  scores['h-sa'] = 2
  scores['h-shi'] = 0
  scores['h-su'] = 4
  scores['h-se'] = 1
  scores['h-so'] = 0
  scores['h-ta'] = 0
  scores['h-chi'] = 3
  scores['h-tsu'] = 0
  scores['h-te'] = 5
  scores['h-to'] = 0
  // One Katakana character unlocked manually (early-unlock style)
  scores['k-a'] = 1
  return scores
})()

export const MID_PROGRESS: MasteryState = {
  scores: MID_PROGRESS_SCORES,
  manuallyUnlocked: [
    ...idsInGroups('seion', 'hiragana', 2), // unlocks groups 1-2 of seion hiragana
    'k-a', // single katakana early-unlock
  ],
}

const COMPLETE_SCORES: Record<string, number> = ((): Record<string, number> => {
  const scores: Record<string, number> = {}
  for (const c of KANA_CHARACTERS) {
    // Scatter scores across the upper bands; every character well above threshold.
    const offset = Math.abs(c.id.charCodeAt(2) % 20)
    scores[c.id] = MASTERY_THRESHOLD + offset
  }
  return scores
})()

export const COMPLETE_STATE: MasteryState = {
  scores: COMPLETE_SCORES,
  manuallyUnlocked: KANA_CHARACTERS.map((c) => c.id),
}

// ── Variety fixture ───────────────────────────
// Seeds Hiragana Seion Group 1 with one character in each heat band so every
// visual state renders side by side. Group 2 is freshly unlocked with low
// scores; Groups 3+ stay locked. Katakana remains entirely locked. Useful for
// design review of tile states.

const VARIETY_SCORES: Record<string, number> = {
  // Group 1: one tile per heat band
  'h-a': 0, // heat-0 (unlocked, unpractised)
  'h-i': 3, // heat-1 (1-4)
  'h-u': 7, // heat-2 (5-9)
  'h-e': 15, // heat-3 (10-19)
  'h-o': 28, // heat-4 (20-39)
  'h-ka': 44, // heat-5 + gold mastered (40+)
  'h-ki': 2, // heat-1 sanity
  'h-ku': 0, // unlocked but unpractised (via manual)
  // h-ke, h-ko left out so they appear locked
  // Group 2: freshly unlocked, small scores
  'h-sa': 1,
  'h-shi': 0,
  'h-su': 2,
}

export const VARIETY_STATE: MasteryState = {
  scores: VARIETY_SCORES,
  manuallyUnlocked: [
    // Group 1 partial unlocks via manual
    'h-a',
    'h-i',
    'h-u',
    'h-e',
    'h-o',
    'h-ka',
    'h-ki',
    'h-ku',
    // Group 2 all unlocked via manual so progression looks active
    'h-sa',
    'h-shi',
    'h-su',
    'h-se',
    'h-so',
    'h-ta',
    'h-chi',
    'h-tsu',
    'h-te',
    'h-to',
  ],
}

// ── Access ────────────────────────────────────

export function getFixture(key: FixtureKey): MasteryState {
  switch (key) {
    case 'empty':
      return EMPTY_STATE
    case 'mid':
      return MID_PROGRESS
    case 'complete':
      return COMPLETE_STATE
    case 'variety':
      return VARIETY_STATE
  }
}
