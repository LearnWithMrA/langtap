// ─────────────────────────────────────────────
// File: services/__tests__/word-mastery.service.test.ts
// Purpose: Tests for the word mastery service. Validates load and
//          sync for both word mastery scores and word manual unlocks.
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

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('word-mastery.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadWordMastery', () => {
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

    it('returns empty map when no rows exist', async () => {
      mockSelectEq.mockResolvedValue({ data: [], error: null })

      const { loadWordMastery } = await import('../word-mastery.service')
      const result = await loadWordMastery('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual({})
      }
    })

    it('returns error on failure', async () => {
      mockSelectEq.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadWordMastery } = await import('../word-mastery.service')
      const result = await loadWordMastery('user-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Failed to load word mastery.')
      }
    })
  })

  describe('syncWordMastery', () => {
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

    it('returns ok immediately for empty delta', async () => {
      const { syncWordMastery } = await import('../word-mastery.service')
      const result = await syncWordMastery('user-1', {})

      expect(result.ok).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('returns error on failure', async () => {
      mockUpsert.mockResolvedValue({ error: { message: 'rls' } })

      const { syncWordMastery } = await import('../word-mastery.service')
      const result = await syncWordMastery('user-1', { w1: 5 })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Failed to sync word mastery.')
      }
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

    it('returns empty array when no rows exist', async () => {
      mockSelectEq.mockResolvedValue({ data: [], error: null })

      const { loadWordManualUnlocks } = await import('../word-mastery.service')
      const result = await loadWordManualUnlocks('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual([])
      }
    })

    it('returns error on failure', async () => {
      mockSelectEq.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadWordManualUnlocks } = await import('../word-mastery.service')
      const result = await loadWordManualUnlocks('user-1')

      expect(result.ok).toBe(false)
    })
  })

  describe('syncWordManualUnlocks', () => {
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

    it('returns ok immediately for empty array', async () => {
      const { syncWordManualUnlocks } = await import('../word-mastery.service')
      const result = await syncWordManualUnlocks('user-1', [])

      expect(result.ok).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('returns error on failure', async () => {
      mockUpsert.mockResolvedValue({ error: { message: 'rls' } })

      const { syncWordManualUnlocks } = await import('../word-mastery.service')
      const result = await syncWordManualUnlocks('user-1', ['w1'])

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Failed to save word unlocks.')
      }
    })
  })
})
