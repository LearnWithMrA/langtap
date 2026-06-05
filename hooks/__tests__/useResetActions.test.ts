// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useResetActions.test.ts
// Purpose: Tests for the useResetActions hook. Validates that each
//          reset action calls the correct service, updates the correct
//          stores, and clears the correct localStorage keys. Also
//          verifies atomicity: no local state changes on RPC failure.
// Depends on: hooks/useResetActions.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Store mocks ──────────────────────────────

const mockMasteryResetAll = vi.fn()
const mockMasterySetEpoch = vi.fn()
const mockWordMasteryResetAll = vi.fn()
const mockWordMasterySetEpoch = vi.fn()
const mockCounterResetAll = vi.fn()
const mockUnlockRecompute = vi.fn()

vi.mock('@/stores/mastery.store', () => ({
  useMasteryStore: Object.assign(
    vi.fn(() => ({})),
    {
      getState: vi.fn(() => ({
        resetAll: mockMasteryResetAll,
        setEpoch: mockMasterySetEpoch,
      })),
    },
  ),
}))

vi.mock('@/stores/word-mastery.store', () => ({
  useWordMasteryStore: Object.assign(
    vi.fn(() => ({})),
    {
      getState: vi.fn(() => ({
        resetAll: mockWordMasteryResetAll,
        setEpoch: mockWordMasterySetEpoch,
      })),
    },
  ),
}))

vi.mock('@/stores/counter.store', () => ({
  useCounterStore: Object.assign(
    vi.fn(() => ({})),
    {
      getState: vi.fn(() => ({ resetAll: mockCounterResetAll })),
    },
  ),
}))

vi.mock('@/stores/unlock.store', () => ({
  useUnlockStore: Object.assign(
    vi.fn(() => ({})),
    {
      getState: vi.fn(() => ({ recompute: mockUnlockRecompute })),
    },
  ),
}))

// ── Service mocks ────────────────────────────

const mockResetAllMastery = vi.fn()
const mockResetAllWordMastery = vi.fn()
const mockFactoryReset = vi.fn()

vi.mock('@/services/reset.service', () => ({
  resetAllMastery: (...args: unknown[]): unknown => mockResetAllMastery(...args),
  resetAllWordMastery: (...args: unknown[]): unknown => mockResetAllWordMastery(...args),
}))

vi.mock('@/services/factory-reset.service', () => ({
  factoryReset: (...args: unknown[]): unknown => mockFactoryReset(...args),
}))

// ── Hook mocks ───────────────────────────────

const mockFlushDirty = vi.fn().mockResolvedValue(undefined)

vi.mock('@/hooks/useSyncCheckpoint', () => ({
  useSyncCheckpoint: vi.fn(() => ({ flushDirty: mockFlushDirty })),
}))

const mockClearAllDialoguesSeen = vi.fn()

vi.mock('@/hooks/useDialogueSeen', () => ({
  clearAllDialoguesSeen: (...args: unknown[]): unknown => mockClearAllDialoguesSeen(...args),
}))

// ── Import under test ────────────────────────

import { useResetActions } from '@/hooks/useResetActions'

// ── Tests ────────────────────────────────────

