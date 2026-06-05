// ─────────────────────────────────────────────
// File: services/__tests__/streak.service.test.ts
// Purpose: Tests for the streak service. Validates query
//          construction, response parsing, and error handling.
// Depends on: services/streak.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockOrder = vi.fn()
const mockGte = vi.fn(() => ({ order: mockOrder }))
const mockEq = vi.fn(() => ({ gte: mockGte }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('streak.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries practice_sessions with correct filters', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { local_date: '2026-06-04', characters_practiced: 12 },
        { local_date: '2026-06-05', characters_practiced: 8 },
      ],
      error: null,
    })

    const { loadPracticeSummary } = await import('../streak.service')
    await loadPracticeSummary('user-123', '2026-03-07')

    expect(mockFrom).toHaveBeenCalledWith('practice_sessions')
    expect(mockSelect).toHaveBeenCalledWith('local_date, characters_practiced')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockGte).toHaveBeenCalledWith('local_date', '2026-03-07')
    expect(mockOrder).toHaveBeenCalledWith('local_date', { ascending: true })
  })

  it('returns date + count pairs on success', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { local_date: '2026-06-04', characters_practiced: 12 },
        { local_date: '2026-06-05', characters_practiced: 8 },
      ],
      error: null,
    })

    const { loadPracticeSummary } = await import('../streak.service')
    const result = await loadPracticeSummary('user-123', '2026-03-07')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual([
        { date: '2026-06-04', count: 12 },
        { date: '2026-06-05', count: 8 },
      ])
    }
  })

  it('returns empty array when no rows', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const { loadPracticeSummary } = await import('../streak.service')
    const result = await loadPracticeSummary('user-123', '2026-03-07')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual([])
    }
  })

  it('returns error when query fails', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'RLS violation' },
    })

    const { loadPracticeSummary } = await import('../streak.service')
    const result = await loadPracticeSummary('user-123', '2026-03-07')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('RLS violation')
    }
  })

  it('returns error on unexpected exception', async () => {
    mockOrder.mockRejectedValue(new Error('Network error'))

    const { loadPracticeSummary } = await import('../streak.service')
    const result = await loadPracticeSummary('user-123', '2026-03-07')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Failed to load practice summary')
    }
  })
})
