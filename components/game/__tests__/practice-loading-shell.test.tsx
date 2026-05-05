// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/game/__tests__/practice-loading-shell.test.tsx
// Purpose: Tests for PracticeLoadingShell skeleton component.
// Depends on: components/game/practice-loading-shell.tsx
// ─────────────────────────────────────────────

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PracticeLoadingShell } from '../practice-loading-shell'

describe('PracticeLoadingShell', () => {
  it('renders with the practice-loading-shell test id', () => {
    render(<PracticeLoadingShell />)
    expect(screen.getByTestId('practice-loading-shell')).toBeInTheDocument()
  })

  it('has status role for accessibility', () => {
    render(<PracticeLoadingShell />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('matches the game card styling', () => {
    render(<PracticeLoadingShell />)
    const shell = screen.getByTestId('practice-loading-shell')
    expect(shell.className).toContain('bg-[#faf5e4]')
    expect(shell.className).toContain('rounded-2xl')
    expect(shell.className).toContain('max-w-md')
  })
})
