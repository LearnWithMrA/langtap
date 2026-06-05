// ─────────────────────────────────────────────
// File: services/__tests__/practice-session.service.test.ts
// Purpose: Tests for the practice session recording service.
//          Validates RPC call, response parsing, idempotency,
//          and error handling.
// Depends on: services/practice-session.service.ts
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

describe('practice-session.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls RPC with correct parameters', async () => {
    mockRpc.mockResolvedValue({
      data: { local_date: '2026-06-05', characters_practiced: 10, inserted: true },
      error: null,
    })

    const { recordPracticeActivity } = await import('../practice-session.service')
    await recordPracticeActivity('abc-123', 5)

    expect(mockRpc).toHaveBeenCalledWith('record_practice_activity', {
      p_completion_id: 'abc-123',
      p_characters_count: 5,
    })
  })

  it('returns parsed result on success', async () => {
    mockRpc.mockResolvedValue({
      data: { local_date: '2026-06-05', characters_practiced: 15, inserted: true },
      error: null,
    })

    const { recordPracticeActivity } = await import('../practice-session.service')
    const result = await recordPracticeActivity('abc-123', 5)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.localDate).toBe('2026-06-05')
      expect(result.data.charactersPracticed).toBe(15)
      expect(result.data.inserted).toBe(true)
    }
  })

  it('returns inserted=false for duplicate completion_id', async () => {
    mockRpc.mockResolvedValue({
      data: { local_date: '2026-06-05', characters_practiced: 15, inserted: false },
      error: null,
    })

    const { recordPracticeActivity } = await import('../practice-session.service')
    const result = await recordPracticeActivity('abc-123', 5)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.inserted).toBe(false)
    }
  })

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous users cannot record practice' },
    })

    const { recordPracticeActivity } = await import('../practice-session.service')
    const result = await recordPracticeActivity('abc-123', 5)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Anonymous users cannot record practice')
    }
  })

  it('returns error on unexpected exception', async () => {
    mockRpc.mockRejectedValue(new Error('Network error'))

    const { recordPracticeActivity } = await import('../practice-session.service')
    const result = await recordPracticeActivity('abc-123', 5)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Failed to record practice activity')
    }
  })
})
