// ─────────────────────────────────────────────
// File: components/layout/__tests__/practice-client.test.tsx
// Purpose: Regression test for PracticeClient render gate. Proves
//          practice renders immediately for guests (no loading gate),
//          and cap is enforced only after usage resolves.
// Depends on: components/layout/practice-client.tsx,
//             stores/user.store.ts, stores/guest-usage.store.ts
// ─────────────────────────────────────────────

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/user.store'
import { useGuestUsageStore } from '@/stores/guest-usage.store'
import { PracticeClient } from '../practice-client'

// ── Mocks ─────────────────────────────────────

vi.mock('@/hooks/useKeySound', () => ({
  useKeySound: (): { playSound: () => void } => ({ playSound: vi.fn() }),
}))

vi.mock('@/hooks/usePracticeCounters', () => ({
  usePracticeCounters: (): unknown => ({
    counters: { tap: 0, type: 0, swipe: 0 },
    incrementCorrect: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePracticeSession', () => ({
  usePracticeSession: (): unknown => ({
    prompt: {
      kind: 'character',
      word: {
        id: 'char-h-a',
        kana: 'あ',
        kanji: null,
        meaning: ' ',
        jlptLevel: 'N5',
        characterIds: ['h-a'],
        audioFile: null,
      },
      characters: [{ id: 'h-a', kana: 'あ', romaji: 'a' }],
      targetCharacterId: 'h-a',
    },
    isLoading: false,
    isEmpty: false,
    practiceIds: new Set(['h-a']),
    handleWordComplete: vi.fn(),
    advanceToNext: vi.fn(),
  }),
}))

vi.mock('@/hooks/useTutorialTrial', () => ({
  useTutorialTrial: (): unknown => ({
    prompt: null,
    isComplete: true,
    handleWordComplete: vi.fn(),
    advanceToNext: vi.fn(),
    isLoading: false,
    isEmpty: true,
    practiceIds: new Set(),
  }),
}))

vi.mock('@/hooks/useKotobaTrialSession', () => ({
  useKotobaTrialSession: (): unknown => ({
    prompt: null,
    isComplete: true,
    handleWordComplete: vi.fn(),
    advanceToNext: vi.fn(),
    isLoading: false,
    isEmpty: true,
  }),
}))

vi.mock('@/hooks/useDialogueSeen', () => ({
  useDialogueSeen: (): { hasSeen: boolean; markSeen: () => void } => ({
    hasSeen: true,
    markSeen: vi.fn(),
  }),
}))

vi.mock('@/services/guest-usage.service', () => ({
  ensureGuestSession: vi.fn().mockResolvedValue({ ok: true }),
  loadGuestUsage: vi.fn().mockResolvedValue({
    ok: true,
    data: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null },
  }),
  incrementGuestUsage: vi.fn(),
}))

vi.mock('@/engine/constants', () => ({
  GUEST_TRIAL_DISTANCE_CAP: 1800,
  FEEDBACK_FLASH_MS: 300,
  MEANING_DISPLAY_MS: 1500,
  MEANING_FADE_MS: 300,
  MIN_ELIGIBLE_WORDS_FOR_MIXING: 5,
}))

vi.mock('@/data/tutorial/dialogue-scripts', () => ({
  DIALOGUE_SCRIPTS: {},
}))

vi.mock('@/data/tutorial/trial-prompts', () => ({
  TRIAL_ALLOWED_IDS: [],
}))

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: unknown) => unknown): unknown =>
    selector({ hints: false, kotobaInput: 'romaji' }),
}))

vi.mock('@/stores/auth-modal.store', () => ({
  useAuthModalStore: (selector: (s: unknown) => unknown): unknown =>
    selector({ openSignUp: vi.fn() }),
}))

vi.mock('next/dynamic', () => ({
  default: (): null => null,
}))

// ── Tests ─────────────────────────────────────

describe('PracticeClient', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
    useGuestUsageStore.getState().reset()
    vi.clearAllMocks()
  })

  it('renders game immediately for guests without waiting for usage to load', () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })
    // Guest usage store is still loading (default state)

    render(<PracticeClient gameType="kana" />)

    // Should NOT show a loading card - game renders immediately
    expect(screen.queryByTestId('practice-loading-card')).not.toBeInTheDocument()
  })

  it('does not show capped shell while usage is still loading', () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })
    // Even if somehow isOverCap would be true while loading, don't show cap

    render(<PracticeClient gameType="kana" />)

    expect(screen.queryByText(/hit the limit/i)).not.toBeInTheDocument()
  })

  it('shows capped shell only after usage resolves and user is over cap', async () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })
    useGuestUsageStore.setState({
      usage: { kanaDistance: 1000, kotobaDistance: 900, cappedAt: null },
      isLoading: false,
      isInitialized: true,
    })

    render(<PracticeClient gameType="kana" />)

    await waitFor(() => {
      // CappedPracticeShell renders a frozen character
      expect(screen.getByText('あ')).toBeInTheDocument()
    })
  })

  it('renders game content when usage resolves under cap', async () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })
    useGuestUsageStore.setState({
      usage: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null },
      isLoading: false,
      isInitialized: true,
    })

    render(<PracticeClient gameType="kana" />)

    await waitFor(() => {
      expect(screen.queryByTestId('practice-loading-card')).not.toBeInTheDocument()
    })
  })

  it('skips cap gate entirely for authenticated users', () => {
    useUserStore.setState({
      user: { id: 'u1', email: 'a@b.com', isAnonymous: false },
      profile: null,
      isLoading: false,
    })

    render(<PracticeClient gameType="kana" />)

    expect(screen.queryByTestId('practice-loading-card')).not.toBeInTheDocument()
  })
})
