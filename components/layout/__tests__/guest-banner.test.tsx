// ------------------------------------------------------------
// File: components/layout/__tests__/guest-banner.test.tsx
// Purpose: Tests for the GuestBanner component. Validates
//          visibility gated on guest status and 15m distance cap.
// Depends on: components/layout/guest-banner.tsx
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GuestBanner } from '../guest-banner'
import { useGuestDistanceStore } from '@/stores/guest-distance.store'

// ── Mocks ─────────────────────────────────────

const mockUseAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): ReturnType<typeof mockUseAuth> => mockUseAuth(),
}))

// ── Tests ─────────────────────────────────────

describe('GuestBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useGuestDistanceStore.setState({ distances: { kana: 0, kotoba: 0 } })
  })

  it('does not render when guest is below cap', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 10, kotoba: 5 } })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when guest hits the kana cap', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 15, kotoba: 0 } })
    render(<GuestBanner />)
    expect(screen.getByText(/hit the limit/i)).toBeDefined()
  })

  it('renders when guest hits the kotoba cap', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 0, kotoba: 15 } })
    render(<GuestBanner />)
    expect(screen.getByText(/hit the limit/i)).toBeDefined()
  })

  it('does not render for authenticated users even at cap', () => {
    mockUseAuth.mockReturnValue({ isGuest: false, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 20, kotoba: 20 } })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('hides when dismissed', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 15, kotoba: 0 } })
    render(<GuestBanner />)

    fireEvent.click(screen.getByLabelText('Dismiss banner'))
    expect(screen.queryByText(/hit the limit/i)).toBeNull()
  })

  it('shows Create an account link', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    useGuestDistanceStore.setState({ distances: { kana: 15, kotoba: 0 } })
    render(<GuestBanner />)
    expect(screen.getByText('Create an account')).toBeDefined()
  })
})
