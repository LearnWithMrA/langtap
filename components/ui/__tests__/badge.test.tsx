// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/badge.test.tsx
// Purpose: Tests for the Badge primitive component.
// Depends on: components/ui/badge.tsx
// ------------------------------------------------------------

import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renders the label text', () => {
    render(<Badge label="N5" />)
    expect(screen.getByText('N5')).toBeInTheDocument()
  })

  it('defaults to sage variant', () => {
    const { container } = render(<Badge label="N5" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-sage-100')
    expect(el.className).toContain('text-sage-600')
  })

  it('applies mint variant classes', () => {
    const { container } = render(<Badge label="Tap" variant="mint" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-mint-100')
    expect(el.className).toContain('text-mint-500')
  })

  it('applies blush variant classes', () => {
    const { container } = render(<Badge label="New" variant="blush" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-blush-100')
  })

  it('applies warm variant classes', () => {
    const { container } = render(<Badge label="Info" variant="warm" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-warm-100')
  })

  it('merges additional className', () => {
    const { container } = render(<Badge label="N5" className="ml-2" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('ml-2')
  })

  it('renders as an inline span with no interactive role', () => {
    const { container } = render(<Badge label="N5" />)
    const el = container.firstChild as HTMLElement
    expect(el.tagName).toBe('SPAN')
    expect(el).not.toHaveAttribute('role', 'button')
  })
})
