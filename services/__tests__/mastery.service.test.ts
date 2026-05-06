// ─────────────────────────────────────────────
// File: services/__tests__/mastery.service.test.ts
// Purpose: Tests for the kana mastery service. Validates load
//          (snapshot with epoch), checkpoint sync via RPCs,
//          and manual unlock sync.
// Depends on: services/mastery.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockSingle = vi.fn()
const mockSelectEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockRpc = vi.fn()

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('mastery.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadMasterySnapshot', () => {
    it('returns scores, learningScores, and epoch from Supabase', async () => {
      mockSelectEq.mockResolvedValueOnce({
        data: [
          { character_id: 'h-a', score: 10, learning_score: 5 },
          { character_id: 'h-i', score: 3, learning_score: 2 },
        ],
        error: null,
      })
      mockSingle.mockResolvedValueOnce({
        data: { mastery_reset_epoch: 2 },
        error: null,
      })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({ 'h-a': 10, 'h-i': 3 })
        expect(result.data.learningScores).toEqual({ 'h-a': 5, 'h-i': 2 })
        expect(result.data.epoch).toBe(2)
      }
    })

    it('returns empty maps for user with no mastery rows', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: [], error: null })
      mockSingle.mockResolvedValueOnce({
        data: { mastery_reset_epoch: 0 },
        error: null,
      })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({})
        expect(result.data.learningScores).toEqual({})
        expect(result.data.epoch).toBe(0)
      }
    })

    it('returns error on mastery query failure', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
      mockSingle.mockResolvedValueOnce({
        data: { mastery_reset_epoch: 0 },
        error: null,
      })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot('user-1')

      expect(result.ok).toBe(false)
    })

    it('returns error on profile epoch query failure', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: [], error: null })
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })

      const { loadMasterySnapshot } = await import('../mastery.service')
      const result = await loadMasterySnapshot('user-1')

      expect(result.ok).toBe(false)
    })
  })

  describe('syncMastery', () => {
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

      const { syncMastery } = await import('../mastery.service')
      const result = await syncMastery(
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
      expect(mockRpc).toHaveBeenCalledWith('checkpoint_mastery', {
        p_epoch: 1,
        p_rows: expect.arrayContaining([
          expect.objectContaining({ character_id: 'h-a', score: 10, learning_score: 5 }),
        ]),
      })
    })

    it('returns ok with zero counts for empty rows', async () => {
      const { syncMastery } = await import('../mastery.service')
      const result = await syncMastery([], 0)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.appliedCount).toBe(0)
      }
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

      const { syncMastery } = await import('../mastery.service')
      const result = await syncMastery([{ character_id: 'h-a', score: 10, learning_score: 5 }], 1)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.skippedStaleCount).toBeGreaterThan(0)
        expect(result.data.currentEpoch).toBe(3)
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } })

      const { syncMastery } = await import('../mastery.service')
      const result = await syncMastery([{ character_id: 'h-a', score: 5, learning_score: 3 }], 0)

      expect(result.ok).toBe(false)
    })
  })

  describe('syncManualUnlocks', () => {
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

      const { syncManualUnlocks } = await import('../mastery.service')
      const result = await syncManualUnlocks(['h-a', 'h-i'], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('checkpoint_manual_unlocks', {
        p_epoch: 0,
        p_ids: ['h-a', 'h-i'],
      })
    })

    it('returns ok for empty array', async () => {
      const { syncManualUnlocks } = await import('../mastery.service')
      const result = await syncManualUnlocks([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { syncManualUnlocks } = await import('../mastery.service')
      const result = await syncManualUnlocks(['h-a'], 0)

      expect(result.ok).toBe(false)
    })
  })

  describe('loadManualUnlocks', () => {
    it('returns character IDs from Supabase rows', async () => {
      mockSelectEq.mockResolvedValueOnce({
        data: [{ character_id: 'h-a' }, { character_id: 'h-ka' }],
        error: null,
      })

      const { loadManualUnlocks } = await import('../mastery.service')
      const result = await loadManualUnlocks('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(['h-a', 'h-ka'])
      }
    })

    it('returns empty array when no unlocks exist', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: [], error: null })

      const { loadManualUnlocks } = await import('../mastery.service')
      const result = await loadManualUnlocks('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual([])
      }
    })

    it('returns error on failure', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })

      const { loadManualUnlocks } = await import('../mastery.service')
      const result = await loadManualUnlocks('user-1')

      expect(result.ok).toBe(false)
    })
  })
})
