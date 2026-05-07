// ─────────────────────────────────────────────
// File: services/__tests__/import-snapshot.test.ts
// Purpose: Tests for the import snapshot builder. Validates
//          parsing of Zustand persist format, v1 backfill,
//          and payload construction from localStorage data.
// Depends on: services/import-snapshot.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildImportPayload } from '../import-snapshot'

// ── Helpers ───────────────────────────────────

function wrap(state: Record<string, unknown>, version = 2): string {
  return JSON.stringify({ state, version })
}

// ── Tests ─────────────────────────────────────

describe('buildImportPayload', () => {
  it('builds mastery rows from scores and learningScores', () => {
    const keys = {
      'langtap-mastery': wrap({
        scores: { 'h-a': 10, 'h-i': 3 },
        learningScores: { 'h-a': 5, 'h-i': 2 },
        epoch: 0,
      }),
    }

    const payload = buildImportPayload(keys)

    expect(payload.mastery).toHaveLength(2)
    expect(payload.mastery).toContainEqual({ character_id: 'h-a', score: 10, learning_score: 5 })
    expect(payload.mastery).toContainEqual({ character_id: 'h-i', score: 3, learning_score: 2 })
  })

  it('builds word mastery rows and word manual unlocks', () => {
    const keys = {
      'langtap-word-mastery': wrap({
        scores: { 'w-1': 5, 'w-2': 8 },
        manuallyUnlockedWords: ['w-3', 'w-4'],
        epoch: 0,
      }),
    }

    const payload = buildImportPayload(keys)

    expect(payload.word_mastery).toHaveLength(2)
    expect(payload.word_mastery).toContainEqual({ word_id: 'w-1', score: 5 })
    expect(payload.word_mastery).toContainEqual({ word_id: 'w-2', score: 8 })
    expect(payload.word_manual_unlocks).toEqual(['w-3', 'w-4'])
  })

  it('builds kana manual unlocks from onboarding store', () => {
    const keys = {
      'langtap-onboarding': wrap({
        selectedCharacterIds: ['h-ka', 'h-sa', 'k-a'],
        jlptLevel: 'N5',
      }),
    }

    const payload = buildImportPayload(keys)

    expect(payload.manual_unlocks).toEqual(['h-ka', 'h-sa', 'k-a'])
  })

  it('backfills learningScores from scores for v1 stores', () => {
    const keys = {
      'langtap-mastery': wrap(
        {
          scores: { 'h-a': 10, 'h-i': 3, 'h-u': 0 },
          epoch: 0,
        },
        1,
      ),
    }

    const payload = buildImportPayload(keys)

    expect(payload.mastery).toContainEqual({ character_id: 'h-a', score: 10, learning_score: 5 })
    expect(payload.mastery).toContainEqual({ character_id: 'h-i', score: 3, learning_score: 3 })
    expect(payload.mastery).toContainEqual({ character_id: 'h-u', score: 0, learning_score: 0 })
  })

  it('returns empty arrays for missing keys', () => {
    const payload = buildImportPayload({})

    expect(payload.mastery).toEqual([])
    expect(payload.word_mastery).toEqual([])
    expect(payload.manual_unlocks).toEqual([])
    expect(payload.word_manual_unlocks).toEqual([])
  })

  it('handles malformed JSON gracefully', () => {
    const keys = {
      'langtap-mastery': 'not json',
      'langtap-word-mastery': '{"bad": true}',
    }

    const payload = buildImportPayload(keys)

    expect(payload.mastery).toEqual([])
    expect(payload.word_mastery).toEqual([])
  })

  it('combines all stores into a single payload', () => {
    const keys = {
      'langtap-mastery': wrap({
        scores: { 'h-a': 10 },
        learningScores: { 'h-a': 5 },
      }),
      'langtap-word-mastery': wrap({
        scores: { 'w-1': 3 },
        manuallyUnlockedWords: ['w-2'],
      }),
      'langtap-onboarding': wrap({
        selectedCharacterIds: ['h-ka'],
      }),
    }

    const payload = buildImportPayload(keys)

    expect(payload.mastery).toHaveLength(1)
    expect(payload.word_mastery).toHaveLength(1)
    expect(payload.manual_unlocks).toEqual(['h-ka'])
    expect(payload.word_manual_unlocks).toEqual(['w-2'])
  })

  it('rejects entire score map if any value is non-number', () => {
    const keys = {
      'langtap-mastery': wrap({
        scores: { 'h-a': 'bad', 'h-i': 3 },
        learningScores: {},
      }),
    }

    const payload = buildImportPayload(keys)

    expect(payload.mastery).toEqual([])
  })

  it('ignores non-string values in unlock arrays', () => {
    const keys = {
      'langtap-onboarding': wrap({
        selectedCharacterIds: ['h-a', 42, null, 'h-i'],
      }),
    }

    const payload = buildImportPayload(keys)

    expect(payload.manual_unlocks).toEqual([])
  })
})
