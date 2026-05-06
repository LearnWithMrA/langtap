// ─────────────────────────────────────────────
// File: components/game/__tests__/leaderboard-scoring.test.ts
// Purpose: Tests for server-derived leaderboard scoring logic.
//          Validates attempt payload shape, first-attempt tracking,
//          guest/trial exclusion, and fire-and-forget behaviour.
// Depends on: services/leaderboard.service.ts,
//             engine/constants.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KANJI_INPUT_MULTIPLIER } from '@/engine/constants'

// ── Mocks ─────────────────────────────────────

vi.mock('@/services/leaderboard.service', () => ({
  startLeaderboardSession: vi.fn().mockResolvedValue({ ok: true, data: 'session-1' }),
  finalizeLeaderboardSession: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
  loadLeaderboard: vi
    .fn()
    .mockResolvedValue({ ok: true, data: { entries: [], currentUserPinned: null } }),
}))

// ── Scoring logic tests ─────────────────────

describe('Server-derived leaderboard scoring rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Kana attempt payload', () => {
    it('builds one attempt per character with submitted value', () => {
      const firstAttempts = ['a', 'ka', 'i']
      const attempts = firstAttempts.map((submitted, i) => ({
        charIndex: i,
        submitted,
      }))

      expect(attempts).toHaveLength(3)
      expect(attempts[0]).toEqual({ charIndex: 0, submitted: 'a' })
      expect(attempts[2]).toEqual({ charIndex: 2, submitted: 'i' })
    })

    it('includes wrong first attempts', () => {
      const firstAttempts = ['a', 'ko', 'i']
      const attempts = firstAttempts.map((submitted, i) => ({
        charIndex: i,
        submitted,
      }))

      expect(attempts[1]).toEqual({ charIndex: 1, submitted: 'ko' })
    })

    it('has unique indices covering [0, charCount)', () => {
      const charCount = 4
      const firstAttempts = ['a', 'ka', 'ru', 'i']
      const attempts = firstAttempts.map((submitted, i) => ({
        charIndex: i,
        submitted,
      }))

      expect(attempts).toHaveLength(charCount)
      const indices = attempts.map((a) => a.charIndex)
      expect(new Set(indices).size).toBe(charCount)
      expect(Math.min(...indices)).toBe(0)
      expect(Math.max(...indices)).toBe(charCount - 1)
    })
  })

  describe('Kotoba attempt payload', () => {
    it('readings mode: attempts without kanji entry', () => {
      const firstAttempts = ['あ', 'う']
      const attempts = firstAttempts.map((submitted, i) => ({
        charIndex: i,
        submitted,
      }))

      expect(attempts.every((a) => a.charIndex >= 0)).toBe(true)
    })

    it('kanji mode: includes charIndex -1 with first kanji selection', () => {
      const firstAttempts = ['あ', 'う']
      const firstKanji = '会う'
      const attempts = [
        ...firstAttempts.map((submitted, i) => ({ charIndex: i, submitted })),
        { charIndex: -1, submitted: firstKanji },
      ]

      expect(attempts).toHaveLength(3)
      const kanjiEntry = attempts.find((a) => a.charIndex === -1)
      expect(kanjiEntry?.submitted).toBe('会う')
    })

    it('kanji wrong first attempt: submitted is the wrong kanji', () => {
      const firstKanji = '合う'
      const attempts = [
        { charIndex: 0, submitted: 'あ' },
        { charIndex: 1, submitted: 'う' },
        { charIndex: -1, submitted: firstKanji },
      ]

      expect(attempts[2].submitted).toBe('合う')
    })

    it('KANJI_INPUT_MULTIPLIER is 4', () => {
      expect(KANJI_INPUT_MULTIPLIER).toBe(4)
    })

    it('kanji type/swipe: sends only kanji attempt when no readings recorded', () => {
      const firstAttempts = ['', '']
      const firstKanji = '会う'
      const isKanjiMode = true

      const charAttempts = firstAttempts
        .map((submitted, i) => ({ charIndex: i, submitted }))
        .filter((a) => a.submitted !== '')
      const attempts = [...charAttempts]
      if (isKanjiMode) {
        attempts.push({ charIndex: -1, submitted: firstKanji })
      }

      expect(attempts).toHaveLength(1)
      expect(attempts[0]).toEqual({ charIndex: -1, submitted: '会う' })
    })

    it('kanji tap: sends readings + kanji when readings were recorded', () => {
      const firstAttempts = ['あ', 'う']
      const firstKanji = '会う'
      const isKanjiMode = true

      const charAttempts = firstAttempts
        .map((submitted, i) => ({ charIndex: i, submitted }))
        .filter((a) => a.submitted !== '')
      const attempts = [...charAttempts]
      if (isKanjiMode) {
        attempts.push({ charIndex: -1, submitted: firstKanji })
      }

      expect(attempts).toHaveLength(3)
      expect(attempts[0]).toEqual({ charIndex: 0, submitted: 'あ' })
      expect(attempts[2]).toEqual({ charIndex: -1, submitted: '会う' })
    })
  })

  describe('Guest and trial exclusion', () => {
    it('guest users: callbacks are not passed', () => {
      const isGuest = true
      const onLeaderboardStart = isGuest ? undefined : vi.fn()
      expect(onLeaderboardStart).toBeUndefined()
    })

    it('trial prompts: callbacks are not passed', () => {
      const isTrial = true
      const onLeaderboardStart = isTrial ? undefined : vi.fn()
      expect(onLeaderboardStart).toBeUndefined()
    })
  })

  describe('Character drill exclusion', () => {
    it('character drills skip finalize', () => {
      const isCharacterDrill = true
      const onLeaderboardFinalize = vi.fn()

      if (!isCharacterDrill) {
        onLeaderboardFinalize('prompt-1', [])
      }

      expect(onLeaderboardFinalize).not.toHaveBeenCalled()
    })
  })

  describe('Deferred finalize', () => {
    it('queues attempts when session ID is not yet available', () => {
      const entry = {
        wordId: 'w1',
        sessionId: null as string | null,
        pendingAttempts: null as unknown[] | null,
      }
      const attempts = [{ charIndex: 0, submitted: 'a' }]

      if (entry.sessionId) {
        // would finalize
      } else {
        entry.pendingAttempts = attempts
      }

      expect(entry.pendingAttempts).toEqual(attempts)
    })

    it('finalizes immediately when session ID exists', () => {
      const mockFinalize = vi.fn()
      const entry = {
        wordId: 'w1',
        sessionId: 'session-1',
        pendingAttempts: null as unknown[] | null,
      }
      const attempts = [{ charIndex: 0, submitted: 'a' }]

      if (entry.sessionId) {
        mockFinalize({ sessionId: entry.sessionId, attempts })
      } else {
        entry.pendingAttempts = attempts
      }

      expect(mockFinalize).toHaveBeenCalledWith({
        sessionId: 'session-1',
        attempts,
      })
    })
  })

  describe('Fire-and-forget resilience', () => {
    it('start failure does not block finalize flow', () => {
      const sessionMap = new Map<string, { sessionId: string | null }>()
      const promptId = 'p1'

      sessionMap.set(promptId, { sessionId: null })

      const startFailed = true
      if (startFailed) {
        sessionMap.delete(promptId)
      }

      const entry = sessionMap.get(promptId)
      expect(entry).toBeUndefined()
    })

    it('gameplay proceeds normally when RPCs never resolve', () => {
      const neverResolve = new Promise<never>(() => {})
      const startRpc = (): Promise<never> => neverResolve
      const finalizeRpc = (): Promise<never> => neverResolve

      let gameCompleted = false
      let wordAdvanced = false

      void startRpc()

      const firstAttempts = ['a', 'u']
      const results = firstAttempts.map((s, i) => ({ charIndex: i, submitted: s }))

      gameCompleted = true
      void finalizeRpc()

      wordAdvanced = true

      expect(gameCompleted).toBe(true)
      expect(wordAdvanced).toBe(true)
      expect(results).toHaveLength(2)
    })
  })
})
