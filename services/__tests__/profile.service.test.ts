// ------------------------------------------------------------
// File: services/__tests__/profile.service.test.ts
// Purpose: Tests for the profile service. Validates loadProfile
//          mapping from snake_case rows to camelCase types, and
//          updateProfile Supabase calls.
// Depends on: services/profile.service.ts
// ------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────

const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) }))
const mockUpdateEq = vi.fn()
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') {
    return { select: mockSelect, update: mockUpdate }
  }
  return {}
})

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// ── Tests ─────────────────────────────────────

describe('profile.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadProfile', () => {
    it('maps snake_case row to camelCase UserProfile', async () => {
      const row = {
        id: 'user-1',
        username: 'tester',
        jlpt_level: 'N4',
        input_mode: 'type',
        onboarding_complete: true,
        notifications_enabled: false,
        mnemonics_enabled: true,
        distance_unit: 'metric',
        username_changed_at: null,
        created_at: '2026-04-01T00:00:00Z',
      }
      mockSingle.mockResolvedValue({ data: row, error: null })

      const { loadProfile } = await import('../profile.service')
      const result = await loadProfile('user-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.jlptLevel).toBe('N4')
        expect(result.data.inputMode).toBe('type')
        expect(result.data.onboardingComplete).toBe(true)
        expect(result.data.username).toBe('tester')
        expect(result.data.distanceUnit).toBe('metric')
        expect(result.data.usernameChangedAt).toBeNull()
      }
    })

    it('returns error on Supabase failure', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

      const { loadProfile } = await import('../profile.service')
      const result = await loadProfile('user-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe('Failed to load profile.')
      }
    })
  })

  describe('updateProfile', () => {
    it('calls Supabase update with provided fields', async () => {
      mockUpdateEq.mockResolvedValue({ error: null })

      const { updateProfile } = await import('../profile.service')
      const result = await updateProfile('user-1', { onboarding_complete: true })

      expect(result.ok).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_complete: true })
    })

    it('returns error on Supabase failure', async () => {
      mockUpdateEq.mockResolvedValue({ error: { message: 'rls' } })

      const { updateProfile } = await import('../profile.service')
      const result = await updateProfile('user-1', { username: 'new' })

      expect(result.ok).toBe(false)
    })
  })
})
