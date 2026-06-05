// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/profile/__tests__/reset-progress.test.tsx
// Purpose: Tests for the ResetProgress component. Covers:
//          - Per-domain resets (Kana/Kotoba) still work
//          - Factory reset typed confirmation (RESET required, case-sensitive)
//          - Factory reset clears all stores and localStorage on success
//          - Factory reset does not clear state on RPC failure (atomicity)
//          - Epoch values update from RPC response
//          - Dialog open/close behaviour
// Depends on: components/profile/reset-progress.tsx
// ─────────────────────────────────────────────

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

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
      getState: vi.fn(() => ({
        resetAll: mockCounterResetAll,
      })),
    },
  ),
}))

vi.mock('@/stores/unlock.store', () => ({
  useUnlockStore: Object.assign(
    vi.fn(() => ({})),
    {
      getState: vi.fn(() => ({
        recompute: mockUnlockRecompute,
      })),
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

// ── Import under test (after mocks) ─────────

import { ResetProgress } from '@/components/profile/reset-progress'

// ── Helpers ──────────────────────────────────

function renderComponent(): ReturnType<typeof render> {
  return render(<ResetProgress />)
}

// ── Tests ────────────────────────────────────

describe('ResetProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  describe('rendering', () => {
    it('renders all three reset buttons', () => {
      renderComponent()

      expect(screen.getByText('Reset Kana')).toBeDefined()
      expect(screen.getByText('Reset Kotoba')).toBeDefined()
      expect(screen.getByText('Full Reset')).toBeDefined()
    })
  })

  describe('per-domain resets still work', () => {
    it('opens kana reset modal and clears kana stores on success', async () => {
      mockResetAllMastery.mockResolvedValue({ ok: true, data: { newEpoch: 4 } })
      renderComponent()

      fireEvent.click(screen.getByText('Reset Kana'))

      await waitFor(() => {
        expect(screen.getByText('Reset kana progress?')).toBeDefined()
      })

      fireEvent.click(screen.getByText('Reset'))

      await waitFor(() => {
        expect(mockFlushDirty).toHaveBeenCalled()
        expect(mockResetAllMastery).toHaveBeenCalled()
        expect(mockMasteryResetAll).toHaveBeenCalled()
        expect(mockMasterySetEpoch).toHaveBeenCalledWith(4)
        expect(mockUnlockRecompute).toHaveBeenCalledWith({}, new Set())
      })
    })

    it('opens kotoba reset modal and clears word stores on success', async () => {
      mockResetAllWordMastery.mockResolvedValue({ ok: true, data: { newEpoch: 7 } })
      renderComponent()

      fireEvent.click(screen.getByText('Reset Kotoba'))

      await waitFor(() => {
        expect(screen.getByText('Reset word progress?')).toBeDefined()
      })

      fireEvent.click(screen.getByText('Reset'))

      await waitFor(() => {
        expect(mockFlushDirty).toHaveBeenCalled()
        expect(mockResetAllWordMastery).toHaveBeenCalled()
        expect(mockWordMasteryResetAll).toHaveBeenCalled()
        expect(mockWordMasterySetEpoch).toHaveBeenCalledWith(7)
      })
    })
  })

  describe('factory reset dialog', () => {
    it('opens when Full Reset is clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))

      expect(screen.getByText('Reset all progress?')).toBeDefined()
      expect(screen.getByPlaceholderText('RESET')).toBeDefined()
    })

    it('confirm button is disabled until RESET is typed', () => {
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))

      const confirmBtn = screen.getByText('Reset everything')
      expect(confirmBtn.hasAttribute('disabled')).toBe(true)
    })

    it('confirm button is disabled when input is "reset" (wrong case)', async () => {
      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))

      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'reset')

      const confirmBtn = screen.getByText('Reset everything')
      expect(confirmBtn.hasAttribute('disabled')).toBe(true)
    })

    it('confirm button enables when RESET is typed (case-sensitive)', async () => {
      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))

      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')

      const confirmBtn = screen.getByText('Reset everything')
      expect(confirmBtn.hasAttribute('disabled')).toBe(false)
    })

    it('closes when Cancel is clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      expect(screen.getByText('Reset all progress?')).toBeDefined()

      fireEvent.click(screen.getByText('Cancel'))

      expect(screen.queryByText('Reset all progress?')).toBeNull()
    })

    it('closes when backdrop is clicked', () => {
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      expect(screen.getByText('Reset all progress?')).toBeDefined()

      const backdrop = screen.getByRole('presentation')
      fireEvent.click(backdrop)

      expect(screen.queryByText('Reset all progress?')).toBeNull()
    })
  })

  describe('factory reset execution', () => {
    it('clears all stores and localStorage on RPC success', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: true,
        data: { newMasteryEpoch: 3, newWordMasteryEpoch: 5 },
      })

      window.localStorage.setItem('langtap-dialogues-seen', '["kana-first-play"]')
      window.localStorage.setItem('dojo.kana.tipIndex', '2')
      window.localStorage.setItem('dojo.kotoba.tipIndex', '1')
      window.localStorage.setItem('langtap-frozen-prompt', '{"some":"data"}')
      window.localStorage.setItem('langtap:practice-counters', '{"type":5,"tap":3,"swipe":0}')

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(mockFlushDirty).toHaveBeenCalled()
        expect(mockFactoryReset).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockMasteryResetAll).toHaveBeenCalled()
        expect(mockMasterySetEpoch).toHaveBeenCalledWith(3)
        expect(mockWordMasteryResetAll).toHaveBeenCalled()
        expect(mockWordMasterySetEpoch).toHaveBeenCalledWith(5)
        expect(mockCounterResetAll).toHaveBeenCalled()
        expect(mockUnlockRecompute).toHaveBeenCalledWith({}, new Set())
        expect(mockClearAllDialoguesSeen).toHaveBeenCalled()
      })

      expect(window.localStorage.getItem('dojo.kana.tipIndex')).toBeNull()
      expect(window.localStorage.getItem('dojo.kotoba.tipIndex')).toBeNull()
      expect(window.localStorage.getItem('langtap-frozen-prompt')).toBeNull()
      expect(window.localStorage.getItem('langtap:practice-counters')).toBeNull()
    })

    it('updates both epoch values from RPC response', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: true,
        data: { newMasteryEpoch: 10, newWordMasteryEpoch: 20 },
      })

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(mockMasterySetEpoch).toHaveBeenCalledWith(10)
        expect(mockWordMasterySetEpoch).toHaveBeenCalledWith(20)
      })
    })

    it('does not clear local state on RPC failure (atomicity)', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: false,
        error: 'Failed to reset all progress.',
      })

      window.localStorage.setItem('langtap-dialogues-seen', '["kana-first-play"]')
      window.localStorage.setItem('dojo.kana.tipIndex', '2')
      window.localStorage.setItem('langtap:practice-counters', '{"type":5}')

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(mockFactoryReset).toHaveBeenCalled()
      })

      expect(mockMasteryResetAll).not.toHaveBeenCalled()
      expect(mockWordMasteryResetAll).not.toHaveBeenCalled()
      expect(mockCounterResetAll).not.toHaveBeenCalled()
      expect(mockUnlockRecompute).not.toHaveBeenCalled()
      expect(mockClearAllDialoguesSeen).not.toHaveBeenCalled()
      expect(window.localStorage.getItem('langtap-dialogues-seen')).toBe('["kana-first-play"]')
      expect(window.localStorage.getItem('dojo.kana.tipIndex')).toBe('2')
      expect(window.localStorage.getItem('langtap:practice-counters')).toBe('{"type":5}')
    })

    it('shows error message on RPC failure', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: false,
        error: 'Failed to reset all progress.',
      })

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(screen.getByText('Failed to reset all progress.')).toBeDefined()
      })
    })

    it('shows error message on unexpected exception', async () => {
      mockFactoryReset.mockRejectedValue(new Error('Network error'))

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeDefined()
      })
    })

    it('preserves settings store localStorage', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: true,
        data: { newMasteryEpoch: 1, newWordMasteryEpoch: 1 },
      })

      window.localStorage.setItem('langtap-settings', '{"keyClicks":true}')

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(mockFactoryReset).toHaveBeenCalled()
      })

      expect(window.localStorage.getItem('langtap-settings')).toBe('{"keyClicks":true}')
    })

    it('preserves onboarding store localStorage', async () => {
      mockFactoryReset.mockResolvedValue({
        ok: true,
        data: { newMasteryEpoch: 1, newWordMasteryEpoch: 1 },
      })

      window.localStorage.setItem('langtap-onboarding', '{"step":3}')

      const user = userEvent.setup()
      renderComponent()

      fireEvent.click(screen.getByText('Full Reset'))
      const input = screen.getByPlaceholderText('RESET')
      await user.type(input, 'RESET')
      fireEvent.click(screen.getByText('Reset everything'))

      await waitFor(() => {
        expect(mockFactoryReset).toHaveBeenCalled()
      })

      expect(window.localStorage.getItem('langtap-onboarding')).toBe('{"step":3}')
    })
  })
})
