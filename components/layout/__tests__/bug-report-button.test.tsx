// ─────────────────────────────────────────────
// File: components/layout/__tests__/bug-report-button.test.tsx
// Purpose: Tests for the BugReportButton component. Validates
//          visibility for authenticated vs unauthenticated users,
//          and modal open/close behaviour.
// Depends on: components/layout/bug-report-button.tsx
// ─────────────────────────────────────────────

// @vitest-environment jsdom

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────

const mockUseAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): ReturnType<typeof mockUseAuth> => mockUseAuth(),
}))

vi.mock('@/components/layout/bug-report-modal', () => ({
  BugReportModal: ({ isOpen }: { isOpen: boolean }): React.ReactNode =>
    isOpen ? <div data-testid="bug-report-modal">Modal</div> : null,
}))

// ── Tests ─────────────────────────────────────

describe('BugReportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    const { BugReportButton } = await import('../bug-report-button')
    const { container } = render(<BugReportButton />)

    expect(container.firstChild).toBeNull()
  })

  it('renders button for authenticated users', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })

    const { BugReportButton } = await import('../bug-report-button')
    render(<BugReportButton />)

    expect(screen.getByRole('button', { name: 'Report a bug' })).toBeInTheDocument()
  })

  it('opens modal on click', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })

    const { BugReportButton } = await import('../bug-report-button')
    render(<BugReportButton />)

    expect(screen.queryByTestId('bug-report-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Report a bug' }))

    expect(screen.getByTestId('bug-report-modal')).toBeInTheDocument()
  })

  it('has accessible label', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })

    const { BugReportButton } = await import('../bug-report-button')
    render(<BugReportButton />)

    const button = screen.getByRole('button', { name: 'Report a bug' })
    expect(button).toHaveAttribute('aria-label', 'Report a bug')
  })

  it('has minimum touch target size', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })

    const { BugReportButton } = await import('../bug-report-button')
    render(<BugReportButton />)

    const button = screen.getByRole('button', { name: 'Report a bug' })
    expect(button.className).toContain('w-8')
    expect(button.className).toContain('h-8')
  })
})
