// ------------------------------------------------------------
// File: components/layout/__tests__/guest-banner.test.tsx
// Purpose: Tests for the GuestBanner component. Validates
//          visibility for guests, hidden for authenticated users,
//          60-second delay, and session-only dismissal.
// Depends on: components/layout/guest-banner.tsx
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { GuestBanner } from '../guest-banner'

// ── Mocks ─────────────────────────────────────

const mockUseAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): ReturnType<typeof mockUseAuth> => mockUseAuth(),
}))

// ── Tests ─────────────────────────────────────

describe('GuestBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render before 60-second delay', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('renders for guest users after delay', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    render(<GuestBanner />)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText(/sign up to save/i)).toBeDefined()
  })

  it('does not render for authenticated users', () => {
    mockUseAuth.mockReturnValue({ isGuest: false, isLoading: false })
    const { container } = render(<GuestBanner />)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(container.innerHTML).toBe('')
  })

  it('does not render while loading', () => {
    mockUseAuth.mockReturnValue({ isGuest: false, isLoading: true })
    const { container } = render(<GuestBanner />)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(container.innerHTML).toBe('')
  })

  it('hides when dismissed', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    render(<GuestBanner />)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(screen.getByLabelText('Dismiss banner'))
    expect(screen.queryByText(/sign up to save/i)).toBeNull()
  })

  it('shows a create account link after delay', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    render(<GuestBanner />)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText('Create an account')).toBeDefined()
  })
})
