// ─────────────────────────────────────────────
// File: components/ui/landing-cta.tsx
// Purpose: Client island for the landing page call-to-action buttons.
//          Uses Next.js Link for prefetching so onboarding loads instantly.
// Depends on: next/link
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import Link from 'next/link'

// ── Component ─────────────────────────────────

export function LandingCta(): ReactNode {
  return (
    <div className="flex flex-col gap-3 w-full">
      <Link
        href="/sign-up"
        aria-label="Create a LangTap account"
        className="w-full bg-sage-500 text-white hover:bg-sage-600 focus:ring-sage-300 px-6 py-4 text-lg min-h-11 rounded-xl font-semibold text-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        Create an account
      </Link>
      <Link
        href="/onboarding/step-1"
        aria-label="Play as a guest without creating an account"
        className="w-full bg-sage-100 text-sage-600 hover:bg-sage-200 focus:ring-sage-300 px-6 py-4 text-lg min-h-11 rounded-xl font-semibold text-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        Play as guest
      </Link>
    </div>
  )
}
