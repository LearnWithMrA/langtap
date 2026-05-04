// ------------------------------------------------------------
// File: components/layout/__tests__/guest-banner.test.tsx
// Purpose: Tests for the GuestBanner component. Validates
//          visibility gated on server-side 30m combined cap.
// Depends on: components/layout/guest-banner.tsx
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GuestBanner } from '../guest-banner'

// ── Mocks ─────────────────────────────────────

const mockUseGuestUsage = vi.fn()

vi.mock('@/hooks/useGuestUsage', () => ({
  useGuestUsage: (): unknown => mockUseGuestUsage(),
}))

vi.mock('next/navigation', () => ({
  usePathname: (): string => '/practice',
}))

// ── Tests ─────────────────────────────────────

describe('GuestBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when below cap', () => {
    mockUseGuestUsage.mockReturnValue({ isOverCap: false, isLoading: false })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when combined distance hits 30', () => {
    mockUseGuestUsage.mockReturnValue({ isOverCap: true, isLoading: false })
    render(<GuestBanner />)
    expect(screen.getByText(/hit the limit/i)).toBeDefined()
  })

  it('does not render while loading', () => {
    mockUseGuestUsage.mockReturnValue({ isOverCap: false, isLoading: true })
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })

  it('hides when dismissed', () => {
    mockUseGuestUsage.mockReturnValue({ isOverCap: true, isLoading: false })
    render(<GuestBanner />)
    fireEvent.click(screen.getByLabelText('Dismiss banner'))
    expect(screen.queryByText(/hit the limit/i)).toBeNull()
  })

  it('shows Create an account link', () => {
    mockUseGuestUsage.mockReturnValue({ isOverCap: true, isLoading: false })
    render(<GuestBanner />)
    expect(screen.getByText('Create an account')).toBeDefined()
  })
})
