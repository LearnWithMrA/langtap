// ------------------------------------------------------------
// File: components/layout/__tests__/guest-banner.test.tsx
// Purpose: Tests for the GuestBanner component. Validates
//          visibility for guests, hidden for authenticated users,
//          and session-only dismissal.
// Depends on: components/layout/guest-banner.tsx
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  })

  it('renders for guest users', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    render(<GuestBanner />)
    expect(screen.getByText(/progress will be lost/i)).toBeDefined()
  })

  it('does not render for authenticated users', () => {
    mockUseAuth.mockReturnValue({ isGuest: false, isLoading: false })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('does not render while loading', () => {
    mockUseAuth.mockReturnValue({ isGuest: false, isLoading: true })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('hides when dismissed', async () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    render(<GuestBanner />)

    const dismissButton = screen.getByLabelText('Dismiss banner')
    await userEvent.click(dismissButton)

    expect(screen.queryByText(/progress will be lost/i)).toBeNull()
  })

  it('shows a create account link', () => {
    mockUseAuth.mockReturnValue({ isGuest: true, isLoading: false })
    render(<GuestBanner />)
    expect(screen.getByText('Create an account')).toBeDefined()
  })
})
