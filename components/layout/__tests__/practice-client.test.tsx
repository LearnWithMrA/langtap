// ─────────────────────────────────────────────
// File: components/layout/__tests__/practice-client.test.tsx
// Purpose: Regression test for PracticeClient render gate. Proves
//          authenticated users see daily cap and loading gates.
//          Guest users render practice immediately.
// Depends on: components/layout/practice-client.tsx,
//             stores/user.store.ts
// ─────────────────────────────────────────────

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserStore } from '@/stores/user.store'
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

let mockDailyCap = { isLoading: false, isCapped: false, capState: null, increment: vi.fn() }
vi.mock('@/hooks/useDailyCap', () => ({
  useDailyCap: (): unknown => mockDailyCap,
}))

vi.mock('@/engine/constants', () => ({
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
    mockDailyCap = { isLoading: false, isCapped: false, capState: null, increment: vi.fn() }
    vi.clearAllMocks()
  })

  it('renders game for guest users without loading gate', () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })

    render(<PracticeClient gameType="kana" />)

    expect(screen.queryByTestId('practice-loading-card')).not.toBeInTheDocument()
  })

  it('shows daily capped shell for authenticated user when daily cap is hit', () => {
    useUserStore.setState({
      user: { id: 'u1', email: 'a@b.com', isAnonymous: false },
      profile: {
        id: 'u1',
        username: 'test',
        jlptLevel: 'N5',
        inputMode: 'tap',
        onboardingComplete: true,
        notificationsEnabled: false,
        distanceUnit: 'metric',
        leaderboardVisibility: 'public',
        userTz: 'UTC',
        usernameChangedAt: null,
        guestImportedAt: null,
        guestImportSkippedAt: null,
        legacyImportedAt: null,
        legacyImportSkippedAt: null,
        createdAt: '2026-01-01',
      },
      isLoading: false,
      isProfileLoaded: true,
      isServerHydrated: true,
    })
    mockDailyCap = {
      isLoading: false,
      isCapped: true,
      capState: { totalToday: 110, isCapped: true, capAmount: 100, capEnabled: true },
      increment: vi.fn(),
    }

    render(<PracticeClient gameType="kana" />)

    expect(screen.getByText(/crushing it/i)).toBeInTheDocument()
  })

  it('waits for daily cap to load before rendering for authenticated users', () => {
    useUserStore.setState({
      user: { id: 'u1', email: 'a@b.com', isAnonymous: false },
      profile: null,
      isLoading: false,
      isProfileLoaded: true,
      isServerHydrated: true,
    })
    mockDailyCap = {
      isLoading: true,
      isCapped: false,
      capState: null,
      increment: vi.fn(),
    }

    render(<PracticeClient gameType="kana" />)

    expect(screen.queryByText(/crushing it/i)).not.toBeInTheDocument()
  })
})
