// ─────────────────────────────────────────────
// File: engine/__tests__/practice-eligibility.test.ts
// Purpose: Tests for the three-set eligibility system.
//          Covers progression expansion, manual unlock bypass,
//          always-unlocked specials, solo drill exclusion,
//          and eligible word counting.
// Depends on: engine/practice-eligibility.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  getPracticeAvailableIds,
  getWordEligibleIds,
  getDojoUnlockedIds,
  getSoloDrillPool,
  countEligibleWords,
} from '../practice-eligibility'
import type { ProgressionGroup } from '@/types/kana.types'

// ── Test fixtures ─────────────────────────────

const GROUP_A: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 1,
  characterIds: ['h-a', 'h-i', 'h-u'],
}

const GROUP_B: ProgressionGroup = {
  stage: 'seion',
  script: 'hiragana',
  groupIndex: 2,
  characterIds: ['h-ka', 'h-ki'],
}

const GROUP_C: ProgressionGroup = {
  stage: 'seion',
  script: 'katakana',
  groupIndex: 3,
  characterIds: ['k-a', 'k-i'],
}

const GROUPS = [GROUP_A, GROUP_B, GROUP_C]
const STEPS: readonly (readonly number[])[] = [[0], [1], [2]]

const WORD_BANK = [
  { characterIds: ['h-a', 'h-i'] },
  { characterIds: ['h-a', 'h-ka'] },
  { characterIds: ['h-u', 'k-a'] },
]

// ── getPracticeAvailableIds ───────────────────

describe('getPracticeAvailableIds', () => {
  it('step 0 is always available for a fresh player', () => {
    const ids = getPracticeAvailableIds({}, new Set(), GROUPS, STEPS)
    expect(ids.has('h-a')).toBe(true)
    expect(ids.has('h-i')).toBe(true)
    expect(ids.has('h-u')).toBe(true)
    expect(ids.has('h-ka')).toBe(false)
  })

  it('step 1 opens when step 0 characters all reach threshold', () => {
    const scores = { 'h-a': 5, 'h-i': 5, 'h-u': 5 }
    const ids = getPracticeAvailableIds(scores, new Set(), GROUPS, STEPS)
    expect(ids.has('h-ka')).toBe(true)
    expect(ids.has('h-ki')).toBe(true)
    expect(ids.has('k-a')).toBe(false)
  })

  it('step 1 does not open when one step 0 character is below threshold', () => {
    const scores = { 'h-a': 5, 'h-i': 4, 'h-u': 5 }
    const ids = getPracticeAvailableIds(scores, new Set(), GROUPS, STEPS)
    expect(ids.has('h-ka')).toBe(false)
  })

  it('manual unlocks satisfy step completion', () => {
    const scores = { 'h-a': 5, 'h-u': 5 }
    const manual = new Set(['h-i'])
    const ids = getPracticeAvailableIds(scores, manual, GROUPS, STEPS)
    expect(ids.has('h-ka')).toBe(true)
  })

  it('manual unlocks are always practice-available regardless of step', () => {
    const manual = new Set(['k-a'])
    const ids = getPracticeAvailableIds({}, manual, GROUPS, STEPS)
    expect(ids.has('k-a')).toBe(true)
  })

  it('always-unlocked specials are included', () => {
    const ids = getPracticeAvailableIds({}, new Set(), GROUPS, STEPS)
    expect(ids.has('h-sokuon')).toBe(true)
    expect(ids.has('k-sokuon')).toBe(true)
    expect(ids.has('k-longvowel')).toBe(true)
  })

  it('all steps open when all are complete', () => {
    const scores = { 'h-a': 5, 'h-i': 5, 'h-u': 5, 'h-ka': 5, 'h-ki': 5 }
    const ids = getPracticeAvailableIds(scores, new Set(), GROUPS, STEPS)
    expect(ids.has('k-a')).toBe(true)
    expect(ids.has('k-i')).toBe(true)
  })
})

// ── getWordEligibleIds ────────────────────────

describe('getWordEligibleIds', () => {
  it('includes characters at or above threshold', () => {
    const ids = getWordEligibleIds({ 'h-a': 5, 'h-i': 3 }, new Set())
    expect(ids.has('h-a')).toBe(true)
    expect(ids.has('h-i')).toBe(false)
  })

  it('includes manual unlocks even at score 0', () => {
    const ids = getWordEligibleIds({}, new Set(['h-ka']))
    expect(ids.has('h-ka')).toBe(true)
  })

  it('includes always-unlocked specials', () => {
    const ids = getWordEligibleIds({}, new Set())
    expect(ids.has('h-sokuon')).toBe(true)
    expect(ids.has('k-longvowel')).toBe(true)
  })
})

// ── getDojoUnlockedIds ────────────────────────

describe('getDojoUnlockedIds', () => {
  it('returns the same set as wordEligible', () => {
    const scores = { 'h-a': 5 }
    const manual = new Set(['h-ki'])
    const word = getWordEligibleIds(scores, manual)
    const dojo = getDojoUnlockedIds(scores, manual)
    expect([...dojo].sort()).toEqual([...word].sort())
  })
})

// ── getSoloDrillPool ──────────────────────────

describe('getSoloDrillPool', () => {
  it('excludes sokuon and longvowel from drill pool', () => {
    const practice = new Set(['h-a', 'h-sokuon', 'k-sokuon', 'k-longvowel'])
    const pool = getSoloDrillPool(practice)
    expect(pool.has('h-a')).toBe(true)
    expect(pool.has('h-sokuon')).toBe(false)
    expect(pool.has('k-sokuon')).toBe(false)
    expect(pool.has('k-longvowel')).toBe(false)
  })
})

// ── countEligibleWords ────────────────────────

describe('countEligibleWords', () => {
  it('counts words where all characters are word-eligible', () => {
    const eligible = new Set(['h-a', 'h-i'])
    expect(countEligibleWords(eligible, WORD_BANK)).toBe(1)
  })

  it('returns 0 when no words are fully eligible', () => {
    const eligible = new Set(['h-a'])
    expect(countEligibleWords(eligible, WORD_BANK)).toBe(0)
  })

  it('counts all words when all characters are eligible', () => {
    const eligible = new Set(['h-a', 'h-i', 'h-u', 'h-ka', 'k-a'])
    expect(countEligibleWords(eligible, WORD_BANK)).toBe(3)
  })
})
