// ─────────────────────────────────────────────
// File: services/__tests__/guest-import.service.test.ts
// Purpose: Tests for guest-import.service.ts. Validates RPC
//          call construction, response parsing for all error
//          classifications, and transport failure handling.
// Depends on: services/guest-import.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}))

// ── Helpers ───────────────────────────────────

const EMPTY_PAYLOAD = {
  mastery: [],
  word_mastery: [],
  manual_unlocks: [],
  word_manual_unlocks: [],
}

const SAMPLE_PAYLOAD = {
  mastery: [{ character_id: 'h-a', score: 10, learning_score: 5 }],
  word_mastery: [{ word_id: 'w-123', score: 3 }],
  manual_unlocks: ['h-ka'],
  word_manual_unlocks: ['w-456'],
}

// ── Tests ─────────────────────────────────────

describe('guest-import.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('importGuestProgress', () => {
    it('calls import_guest_progress RPC with payload', async () => {
      mockRpc.mockResolvedValue({
        data: {
          status: 'success',
          imported_mastery_count: 1,
          imported_word_mastery_count: 1,
          imported_unlock_count: 2,
          dropped_count: 0,
          clamped_count: 0,
        },
        error: null,
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(mockRpc).toHaveBeenCalledWith('import_guest_progress', {
        p_payload: SAMPLE_PAYLOAD,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.report.importedMasteryCount).toBe(1)
        expect(result.report.importedWordMasteryCount).toBe(1)
        expect(result.report.importedUnlockCount).toBe(2)
        expect(result.report.droppedCount).toBe(0)
        expect(result.report.clampedCount).toBe(0)
      }
    })

    it('handles success with empty payload', async () => {
      mockRpc.mockResolvedValue({
        data: {
          status: 'success',
          imported_mastery_count: 0,
          imported_word_mastery_count: 0,
          imported_unlock_count: 0,
          dropped_count: 0,
          clamped_count: 0,
        },
        error: null,
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(EMPTY_PAYLOAD)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.report.importedMasteryCount).toBe(0)
      }
    })

    it('returns rejected_duplicate when already imported', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'rejected_duplicate', message: 'Guest progress already imported' },
        error: null,
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('rejected_duplicate')
      }
    })

    it('returns rejected_abuse when too many invalid IDs', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'rejected_abuse', message: 'Too many invalid IDs' },
        error: null,
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('rejected_abuse')
      }
    })

    it('returns rejected_malformed for bad payload shape', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'rejected_malformed', message: 'Payload must be a JSON object' },
        error: null,
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('rejected_malformed')
      }
    })

    it('returns error status on transport failure (RPC error)', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'network error' },
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('error')
        expect(result.message).toBe('Failed to import guest progress.')
      }
    })

    it('returns error on null response data', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('error')
      }
    })

    it('returns error on malformed response (no status field)', async () => {
      mockRpc.mockResolvedValue({ data: { bad: 'shape' }, error: null })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('error')
      }
    })

    it('handles partial import with dropped and clamped counts', async () => {
      mockRpc.mockResolvedValue({
        data: {
          status: 'success',
          imported_mastery_count: 5,
          imported_word_mastery_count: 3,
          imported_unlock_count: 2,
          dropped_count: 4,
          clamped_count: 2,
        },
        error: null,
      })

      const { importGuestProgress } = await import('../guest-import.service')
      const result = await importGuestProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.report.droppedCount).toBe(4)
        expect(result.report.clampedCount).toBe(2)
      }
    })
  })

  describe('importLegacyProgress', () => {
    it('calls import_legacy_progress RPC with payload', async () => {
      mockRpc.mockResolvedValue({
        data: {
          status: 'success',
          imported_mastery_count: 10,
          imported_word_mastery_count: 5,
          imported_unlock_count: 3,
          dropped_count: 1,
          clamped_count: 0,
        },
        error: null,
      })

      const { importLegacyProgress } = await import('../guest-import.service')
      const result = await importLegacyProgress(SAMPLE_PAYLOAD)

      expect(mockRpc).toHaveBeenCalledWith('import_legacy_progress', {
        p_payload: SAMPLE_PAYLOAD,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.report.importedMasteryCount).toBe(10)
        expect(result.report.importedWordMasteryCount).toBe(5)
        expect(result.report.importedUnlockCount).toBe(3)
        expect(result.report.droppedCount).toBe(1)
      }
    })

    it('returns rejected_duplicate when already imported', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'rejected_duplicate', message: 'Legacy progress already imported' },
        error: null,
      })

      const { importLegacyProgress } = await import('../guest-import.service')
      const result = await importLegacyProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('rejected_duplicate')
      }
    })

    it('returns error on transport failure', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'timeout' },
      })

      const { importLegacyProgress } = await import('../guest-import.service')
      const result = await importLegacyProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('error')
        expect(result.message).toBe('Failed to import legacy progress.')
      }
    })

    it('returns rejected_abuse on >50% invalid IDs', async () => {
      mockRpc.mockResolvedValue({
        data: { status: 'rejected_abuse', message: 'Too many invalid IDs' },
        error: null,
      })

      const { importLegacyProgress } = await import('../guest-import.service')
      const result = await importLegacyProgress(SAMPLE_PAYLOAD)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.status).toBe('rejected_abuse')
      }
    })
  })
})
