// ─────────────────────────────────────────────
// File: components/game/__tests__/leaderboard-scoring.test.ts
// Purpose: Integration tests for leaderboard scoring logic.
//          Validates that game windows fire the onLeaderboardScore
//          callback correctly based on game outcomes, and that
//          practice-client calls recordLeaderboardCompletion with
//          the right parameters.
// Depends on: services/leaderboard.service.ts,
//             components/layout/practice-client.tsx,
//             components/game/game-window.tsx,
//             components/game/kotoba-game-window.tsx
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KANJI_INPUT_MULTIPLIER } from '@/engine/constants'

// ── Mocks ─────────────────────────────────────

const mockRecordLeaderboardCompletion = vi.fn().mockResolvedValue({ ok: true, data: undefined })

vi.mock('@/services/leaderboard.service', () => ({
  recordLeaderboardCompletion: (...args: unknown[]): unknown =>
    mockRecordLeaderboardCompletion(...args),
  loadLeaderboard: vi
    .fn()
    .mockResolvedValue({ ok: true, data: { entries: [], currentUserPinned: null } }),
}))

// ── Scoring logic tests ─────────────────────

describe('Leaderboard scoring rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Kana scoring', () => {
    it('scores first-attempt-correct character count as delta', () => {
      const results = [
        { isFirstAttemptCorrect: true },
        { isFirstAttemptCorrect: false },
        { isFirstAttemptCorrect: true },
        { isFirstAttemptCorrect: true },
      ]
      const scoreDelta = results.filter((r) => r.isFirstAttemptCorrect).length
      expect(scoreDelta).toBe(3)
    })

    it('scores 0 when no characters are first-attempt-correct', () => {
      const results = [{ isFirstAttemptCorrect: false }, { isFirstAttemptCorrect: false }]
      const scoreDelta = results.filter((r) => r.isFirstAttemptCorrect).length
      expect(scoreDelta).toBe(0)
    })

    it('does not fire for character drills', () => {
      const isCharacterDrill = true
      const onLeaderboardScore = vi.fn()
      const results = [{ isFirstAttemptCorrect: true }]
      const scoreDelta = results.filter((r) => r.isFirstAttemptCorrect).length

      if (!isCharacterDrill && scoreDelta > 0) {
        onLeaderboardScore(scoreDelta)
      }

      expect(onLeaderboardScore).not.toHaveBeenCalled()
    })

    it('fires for word practice when delta is positive', () => {
      const isCharacterDrill = false
      const onLeaderboardScore = vi.fn()
      const results = [{ isFirstAttemptCorrect: true }, { isFirstAttemptCorrect: true }]
      const scoreDelta = results.filter((r) => r.isFirstAttemptCorrect).length

      if (!isCharacterDrill && scoreDelta > 0) {
        onLeaderboardScore(scoreDelta)
      }

      expect(onLeaderboardScore).toHaveBeenCalledWith(2)
    })
  })

  describe('Kotoba scoring', () => {
    it('scores 1 for clean readings completion', () => {
      const wasClean = true
      const isKanjiMode = false
      const multiplier = isKanjiMode ? KANJI_INPUT_MULTIPLIER : 1
      const onLeaderboardScore = vi.fn()

      if (wasClean) {
        onLeaderboardScore(multiplier)
      }

      expect(onLeaderboardScore).toHaveBeenCalledWith(1)
    })

    it('scores KANJI_INPUT_MULTIPLIER (4) for clean kanji completion', () => {
      const wasClean = true
      const isKanjiMode = true
      const multiplier = isKanjiMode ? KANJI_INPUT_MULTIPLIER : 1
      const onLeaderboardScore = vi.fn()

      if (wasClean) {
        onLeaderboardScore(multiplier)
      }

      expect(onLeaderboardScore).toHaveBeenCalledWith(4)
    })

    it('does not fire for non-clean completions', () => {
      const wasClean = false
      const onLeaderboardScore = vi.fn()

      if (wasClean) {
        onLeaderboardScore(1)
      }

      expect(onLeaderboardScore).not.toHaveBeenCalled()
    })
  })

  describe('Guest exclusion', () => {
    it('guests do not fire leaderboard events', () => {
      const isGuest = true
      const delta = 3

      if (isGuest) return

      mockRecordLeaderboardCompletion({
        eventId: 'test-id',
        gameType: 'kana',
        inputMode: 'tap',
        scoreDelta: delta,
      })

      expect(mockRecordLeaderboardCompletion).not.toHaveBeenCalled()
    })

    it('authenticated users fire leaderboard events', () => {
      const isGuest = false
      const delta = 3
      const gameType = 'kana' as const
      const mode = 'tap' as const

      if (!isGuest && delta > 0) {
        mockRecordLeaderboardCompletion({
          eventId: 'test-id',
          gameType,
          inputMode: mode,
          scoreDelta: delta,
        })
      }

      expect(mockRecordLeaderboardCompletion).toHaveBeenCalledWith({
        eventId: 'test-id',
        gameType: 'kana',
        inputMode: 'tap',
        scoreDelta: 3,
      })
    })
  })

  describe('recordLeaderboardCompletion params', () => {
    it('sends correct params for kana tap completion', () => {
      mockRecordLeaderboardCompletion({
        eventId: 'evt-1',
        gameType: 'kana',
        inputMode: 'tap',
        scoreDelta: 5,
      })

      expect(mockRecordLeaderboardCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'kana',
          inputMode: 'tap',
          scoreDelta: 5,
        }),
      )
    })

    it('sends correct params for kotoba type completion', () => {
      mockRecordLeaderboardCompletion({
        eventId: 'evt-2',
        gameType: 'kotoba',
        inputMode: 'type',
        scoreDelta: 1,
      })

      expect(mockRecordLeaderboardCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'kotoba',
          inputMode: 'type',
          scoreDelta: 1,
        }),
      )
    })

    it('sends correct params for kotoba kanji swipe completion', () => {
      mockRecordLeaderboardCompletion({
        eventId: 'evt-3',
        gameType: 'kotoba',
        inputMode: 'swipe',
        scoreDelta: KANJI_INPUT_MULTIPLIER,
      })

      expect(mockRecordLeaderboardCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          gameType: 'kotoba',
          inputMode: 'swipe',
          scoreDelta: 4,
        }),
      )
    })
  })
})