describe('useResetActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  describe('resetKana', () => {
    it('flushes dirty state, calls service, updates mastery store and unlock store', async () => {
      mockResetAllMastery.mockResolvedValue({ ok: true, data: { newEpoch: 4 } })
      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean }
      await act(async () => {
        res = await result.current.resetKana()
      })

      expect(res!.ok).toBe(true)
      expect(mockFlushDirty).toHaveBeenCalled()
      expect(mockResetAllMastery).toHaveBeenCalled()
      expect(mockMasteryResetAll).toHaveBeenCalled()
      expect(mockMasterySetEpoch).toHaveBeenCalledWith(4)
      expect(mockUnlockRecompute).toHaveBeenCalledWith({}, new Set())
    })

    it('does not update stores on service failure', async () => {
      mockResetAllMastery.mockResolvedValue({ ok: false, error: 'Failed' })
      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean; error?: string }
      await act(async () => {
        res = await result.current.resetKana()
      })

      expect(res!.ok).toBe(false)
      expect(mockMasteryResetAll).not.toHaveBeenCalled()
      expect(mockUnlockRecompute).not.toHaveBeenCalled()
    })
  })

  describe('resetKotoba', () => {
    it('flushes dirty state, calls service, updates word mastery store', async () => {
      mockResetAllWordMastery.mockResolvedValue({ ok: true, data: { newEpoch: 7 } })
      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean }
      await act(async () => {
        res = await result.current.resetKotoba()
      })

      expect(res!.ok).toBe(true)
      expect(mockFlushDirty).toHaveBeenCalled()
      expect(mockResetAllWordMastery).toHaveBeenCalled()
      expect(mockWordMasteryResetAll).toHaveBeenCalled()
      expect(mockWordMasterySetEpoch).toHaveBeenCalledWith(7)
    })

    it('does not update stores on service failure', async () => {
      mockResetAllWordMastery.mockResolvedValue({ ok: false, error: 'Failed' })
      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean; error?: string }
      await act(async () => {
        res = await result.current.resetKotoba()
      })

      expect(res!.ok).toBe(false)
      expect(mockWordMasteryResetAll).not.toHaveBeenCalled()
    })
  })

  describe('resetAll (factory)', () => {
    it('clears all stores and localStorage on success', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: true,
        data: { newMasteryEpoch: 3, newWordMasteryEpoch: 5 },
      })
      window.localStorage.setItem('dojo.kana.tipIndex', '2')
      window.localStorage.setItem('dojo.kotoba.tipIndex', '1')
      window.localStorage.setItem('langtap-frozen-prompt', '{"x":1}')
      window.localStorage.setItem('langtap:practice-counters', '{"tap":3}')

      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean }
      await act(async () => {
        res = await result.current.resetAll()
      })

      expect(res!.ok).toBe(true)
      expect(mockFlushDirty).toHaveBeenCalled()
      expect(mockFactoryReset).toHaveBeenCalled()
      expect(mockMasteryResetAll).toHaveBeenCalled()
      expect(mockMasterySetEpoch).toHaveBeenCalledWith(3)
      expect(mockWordMasteryResetAll).toHaveBeenCalled()
      expect(mockWordMasterySetEpoch).toHaveBeenCalledWith(5)
      expect(mockCounterResetAll).toHaveBeenCalled()
      expect(mockUnlockRecompute).toHaveBeenCalledWith({}, new Set())
      expect(mockClearAllDialoguesSeen).toHaveBeenCalled()
      expect(window.localStorage.getItem('dojo.kana.tipIndex')).toBeNull()
      expect(window.localStorage.getItem('dojo.kotoba.tipIndex')).toBeNull()
      expect(window.localStorage.getItem('langtap-frozen-prompt')).toBeNull()
      expect(window.localStorage.getItem('langtap:practice-counters')).toBeNull()
    })

    it('does not clear anything on service failure', async () => {
      mockFactoryReset.mockResolvedValue({ ok: false, error: 'Failed' })
      window.localStorage.setItem('dojo.kana.tipIndex', '2')

      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean; error?: string }
      await act(async () => {
        res = await result.current.resetAll()
      })

      expect(res!.ok).toBe(false)
      expect(mockMasteryResetAll).not.toHaveBeenCalled()
      expect(mockClearAllDialoguesSeen).not.toHaveBeenCalled()
      expect(window.localStorage.getItem('dojo.kana.tipIndex')).toBe('2')
    })

    it('catches thrown exceptions and returns error result', async () => {
      mockFactoryReset.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useResetActions())

      let res: { ok: boolean; error?: string }
      await act(async () => {
        res = await result.current.resetAll()
      })

      expect(res!.ok).toBe(false)
      if (!res!.ok) {
        expect(res!.error).toBe('Something went wrong. Please try again.')
      }
      expect(mockMasteryResetAll).not.toHaveBeenCalled()
    })

    it('preserves settings and onboarding localStorage', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: true,
        data: { newMasteryEpoch: 1, newWordMasteryEpoch: 1 },
      })
      window.localStorage.setItem('langtap-settings', '{"keyClicks":true}')
      window.localStorage.setItem('langtap-onboarding', '{"step":3}')

      const { result } = renderHook(() => useResetActions())

      await act(async () => {
        await result.current.resetAll()
      })

      expect(window.localStorage.getItem('langtap-settings')).toBe('{"keyClicks":true}')
      expect(window.localStorage.getItem('langtap-onboarding')).toBe('{"step":3}')
    })
  })
})
