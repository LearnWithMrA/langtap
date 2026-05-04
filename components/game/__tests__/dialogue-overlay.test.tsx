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

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toBe('He')

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toBe('Hello')
  })

  it('flows messages continuously without user interaction', () => {
    render(<DialogueOverlay messages={['Hi', 'Bye']} mascotPose="neutral" onDismiss={vi.fn()} />)

    // First message types out: "Hi" = 2 chars * 50ms = 100ms
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toBe('Hi')

    // 400ms pause fires the setTimeout, advancing to next message
    act(() => {
      vi.advanceTimersByTime(400)
    })
    // Then 100ms for 2 chars of "Bye" at 50ms each
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByTestId('dialogue-text').textContent).toContain('Hi')
    expect(screen.getByTestId('dialogue-text').textContent).toContain('By')
  })

  it('shows Got it button when all messages are done', () => {
    render(<DialogueOverlay messages={['Hi']} mascotPose="neutral" onDismiss={vi.fn()} />)

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

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })

  it('skip reveals all messages immediately', () => {
    render(
      <DialogueOverlay
        messages={['First message', 'Second message']}
        mascotPose="neutral"
        onDismiss={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(100)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    expect(screen.getByTestId('dialogue-text').textContent).toContain('Second message')
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
  })

  it('calls onDismiss when Got it is clicked', () => {
    const onDismiss = vi.fn()
    render(<DialogueOverlay messages={['Done']} mascotPose="neutral" onDismiss={onDismiss} />)

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
