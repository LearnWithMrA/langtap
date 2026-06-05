// ─────────────────────────────────────────────
// File: components/layout/__tests__/guest-banner.test.tsx
// Purpose: INERT. GuestBanner disconnected in Sprint 14.
//          Tests verify the component renders nothing.
//          Flagged for owner deletion alongside guest-banner.tsx.
// ─────────────────────────────────────────────

// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GuestBanner } from '../guest-banner'

describe('GuestBanner', () => {
  it('renders nothing (disconnected in Sprint 14)', () => {
    const { container } = render(<GuestBanner />)
    expect(container.innerHTML).toBe('')
  })
})
