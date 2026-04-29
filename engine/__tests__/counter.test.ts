// ------------------------------------------------------------
// File: engine/__tests__/counter.test.ts
// Purpose: Tests for word counter logic and reset behaviour.
// Depends on: engine/counter.ts, engine/constants.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  incrementWordCounter,
  shouldResetCounters,
  resetCountersForCharacter,
  getWordCounterWeight,
  sanitizeCounter,
} from '@/engine/counter'
import { MAX_WORD_COUNTER } from '@/engine/constants'

// ── incrementWordCounter ─────────────────────

describe('incrementWordCounter', () => {
  it('increments a new word from 0 to 1', () => {
    const result = incrementWordCounter({}, 'word-1')
    expect(result['word-1']).toBe(1)
  })

  it('increments an existing word', () => {
    const result = incrementWordCounter({ 'word-1': 3 }, 'word-1')
    expect(result['word-1']).toBe(4)
  })

  it('caps at MAX_WORD_COUNTER when incrementing from threshold - 1', () => {
    const result = incrementWordCounter({ 'word-1': MAX_WORD_COUNTER - 1 }, 'word-1')
    expect(result['word-1']).toBe(MAX_WORD_COUNTER)
  })

  it('stays at MAX_WORD_COUNTER when already at max', () => {
    const result = incrementWordCounter({ 'word-1': MAX_WORD_COUNTER }, 'word-1')
    expect(result['word-1']).toBe(MAX_WORD_COUNTER)
  })

  it('does not mutate the input map', () => {
    const original = { 'word-1': 2 }
    const result = incrementWordCounter(original, 'word-1')
    expect(original['word-1']).toBe(2)
    expect(result['word-1']).toBe(3)
  })

  it('preserves other word counters unchanged', () => {
    const result = incrementWordCounter({ 'word-1': 2, 'word-2': 4 }, 'word-1')
    expect(result['word-2']).toBe(4)
  })
})

// ── shouldResetCounters ──────────────────────

describe('shouldResetCounters', () => {
  it('returns false when one word is below MAX_WORD_COUNTER', () => {
    const counters = { 'w-1': MAX_WORD_COUNTER, 'w-2': MAX_WORD_COUNTER - 1 }
    expect(shouldResetCounters(counters, ['w-1', 'w-2'])).toBe(false)
  })

  it('returns false when all words are at 0', () => {
    expect(shouldResetCounters({ 'w-1': 0, 'w-2': 0 }, ['w-1', 'w-2'])).toBe(false)
  })

  it('returns true when all words are at MAX_WORD_COUNTER', () => {
    const counters = { 'w-1': MAX_WORD_COUNTER, 'w-2': MAX_WORD_COUNTER }
    expect(shouldResetCounters(counters, ['w-1', 'w-2'])).toBe(true)
  })

  it('returns true when all words are above MAX_WORD_COUNTER (defensive)', () => {
    expect(shouldResetCounters({ 'w-1': 99 }, ['w-1'])).toBe(true)
  })

  it('returns false for an empty word ID list', () => {
    expect(shouldResetCounters({ 'w-1': MAX_WORD_COUNTER }, [])).toBe(false)
  })

  it('returns false when one word has no counter entry (defaults to 0)', () => {
    expect(shouldResetCounters({ 'w-1': MAX_WORD_COUNTER }, ['w-1', 'w-2'])).toBe(false)
  })
})

// ── resetCountersForCharacter ───────────���────

describe('resetCountersForCharacter', () => {
  it('resets specified word IDs to 0', () => {
    const counters = { 'w-1': 5, 'w-2': 3 }
    const result = resetCountersForCharacter(counters, ['w-1', 'w-2'])
    expect(result['w-1']).toBe(0)
    expect(result['w-2']).toBe(0)
  })

  it('preserves counters for word IDs not in the list', () => {
    const counters = { 'w-1': 5, 'w-other': 3 }
    const result = resetCountersForCharacter(counters, ['w-1'])
    expect(result['w-other']).toBe(3)
  })

  it('does not mutate the input map', () => {
    const original = { 'w-1': 5 }
    resetCountersForCharacter(original, ['w-1'])
    expect(original['w-1']).toBe(5)
  })

  it('does not create entries for word IDs not already in the map', () => {
    const counters = { 'w-1': 5 }
    const result = resetCountersForCharacter(counters, ['w-1', 'w-unknown'])
    expect('w-unknown' in result).toBe(false)
    expect(result['w-1']).toBe(0)
  })

  it('handles duplicate word IDs in the reset list', () => {
    const counters = { 'w-1': 5 }
    const result = resetCountersForCharacter(counters, ['w-1', 'w-1'])
    expect(result['w-1']).toBe(0)
  })
})

// ── getWordCounterWeight ─────────────────────

describe('getWordCounterWeight', () => {
  it('returns MAX_WORD_COUNTER + 1 for counter 0 (highest weight)', () => {
    expect(getWordCounterWeight(0)).toBe(MAX_WORD_COUNTER + 1)
  })

  it('returns 1 for counter at MAX_WORD_COUNTER (lowest weight)', () => {
    expect(getWordCounterWeight(MAX_WORD_COUNTER)).toBe(1)
  })

  it('returns correct intermediate values', () => {
    expect(getWordCounterWeight(1)).toBe(MAX_WORD_COUNTER)
    expect(getWordCounterWeight(2)).toBe(MAX_WORD_COUNTER - 1)
  })

  it('clamps negative counter to 0 (returns max weight)', () => {
    expect(getWordCounterWeight(-3)).toBe(MAX_WORD_COUNTER + 1)
  })

  it('clamps counter above MAX_WORD_COUNTER to MAX_WORD_COUNTER', () => {
    expect(getWordCounterWeight(99)).toBe(1)
  })

  it('handles NaN as 0 (max weight)', () => {
    expect(getWordCounterWeight(NaN)).toBe(MAX_WORD_COUNTER + 1)
  })

  it('handles Infinity as MAX_WORD_COUNTER (min weight)', () => {
    expect(getWordCounterWeight(Infinity)).toBe(1)
  })

  it('handles -Infinity as 0 (max weight)', () => {
    expect(getWordCounterWeight(-Infinity)).toBe(MAX_WORD_COUNTER + 1)
  })
})

// ── sanitizeCounter ──────────────────────────

describe('sanitizeCounter', () => {
  it('passes through valid values unchanged', () => {
    expect(sanitizeCounter(3)).toBe(3)
  })

  it('clamps negative to 0', () => {
    expect(sanitizeCounter(-1)).toBe(0)
  })

  it('clamps above MAX_WORD_COUNTER', () => {
    expect(sanitizeCounter(99)).toBe(MAX_WORD_COUNTER)
  })

  it('floors fractional values', () => {
    expect(sanitizeCounter(2.7)).toBe(2)
  })

  it('returns 0 for NaN', () => {
    expect(sanitizeCounter(NaN)).toBe(0)
  })

  it('clamps Infinity to MAX_WORD_COUNTER', () => {
    expect(sanitizeCounter(Infinity)).toBe(MAX_WORD_COUNTER)
  })
})
