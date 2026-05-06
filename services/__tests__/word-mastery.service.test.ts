// ─────────────────────────────────────────────
// File: services/__tests__/word-mastery.service.test.ts
// Purpose: Tests for the word mastery service. Validates load
//          (snapshot with epoch), checkpoint sync via RPCs,
//          word manual unlock checkpoint, and legacy direct writes.
// Depends on: services/word-mastery.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockSingle = vi.fn()
const mockSelectEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }))
const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}))
const mockRpc = vi.fn()

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('word-mastery.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Snapshot load (new) ───────────────────────

  describe('loadWordMasterySnapshot', () => {
    it('returns scores and epoch from Supabase', async () => {
      mockSelectEq.mockResolvedValueOnce({
        data: [
          { word_id: 'w1', score: 5 },
          { word_id: 'w2', score: 12 },
        ],
        error: null,
      })
      mockSingle.mockResolvedValueOnce({
        data: { word_mastery_reset_epoch: 3 },
        error: null,
      })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({ w1: 5, w2: 12 })
        expect(result.data.epoch).toBe(3)
      }
    })

    it('returns empty map and epoch 0 for new user', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: [], error: null })
      mockSingle.mockResolvedValueOnce({
        data: { word_mastery_reset_epoch: 0 },
        error: null,
      })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({})
        expect(result.data.epoch).toBe(0)
      }
    })

    it('returns error on word mastery query failure', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })
      mockSingle.mockResolvedValueOnce({
        data: { word_mastery_reset_epoch: 0 },
        error: null,
      })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot('user-1')

      expect(result.ok).toBe(false)
    })

    it('returns error on epoch query failure', async () => {
      mockSelectEq.mockResolvedValueOnce({ data: [], error: null })
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot('user-1')

      expect(result.ok).toBe(false)
    })
  })

  // ── Checkpoint sync (new) ─────────────────────

  describe('checkpointWordMastery', () => {
    it('calls checkpoint_word_mastery RPC with epoch and rows', async () => {
      mockRpc.mockResolvedValue({
        data: {
          applied_count: 2,
          dropped_invalid_ids: [],
          skipped_stale_count: 0,
          current_epoch: 1,
        },
        error: null,
      })

      const { checkpointWordMastery } = await import('../word-mastery.service')
      const result = await checkpointWordMastery(
        [
          { word_id: 'w1', score: 5 },
          { word_id: 'w2', score: 12 },
        ],
        1,
      )

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.appliedCount).toBe(2)
        expect(result.data.currentEpoch).toBe(1)
      }
      expect(mockRpc).toHaveBeenCalledWith('checkpoint_word_mastery', {
        p_epoch: 1,
        p_rows: expect.arrayContaining([expect.objectContaining({ word_id: 'w1', score: 5 })]),
      })
    })

    it('returns ok for empty rows', async () => {
      const { checkpointWordMastery } = await import('../word-mastery.service')
      const result = await checkpointWordMastery([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns stale result when epoch mismatches', async () => {
      mockRpc.mockResolvedValue({
        data: {
          applied_count: 0,
          dropped_invalid_ids: [],
          skipped_stale_count: 1,
          current_epoch: 5,
        },
        error: null,
      })

      const { checkpointWordMastery } = await import('../word-mastery.service')
      const result = await checkpointWordMastery([{ word_id: 'w1', score: 5 }], 2)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.skippedStaleCount).toBe(1)
        expect(result.data.currentEpoch).toBe(5)
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { checkpointWordMastery } = await import('../word-mastery.service')
      const result = await checkpointWordMastery([{ word_id: 'w1', score: 5 }], 0)

      expect(result.ok).toBe(false)
    })
  })

  describe('checkpointWordManualUnlocks', () => {
    it('calls checkpoint_word_manual_unlocks RPC', async () => {
      mockRpc.mockResolvedValue({
        data: {
          applied_count: 2,
          dropped_invalid_ids: [],
          skipped_stale_count: 0,
          current_epoch: 0,
        },
        error: null,
      })

      const { checkpointWordManualUnlocks } = await import('../word-mastery.service')
      const result = await checkpointWordManualUnlocks(['w1', 'w2'], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('checkpoint_word_manual_unlocks', {
        p_epoch: 0,
        p_ids: ['w1', 'w2'],
      })
    })

    it('returns ok for empty array', async () => {
      const { checkpointWordManualUnlocks } = await import('../word-mastery.service')
      const result = await checkpointWordManualUnlocks([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { checkpointWordManualUnlocks } = await import('../word-mastery.service')
      const result = await checkpointWordManualUnlocks(['w1'], 0)

      expect(result.ok).toBe(false)
    })
  })

  // ── Legacy direct-write functions ─────────────

  describe('loadWordMastery (legacy)', () => {
    it('returns a score map from Supabase rows', async () => {
      mockSelectEq.mockResolvedValue({
        data: [
          { word_id: 'w1', score: 5 },
          { word_id: 'w2', score: 12 },
        ],
        error: null,
      })

      const { loadWordMastery } = await import('../word-mastery.service')
      const result = await loadWordMastery('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual({ w1: 5, w2: 12 })
      }
    })

    it('returns error on failure', async () => {
      mockSelectEq.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadWordMastery } = await import('../word-mastery.service')
      const result = await loadWordMastery('user-1')

      expect(result.ok).toBe(false)
    })
  })

  describe('syncWordMastery (legacy)', () => {
    it('upserts rows for changed scores', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const { syncWordMastery } = await import('../word-mastery.service')
      const result = await syncWordMastery('user-1', { w1: 7, w2: 3 })

      expect(result.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          { user_id: 'user-1', word_id: 'w1', score: 7 },
          { user_id: 'user-1', word_id: 'w2', score: 3 },
        ]),
        { onConflict: 'user_id,word_id' },
      )
    })

    it('returns ok for empty delta', async () => {
      const { syncWordMastery } = await import('../word-mastery.service')
      const result = await syncWordMastery('user-1', {})

      expect(result.ok).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  describe('loadWordManualUnlocks', () => {
    it('returns word IDs from Supabase rows', async () => {
      mockSelectEq.mockResolvedValue({
        data: [{ word_id: 'w1' }, { word_id: 'w2' }],
        error: null,
      })

      const { loadWordManualUnlocks } = await import('../word-mastery.service')
      const result = await loadWordManualUnlocks('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(['w1', 'w2'])
      }
    })

    it('returns error on failure', async () => {
      mockSelectEq.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadWordManualUnlocks } = await import('../word-mastery.service')
      const result = await loadWordManualUnlocks('user-1')

      expect(result.ok).toBe(false)
    })
  })

  describe('syncWordManualUnlocks (legacy)', () => {
    it('upserts rows for each word ID', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const { syncWordManualUnlocks } = await import('../word-mastery.service')
      const result = await syncWordManualUnlocks('user-1', ['w1', 'w2'])

      expect(result.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          { user_id: 'user-1', word_id: 'w1' },
          { user_id: 'user-1', word_id: 'w2' },
        ],
        { onConflict: 'user_id,word_id' },
      )
    })

    it('returns ok for empty array', async () => {
      const { syncWordManualUnlocks } = await import('../word-mastery.service')
      const result = await syncWordManualUnlocks('user-1', [])

      expect(result.ok).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })
})
