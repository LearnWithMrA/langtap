// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/card.test.tsx
// Purpose: Tests for the Card primitive component.
// Depends on: components/ui/card.tsx
// ------------------------------------------------------------

import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello card</Card>)
    expect(screen.getByText('Hello card')).toBeInTheDocument()
  })

  it('applies default surface and border classes', () => {
    const { container } = render(<Card>content</Card>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('bg-surface-raised')
    expect(el.className).toContain('border-border')
    expect(el.className).toContain('rounded-2xl')
  })

  it('merges additional className', () => {
    const { container } = render(<Card className="mt-4">content</Card>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('mt-4')
  })

  it('renders multiple children', () => {
    render(
      <Card>
        <span>child one</span>
        <span>child two</span>
      </Card>,
    )
    expect(screen.getByText('child one')).toBeInTheDocument()
    expect(screen.getByText('child two')).toBeInTheDocument()
  })
})
