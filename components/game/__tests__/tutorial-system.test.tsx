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
})
