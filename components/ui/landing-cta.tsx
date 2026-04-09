// ─────────────────────────────────────────────
// File: components/ui/landing-cta.tsx
// Purpose: Client island for the landing page call-to-action buttons.
//          Handles navigation to sign-up and guest practice entry.
//          Kept as a client component so router.push() is available
//          and guest-session initialisation can be added here later.
// Depends on: components/ui/button.tsx
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// ── Component ─────────────────────────────────

export function LandingCta(): ReactNode {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        variant="primary"
        size="lg"
        aria-label="Create a LangTap account"
        onClick={() => router.push('/sign-up')}
        className="w-full"
      >
        Create an account
      </Button>
      <Button
        variant="secondary"
        size="lg"
        aria-label="Play as a guest without creating an account"
        onClick={() => router.push('/practice')}
        className="w-full"
      >
        Play as guest
      </Button>
    </div>
  )
}
