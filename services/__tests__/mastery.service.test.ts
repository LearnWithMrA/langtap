// ─────────────────────────────────────────────
// File: services/__tests__/mastery.service.test.ts
// Purpose: Tests for the kana mastery service. Validates atomic
//          snapshot load via RPC, checkpoint sync with response
//          validation, payload cap enforcement, and unlock sync.
// Depends on: services/mastery.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('mastery.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadMasterySnapshot', () => {
    it('returns scores, learningScores, unlockIds, and epoch from RPC', async () => {
      mockRpc.mockResolvedValue({
        data: {
          epoch: 2,
          scores: [
            { character_id: 'h-a', score: 10, learning_score: 5 },
            { character_id: 'h-i', score: 3, learning_score: 2 },
          ],
          unlocks: ['h-ka', 'h-sa'],
        },
        error: null,
      })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({ 'h-a': 10, 'h-i': 3 })
        expect(result.data.learningScores).toEqual({ 'h-a': 5, 'h-i': 2 })
        expect(result.data.unlockIds).toEqual(['h-ka', 'h-sa'])
        expect(result.data.epoch).toBe(2)
      }
      expect(mockRpc).toHaveBeenCalledWith('load_mastery_snapshot')
    })

    it('returns empty maps for user with no data', async () => {
      mockRpc.mockResolvedValue({
        data: { epoch: 0, scores: [], unlocks: [] },
        error: null,
      })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({})
        expect(result.data.learningScores).toEqual({})
        expect(result.data.unlockIds).toEqual([])
        expect(result.data.epoch).toBe(0)
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot()

      expect(result.ok).toBe(false)
    })

    it('returns error on malformed response (missing epoch)', async () => {
      mockRpc.mockResolvedValue({
        data: { scores: [], unlocks: [] },
        error: null,
      })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot()

      expect(result.ok).toBe(false)
    })

    it('returns error on null data', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot()

      expect(result.ok).toBe(false)
    })
  })

  describe('checkpointMastery', () => {
    it('calls checkpoint_mastery RPC with epoch and rows', async () => {
      mockRpc.mockResolvedValue({
        data: {
          applied_count: 2,
          dropped_invalid_ids: [],
          skipped_stale_count: 0,
          current_epoch: 1,
        },
        error: null,
      })

      const { checkpointMastery } = await import('../mastery.service')
      const result = await checkpointMastery(
        [
          { character_id: 'h-a', score: 10, learning_score: 5 },
          { character_id: 'h-i', score: 3, learning_score: 2 },
        ],
        1,
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.appliedCount).toBe(2)
        expect(result.data.skippedStaleCount).toBe(0)
        expect(result.data.currentEpoch).toBe(1)
      }
    })

    it('returns ok with zero counts for empty rows', async () => {
      const { checkpointMastery } = await import('../mastery.service')
      const result = await checkpointMastery([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('rejects payload exceeding 200 rows', async () => {
      const { checkpointMastery } = await import('../mastery.service')
      const bigPayload = Array.from({ length: 201 }, (_, i) => ({
        character_id: `h-${i}`,
        score: 1,
        learning_score: 1,
      }))
      const result = await checkpointMastery(bigPayload, 0)

      expect(result.ok).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns stale result when epoch mismatches', async () => {
      mockRpc.mockResolvedValue({
        data: {
          applied_count: 0,
          dropped_invalid_ids: [],
          skipped_stale_count: 2,
          current_epoch: 3,
        },
        error: null,
      })

      const { checkpointMastery } = await import('../mastery.service')
      const result = await checkpointMastery(
        [{ character_id: 'h-a', score: 10, learning_score: 5 }],
        1,
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.skippedStaleCount).toBeGreaterThan(0)
        expect(result.data.currentEpoch).toBe(3)
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } })

      const { checkpointMastery } = await import('../mastery.service')
      const result = await checkpointMastery(
        [{ character_id: 'h-a', score: 5, learning_score: 3 }],
        0,
      )

      expect(result.ok).toBe(false)
    })

    it('returns error on malformed checkpoint response', async () => {
      mockRpc.mockResolvedValue({ data: { bad: 'shape' }, error: null })

      const { checkpointMastery } = await import('../mastery.service')
      const result = await checkpointMastery(
        [{ character_id: 'h-a', score: 5, learning_score: 3 }],
        0,
      )

      expect(result.ok).toBe(false)
    })
  })

  describe('checkpointKanaUnlocks', () => {
    it('calls checkpoint_manual_unlocks RPC', async () => {
      mockRpc.mockResolvedValue({
        data: {
          applied_count: 2,
          dropped_invalid_ids: [],
          skipped_stale_count: 0,
          current_epoch: 0,
        },
        error: null,
      })

      const { checkpointKanaUnlocks } = await import('../mastery.service')
      const result = await checkpointKanaUnlocks(['h-a', 'h-i'], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('checkpoint_manual_unlocks', {
        p_epoch: 0,
        p_ids: ['h-a', 'h-i'],
      })
    })

    it('returns ok for empty array', async () => {
      const { checkpointKanaUnlocks } = await import('../mastery.service')
      const result = await checkpointKanaUnlocks([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('rejects payload exceeding 200 IDs', async () => {
      const { checkpointKanaUnlocks } = await import('../mastery.service')
      const bigPayload = Array.from({ length: 201 }, (_, i) => `h-${i}`)
      const result = await checkpointKanaUnlocks(bigPayload, 0)

      expect(result.ok).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { checkpointKanaUnlocks } = await import('../mastery.service')
      const result = await checkpointKanaUnlocks(['h-a'], 0)

      expect(result.ok).toBe(false)
    })
  })
})
