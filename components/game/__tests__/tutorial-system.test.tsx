// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/game/__tests__/tutorial-system.test.tsx
// Purpose: Integration tests for the tutorial system covering
//          dialogue overlay, dialogue seen tracking, practice
//          banners, and guest trial cap enforcement.
// Depends on: components/game/dialogue-overlay.tsx,
//             hooks/useDialogueSeen.ts,
//             stores/guest-distance.store.ts
// ─────────────────────────────────────────────

import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DialogueOverlay } from '../dialogue-overlay'
import { useGuestDistanceStore } from '@/stores/guest-distance.store'

// ── Dialogue overlay tests ────────────────────

describe('DialogueOverlay integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('themes the card for kana (green)', () => {
    render(
      <DialogueOverlay
        messages={['Test']}
        mascotPose="neutral"
        theme="green"
        onDismiss={vi.fn()}
      />,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('bg-[#ddf0e8]')
  })

  it('themes the card for kotoba (blue)', () => {
    render(
      <DialogueOverlay messages={['Test']} mascotPose="neutral" theme="blue" onDismiss={vi.fn()} />,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('bg-[#dce8f5]')
  })

  it('shows skip trial button when onSkip is provided', () => {
    render(
      <DialogueOverlay
        messages={['Test']}
        mascotPose="neutral"
        onDismiss={vi.fn()}
        onSkip={vi.fn()}
        skipLabel="Skip trial"
      />,
    )
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByRole('button', { name: 'Skip trial' })).toBeInTheDocument()
  })

  it('calls onSkip when skip trial is clicked', () => {
    const onSkip = vi.fn()
    render(
      <DialogueOverlay
        messages={['Test']}
        mascotPose="neutral"
        onDismiss={vi.fn()}
        onSkip={onSkip}
        skipLabel="Skip trial"
      />,
    )
    act(() => {
      vi.advanceTimersByTime(500)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Skip trial' }))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})

// ── Dialogue seen tracking tests ──────────────

describe('useDialogueSeen localStorage tracking', () => {
  const STORAGE_KEY = 'langtap-dialogues-seen'

  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY)
  })

  it('starts with hasSeen false for unseen triggers', async () => {
    const { useDialogueSeen } = await import('@/hooks/useDialogueSeen')
    const { renderHook, act: hookAct } = await import('@testing-library/react')

    const { result } = renderHook(() => useDialogueSeen('kana-first-play'))
    expect(result.current.hasSeen).toBe(false)

    hookAct(() => {
      result.current.markSeen()
    })
    expect(result.current.hasSeen).toBe(true)
  })

  it('persists seen state to localStorage', async () => {
    const { useDialogueSeen } = await import('@/hooks/useDialogueSeen')
    const { renderHook, act: hookAct } = await import('@testing-library/react')

    const { result } = renderHook(() => useDialogueSeen('kana-post-trial'))
    hookAct(() => {
      result.current.markSeen()
    })

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toContain('kana-post-trial')
  })
})

// ── Guest trial cap tests ─────────────────────

describe('Guest trial cap store', () => {
  beforeEach(() => {
    useGuestDistanceStore.setState({ distances: { kana: 0, kotoba: 0 } })
  })

  it('tracks distance independently per game type', () => {
    useGuestDistanceStore.getState().addDistance('kana', 10)
    useGuestDistanceStore.getState().addDistance('kotoba', 5)
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(10)
    expect(useGuestDistanceStore.getState().getDistance('kotoba')).toBe(5)
  })

  it('combined distance triggers cap at 30', () => {
    useGuestDistanceStore.getState().addDistance('kana', 20)
    useGuestDistanceStore.getState().addDistance('kotoba', 10)
    const total =
      useGuestDistanceStore.getState().distances.kana +
      useGuestDistanceStore.getState().distances.kotoba
    expect(total).toBe(30)
    expect(total >= 30).toBe(true)
  })

  it('sanitizes NaN input to 0', () => {
    useGuestDistanceStore.getState().addDistance('kana', NaN)
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(0)
  })

  it('sanitizes negative input to 0', () => {
    useGuestDistanceStore.getState().addDistance('kana', -10)
    expect(useGuestDistanceStore.getState().getDistance('kana')).toBe(0)
  })
})

// ── PracticeClient cap gate tests ─────────────

const mockUsePracticeSession = vi.fn()
const mockUseTutorialTrial = vi.fn()
const mockUseKotobaTrialSession = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/hooks/usePracticeSession', () => ({
  usePracticeSession: (): unknown => mockUsePracticeSession(),
}))
vi.mock('@/hooks/useTutorialTrial', () => ({
  useTutorialTrial: (): unknown => mockUseTutorialTrial(),
}))
vi.mock('@/hooks/useKotobaTrialSession', () => ({
  useKotobaTrialSession: (): unknown => mockUseKotobaTrialSession(),
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): unknown => mockUseAuth(),
}))
vi.mock('next/navigation', () => ({
  useSearchParams: (): { get: () => string | null } => ({ get: () => null }),
}))
vi.mock('motion/react', () => ({
  useReducedMotion: (): boolean => false,
}))
vi.mock('@/components/layout/landscape-background', () => ({
  LandscapeBackground: (): null => null,
}))
vi.mock('@/components/animation/cycling-character', () => ({
  CyclingCharacter: (): null => null,
}))
vi.mock('@/components/audio/audio-player', () => ({
  AudioPlayer: (): null => null,
}))

describe('PracticeClient cap gate', () => {
  beforeEach(() => {
    mockUsePracticeSession.mockReset()
    mockUseTutorialTrial.mockReset()
    mockUseKotobaTrialSession.mockReset()
    mockUseAuth.mockReset()
    useGuestDistanceStore.setState({ distances: { kana: 0, kotoba: 0 } })
  })

  it('renders cap card and does not mount practice hooks when guest is over 30m', async () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 20, kotoba: 10 } })

    const { PracticeClient } = await import('@/components/layout/practice-client')
    render(<PracticeClient />)

    expect(screen.getByText('Practice limit reached')).toBeInTheDocument()
    expect(screen.queryByTestId('game-window')).toBeNull()
    expect(mockUsePracticeSession).not.toHaveBeenCalled()
    expect(mockUseTutorialTrial).not.toHaveBeenCalled()
    expect(mockUseKotobaTrialSession).not.toHaveBeenCalled()
  })

  it('does not mount ActivePracticeClient while auth is loading and distance is over cap', async () => {
    mockUseAuth.mockReturnValue({ isGuest: false, isLoading: true })
    useGuestDistanceStore.setState({ distances: { kana: 30, kotoba: 5 } })

    const { PracticeClient } = await import('@/components/layout/practice-client')
    render(<PracticeClient />)

    expect(screen.queryByText('Practice limit reached')).toBeNull()
    expect(mockUsePracticeSession).not.toHaveBeenCalled()
    expect(mockUseTutorialTrial).not.toHaveBeenCalled()
  })
})
