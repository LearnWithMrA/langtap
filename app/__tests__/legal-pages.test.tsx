// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: app/__tests__/legal-pages.test.tsx
// Purpose: Smoke tests for the four legal pages (terms, privacy,
//          acceptable use, copyright). Verifies each page renders its
//          document title heading and the scrollable document region.
// Depends on: app/terms/page.tsx, app/privacy/page.tsx,
//             app/acceptable-use/page.tsx, app/copyright/page.tsx
// ─────────────────────────────────────────────

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Mock the settings store used by LandingFooter (client component with
// audio side effects that do not belong in a server-page smoke test).
vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: Object.assign(
    (selector: (s: unknown) => unknown): unknown => selector({ keyClicks: false }),
    { getState: (): { keyClicks: boolean } => ({ keyClicks: false }) },
  ),
}))

import TermsPage from '@/app/terms/page'
import PrivacyPage from '@/app/privacy/page'
import AcceptableUsePage from '@/app/acceptable-use/page'
import CopyrightPage from '@/app/copyright/page'

// ── Test cases ────────────────────────────────

const PAGES = [
  { name: 'Terms of Service', Page: TermsPage, title: 'Terms of Service' },
  { name: 'Privacy Policy', Page: PrivacyPage, title: 'Privacy Policy' },
  { name: 'Acceptable Use Policy', Page: AcceptableUsePage, title: 'Acceptable Use Policy' },
  { name: 'Copyright Policy', Page: CopyrightPage, title: 'Copyright and DMCA Policy' },
] as const

// ── Tests ─────────────────────────────────────

describe('legal pages', () => {
  afterEach(() => {
    cleanup()
  })

  PAGES.forEach(({ name, Page, title }) => {
    describe(name, () => {
      it('renders the document title heading', () => {
        render(<Page />)
        expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
      })

      it('renders the document region', () => {
        render(<Page />)
        expect(screen.getByRole('region', { name: `${title} document` })).toBeInTheDocument()
      })
    })
  })
})
