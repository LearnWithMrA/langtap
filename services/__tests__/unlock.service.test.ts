// ------------------------------------------------------------
// File: services/__tests__/unlock.service.test.ts
// Purpose: Tests for the unlock service. Validates loadManualUnlocks,
//          syncManualUnlocks, and addManualUnlock.
// Depends on: services/unlock.service.ts
// ------------------------------------------------------------

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

describe('unlock.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadManualUnlocks', () => {
    it('returns character IDs from Supabase rows', async () => {
      mockSelectEq.mockResolvedValue({
        data: [{ character_id: 'hi-a' }, { character_id: 'hi-ka' }],
        error: null,
      })

      const { loadManualUnlocks } = await import('../unlock.service')
      const result = await loadManualUnlocks('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(['hi-a', 'hi-ka'])
      }
    })

    it('returns error on failure', async () => {
      mockSelectEq.mockResolvedValue({ data: null, error: { message: 'fail' } })

      const { loadManualUnlocks } = await import('../unlock.service')
      const result = await loadManualUnlocks('user-1')

      expect(result.ok).toBe(false)
    })
  })

  describe('syncManualUnlocks', () => {
    it('upserts rows for each character ID', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const { syncManualUnlocks } = await import('../unlock.service')
      const result = await syncManualUnlocks('user-1', ['hi-a', 'hi-ka'])

      expect(result.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          { user_id: 'user-1', character_id: 'hi-a' },
          { user_id: 'user-1', character_id: 'hi-ka' },
        ],
        { onConflict: 'user_id,character_id' },
      )
    })

    it('returns ok immediately for empty array', async () => {
      const { syncManualUnlocks } = await import('../unlock.service')
      const result = await syncManualUnlocks('user-1', [])

      expect(result.ok).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('returns error on failure', async () => {
      mockUpsert.mockResolvedValue({ error: { message: 'rls' } })

      const { syncManualUnlocks } = await import('../unlock.service')
      const result = await syncManualUnlocks('user-1', ['hi-a'])

      expect(result.ok).toBe(false)
    })
  })

  describe('addManualUnlock', () => {
    it('delegates to syncManualUnlocks with single ID', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const { addManualUnlock } = await import('../unlock.service')
      const result = await addManualUnlock('user-1', 'hi-a')

      expect(result.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith([{ user_id: 'user-1', character_id: 'hi-a' }], {
        onConflict: 'user_id,character_id',
      })
    })
  })
})
