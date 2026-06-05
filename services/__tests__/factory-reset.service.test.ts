// ─────────────────────────────────────────────
// File: services/__tests__/factory-reset.service.test.ts
// Purpose: Tests for the factory reset service. Validates RPC call,
//          response parsing, and error handling.
// Depends on: services/factory-reset.service.ts
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

describe('factory-reset.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns both new epoch values on success', async () => {
    mockRpc.mockResolvedValue({
      data: { new_mastery_epoch: 3, new_word_mastery_epoch: 5 },
      error: null,
    })

    const { factoryReset } = await import('../factory-reset.service')
    const result = await factoryReset()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.newMasteryEpoch).toBe(3)
      expect(result.data.newWordMasteryEpoch).toBe(5)
    }
    expect(mockRpc).toHaveBeenCalledWith('factory_reset')
  })

  it('returns error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous users cannot perform a factory reset' },
    })

    const { factoryReset } = await import('../factory-reset.service')
    const result = await factoryReset()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Failed to reset all progress.')
    }
  })

  it('returns error when response is null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    const { factoryReset } = await import('../factory-reset.service')
    const result = await factoryReset()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Invalid factory reset response.')
    }
  })

  it('returns error when response is missing new_mastery_epoch', async () => {
    mockRpc.mockResolvedValue({
      data: { new_word_mastery_epoch: 2 },
      error: null,
    })

    const { factoryReset } = await import('../factory-reset.service')
    const result = await factoryReset()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Invalid factory reset response.')
    }
  })

  it('returns error when response is missing new_word_mastery_epoch', async () => {
    mockRpc.mockResolvedValue({
      data: { new_mastery_epoch: 2 },
      error: null,
    })

    const { factoryReset } = await import('../factory-reset.service')
    const result = await factoryReset()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Invalid factory reset response.')
    }
  })
})
