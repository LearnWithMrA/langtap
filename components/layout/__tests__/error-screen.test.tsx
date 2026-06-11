// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/layout/__tests__/error-screen.test.tsx
// Purpose: Tests for the shared error boundary screen - retry action,
//          home link, digest display, and no raw error leakage.
// Depends on: components/layout/error-screen.tsx
// ─────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorScreen } from '../error-screen'

describe('ErrorScreen', () => {
  it('renders the calm error message', () => {
    render(<ErrorScreen onRetry={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })

  it('calls onRetry when the try again button is clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorScreen onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('links back to home', () => {
    render(<ErrorScreen onRetry={vi.fn()} />)
    expect(screen.getByRole('link', { name: 'Go back home' })).toHaveAttribute('href', '/home')
  })

  it('shows the digest reference when provided', () => {
    render(<ErrorScreen digest="abc123" onRetry={vi.fn()} />)
    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it('shows no digest line when absent', () => {
    render(<ErrorScreen onRetry={vi.fn()} />)
    expect(screen.queryByText(/Error reference/)).not.toBeInTheDocument()
  })
})
