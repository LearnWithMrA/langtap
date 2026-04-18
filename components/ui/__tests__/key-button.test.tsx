// ------------------------------------------------------------
// File: components/ui/__tests__/key-button.test.tsx
// Purpose: Tests for the KeyButton component. Validates
//          keyboard key style, disabled state, href rendering,
//          and sound triggers.
// Depends on: components/ui/key-button.tsx
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeyButton } from '../key-button'

// -- Mocks --------------------------------------------------

let playMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  playMock = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal(
    'Audio',
    class MockAudio {
      volume = 1
      play = playMock
    },
  )
})

// -- Tests --------------------------------------------------

describe('KeyButton', () => {
  it('renders children text', () => {
    render(<KeyButton>Click me</KeyButton>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('renders as a button by default', () => {
    render(<KeyButton>Test</KeyButton>)
    const el = screen.getByRole('button')
    expect(el.tagName).toBe('BUTTON')
  })

  it('renders as an anchor when href is provided', () => {
    render(<KeyButton href="/test">Link</KeyButton>)
    const el = screen.getByText('Link')
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('href')).toBe('/test')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<KeyButton onClick={onClick}>Press</KeyButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <KeyButton onClick={onClick} disabled>
        Press
      </KeyButton>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('plays key-click sound on click by default', () => {
    render(<KeyButton>Sound</KeyButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(playMock).toHaveBeenCalledOnce()
  })

  it('plays soft sound when sound="soft"', () => {
    render(<KeyButton sound="soft">Soft</KeyButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(playMock).toHaveBeenCalledOnce()
  })

  it('does not play sound when sound="none"', () => {
    render(<KeyButton sound="none">Silent</KeyButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(playMock).not.toHaveBeenCalled()
  })

  it('applies aria-label', () => {
    render(<KeyButton aria-label="Test label">A</KeyButton>)
    expect(screen.getByLabelText('Test label')).toBeDefined()
  })

  it('sets aria-disabled on disabled button', () => {
    render(<KeyButton disabled>Dis</KeyButton>)
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true')
  })

  it('applies custom className', () => {
    render(<KeyButton className="bg-red-500">Custom</KeyButton>)
    const el = screen.getByRole('button')
    expect(el.className).toContain('bg-red-500')
  })
})
