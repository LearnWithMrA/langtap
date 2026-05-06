// ─────────────────────────────────────────────
// File: services/__tests__/word-mastery.service.test.ts
// Purpose: Tests for the word mastery service. Validates atomic
//          snapshot load via RPC, checkpoint sync, unlock sync,
//          response validation, payload cap, and legacy functions.
// Depends on: services/word-mastery.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockSelectEq = vi.fn()
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

  // ── Atomic snapshot load ──────────────────────

  describe('loadWordMasterySnapshot', () => {
    it('returns scores, unlockIds, and epoch from RPC', async () => {
      mockRpc.mockResolvedValue({
        data: {
          epoch: 3,
          scores: [
            { word_id: 'w1', score: 5 },
            { word_id: 'w2', score: 12 },
          ],
          unlocks: ['w3', 'w4'],
        },
        error: null,
      })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({ w1: 5, w2: 12 })
        expect(result.data.unlockIds).toEqual(['w3', 'w4'])
        expect(result.data.epoch).toBe(3)
      }
    })

    it('returns empty data for new user', async () => {
      mockRpc.mockResolvedValue({
        data: { epoch: 0, scores: [], unlocks: [] },
        error: null,
      })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.scores).toEqual({})
        expect(result.data.unlockIds).toEqual([])
        expect(result.data.epoch).toBe(0)
      }
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot()

      expect(result.ok).toBe(false)
    })

    it('returns error on malformed response', async () => {
      mockRpc.mockResolvedValue({ data: { bad: 'shape' }, error: null })

      const { loadWordMasterySnapshot } = await import('../word-mastery.service')
      const result = await loadWordMasterySnapshot()

      expect(result.ok).toBe(false)
    })
  })

  // ── Checkpoint sync ───────────────────────────

  describe('checkpointWordMastery', () => {
    it('calls checkpoint_word_mastery RPC', async () => {
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
      }
    })

    it('returns ok for empty rows', async () => {
      const { checkpointWordMastery } = await import('../word-mastery.service')
      const result = await checkpointWordMastery([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('rejects payload exceeding 200 rows', async () => {
      const { checkpointWordMastery } = await import('../word-mastery.service')
      const big = Array.from({ length: 201 }, (_, i) => ({ word_id: `w${i}`, score: 1 }))
      const result = await checkpointWordMastery(big, 0)

      expect(result.ok).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns error on malformed response', async () => {
      mockRpc.mockResolvedValue({ data: 42, error: null })

      const { checkpointWordMastery } = await import('../word-mastery.service')
      const result = await checkpointWordMastery([{ word_id: 'w1', score: 5 }], 0)

      expect(result.ok).toBe(false)
    })
  })

  describe('checkpointWordUnlocks', () => {
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

      const { checkpointWordUnlocks } = await import('../word-mastery.service')
      const result = await checkpointWordUnlocks(['w1', 'w2'], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('checkpoint_word_manual_unlocks', {
        p_epoch: 0,
        p_ids: ['w1', 'w2'],
      })
    })

    it('returns ok for empty array', async () => {
      const { checkpointWordUnlocks } = await import('../word-mastery.service')
      const result = await checkpointWordUnlocks([], 0)

      expect(result.ok).toBe(true)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns error on RPC failure', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { checkpointWordUnlocks } = await import('../word-mastery.service')
      const result = await checkpointWordUnlocks(['w1'], 0)

      expect(result.ok).toBe(false)
    })
  })

  // ── Legacy functions ──────────────────────────

  describe('loadWordMastery (legacy)', () => {
    it('returns a score map from direct query', async () => {
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
    it('upserts rows', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const { syncWordMastery } = await import('../word-mastery.service')
      const result = await syncWordMastery('user-1', { w1: 7 })

      expect(result.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalled()
    })

    it('returns ok for empty delta', async () => {
      const { syncWordMastery } = await import('../word-mastery.service')
      const result = await syncWordMastery('user-1', {})

      expect(result.ok).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  describe('loadWordManualUnlocks (legacy)', () => {
    it('returns word IDs', async () => {
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
  })

  describe('syncWordManualUnlocks (legacy)', () => {
    it('upserts rows', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const { syncWordManualUnlocks } = await import('../word-mastery.service')
      const result = await syncWordManualUnlocks('user-1', ['w1'])

      expect(result.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalled()
    })
  })
})
