// ─────────────────────────────────────────────
// File: components/ui/__tests__/pricing-card.test.tsx
// Purpose: Tests for the PricingSection component. Validates
//          tier rendering, monthly/annual toggle, promo banner,
//          and CTA states.
// Depends on: components/ui/pricing-card.tsx
// ─────────────────────────────────────────────

// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PricingSection } from '../pricing-card'

vi.stubGlobal(
  'Audio',
  class MockAudio {
    volume = 1
    play(): Promise<void> {
      return Promise.resolve()
    }
  },
)

describe('PricingSection', () => {
  it('renders all three tier names', () => {
    render(<PricingSection />)
    expect(screen.getByText('Free')).toBeDefined()
    expect(screen.getByText('Member')).toBeDefined()
    expect(screen.getByText('Lifetime')).toBeDefined()
  })

  it('renders free tier with correct price and distance', () => {
    render(<PricingSection />)
    expect(screen.getByText('$0 / month')).toBeDefined()
    expect(screen.getByText('100m per day')).toBeDefined()
  })

  it('shows member monthly price by default', () => {
    render(<PricingSection />)
    expect(screen.getByText('$5 / month')).toBeDefined()
  })

  it('toggles to annual pricing with savings badge', () => {
    render(<PricingSection />)
    fireEvent.click(screen.getByText('Annual'))
    expect(screen.getByText('$29 / year')).toBeDefined()
    expect(screen.getByText('SAVE 50%')).toBeDefined()
  })

  it('renders lifetime tier with one-time price', () => {
    render(<PricingSection />)
    expect(screen.getByText('$39')).toBeDefined()
    expect(screen.getByText('One-time payment')).toBeDefined()
    expect(screen.getByText('Unlimited forever')).toBeDefined()
  })

  it('shows "Coming soon" for paid tiers', () => {
    render(<PricingSection />)
    const comingSoon = screen.getAllByText('Coming soon')
    expect(comingSoon).toHaveLength(2)
  })

  it('has an active CTA for the free tier', () => {
    render(<PricingSection />)
    const freeButton = screen.getByLabelText('Start for free')
    expect(freeButton).toBeDefined()
  })

  it('shows promotional period banner', () => {
    render(<PricingSection />)
    expect(screen.getByText(/promotional period/)).toBeDefined()
  })
})
