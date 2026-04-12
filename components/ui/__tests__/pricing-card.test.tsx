// ------------------------------------------------------------
// File: components/ui/__tests__/pricing-card.test.tsx
// Purpose: Tests for the PricingSection component. Validates
//          that all three tiers render, paid tiers show "Coming
//          soon" in the button area, and free tier CTA is active.
// Depends on: components/ui/pricing-card.tsx
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingSection } from '../pricing-card'

// Mock Audio
vi.stubGlobal('Audio', class MockAudio {
  volume = 1
  play(): Promise<void> { return Promise.resolve() }
})

describe('PricingSection', () => {
  it('renders all three tier names', () => {
    render(<PricingSection />)
    expect(screen.getByText('Free')).toBeDefined()
    expect(screen.getByText('Regular')).toBeDefined()
    expect(screen.getByText('Unlimited')).toBeDefined()
  })

  it('renders correct prices', () => {
    render(<PricingSection />)
    expect(screen.getByText('$0 / month')).toBeDefined()
    expect(screen.getByText('$3 / month')).toBeDefined()
    expect(screen.getByText('$5 / month')).toBeDefined()
  })

  it('renders distance limits', () => {
    render(<PricingSection />)
    expect(screen.getByText('50m per day')).toBeDefined()
    expect(screen.getByText('300m per day')).toBeDefined()
    expect(screen.getByText('No limit')).toBeDefined()
  })

  it('shows "Coming soon" text for paid tiers', () => {
    render(<PricingSection />)
    const comingSoon = screen.getAllByText('Coming soon')
    expect(comingSoon).toHaveLength(2)
  })

  it('has an enabled CTA for the free tier', () => {
    render(<PricingSection />)
    const freeButton = screen.getByLabelText('Start for free - Free tier')
    expect(freeButton).toBeDefined()
    expect(freeButton.getAttribute('aria-disabled')).not.toBe('true')
  })

  it('does not render "Get started" as a button or link for paid tiers', () => {
    render(<PricingSection />)
    // Paid tiers show "Coming soon" as plain text, not as a clickable element
    expect(screen.queryByLabelText('Get started - Regular tier')).toBeNull()
    expect(screen.queryByLabelText('Get started - Unlimited tier')).toBeNull()
  })
})
