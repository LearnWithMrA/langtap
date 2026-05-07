// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/game/__tests__/dialogue-overlay.test.tsx
// Purpose: Tests for the dialogue overlay component.
//          Covers typewriter animation, continuous message flow,
//          mascot pose, skip, and dismiss behavior.
// Depends on: components/game/dialogue-overlay.tsx
// ─────────────────────────────────────────────

import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DialogueOverlay } from '../dialogue-overlay'

function flushMicrotasks(): void {
  act(() => {
    vi.advanceTimersByTime(0)
  })
}

describe('DialogueOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with dialog role', () => {
    render(<DialogueOverlay messages={['Hello']} mascotPose="neutral" onDismiss={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('types out message character by character', () => {
    render(<DialogueOverlay messages={['Hello']} mascotPose="neutral" onDismiss={vi.fn()} />)

    flushMicrotasks()

    // 2 chars at 70ms each = 140ms
    act(() => {
      vi.advanceTimersByTime(140)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toBe('He')

    // 3 more chars at 70ms = 210ms
    act(() => {
      vi.advanceTimersByTime(210)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toBe('Hello')
  })

  it('does not auto-advance: requires user click to move to next message', () => {
    render(<DialogueOverlay messages={['Hi', 'Bye']} mascotPose="neutral" onDismiss={vi.fn()} />)

    flushMicrotasks()

    // First message types out: "Hi" = 2 chars * 70ms = 140ms
    act(() => {
      vi.advanceTimersByTime(140)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toBe('Hi')

    // Wait well past what was the old 400ms auto-advance pause
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // Still only first message shown (no auto-advance)
    expect(screen.getByTestId('dialogue-text').textContent).not.toContain('Bye')

    // Click Next to advance
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    act(() => {
      vi.advanceTimersByTime(210)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toContain('Bye')
  })

  it('shows Got it button when all messages are done', () => {
    render(<DialogueOverlay messages={['Hi']} mascotPose="neutral" onDismiss={vi.fn()} />)

    flushMicrotasks()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
  })

  it('shows Skip button while messages are typing', () => {
    render(
      <DialogueOverlay
        messages={['A longer message here']}
        mascotPose="neutral"
        onDismiss={vi.fn()}
      />,
    )

    flushMicrotasks()
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })

  it('skip reveals current line only, then Next advances', () => {
    render(
      <DialogueOverlay
        messages={['First message', 'Second message']}
        mascotPose="neutral"
        onDismiss={vi.fn()}
      />,
    )

    flushMicrotasks()
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Skip reveals current line fully
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByTestId('dialogue-text').textContent).toContain('First message')
    expect(screen.getByTestId('dialogue-text').textContent).not.toContain('Second message')

    // Button now says Next
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Second message starts typing
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toContain('Second message')
  })

  it('calls onDismiss when Got it is clicked', () => {
    const onDismiss = vi.fn()
    render(<DialogueOverlay messages={['Done']} mascotPose="neutral" onDismiss={onDismiss} />)

    flushMicrotasks()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('shows correct mascot image for each pose', () => {
    const { rerender } = render(
      <DialogueOverlay messages={['Test']} mascotPose="neutral" onDismiss={vi.fn()} />,
    )
    expect(screen.getByTestId('mascot-image')).toHaveAttribute(
      'src',
      '/images/mascot/mascot-neutral.png',
    )

    rerender(<DialogueOverlay messages={['Test']} mascotPose="encouraging" onDismiss={vi.fn()} />)
    expect(screen.getByTestId('mascot-image')).toHaveAttribute(
      'src',
      '/images/mascot/mascot-encouraging.png',
    )

    rerender(<DialogueOverlay messages={['Test']} mascotPose="thinking" onDismiss={vi.fn()} />)
    expect(screen.getByTestId('mascot-image')).toHaveAttribute(
      'src',
      '/images/mascot/mascot-thinking.png',
    )
  })

  it('renders nothing with empty messages array', () => {
    const { container } = render(
      <DialogueOverlay messages={[]} mascotPose="neutral" onDismiss={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('dismisses on Escape key', () => {
    const onDismiss = vi.fn()
    render(<DialogueOverlay messages={['Test']} mascotPose="neutral" onDismiss={onDismiss} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
