// ------------------------------------------------------------
// File: components/layout/guest-banner.tsx
// Purpose: Persistent banner shown to guest users on every main
//          screen. Reminds them to create an account. Dismissal
//          hides the banner for the current session only (React
//          state, not persisted). See FRONTEND.md Section 11.
// Depends on: hooks/useAuth.ts
// ------------------------------------------------------------

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

// ── Component ─────────────────────────────────

export function GuestBanner(): ReactNode {
  const { isGuest, isLoading } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || !isGuest || dismissed) {
    return null
  }

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-[#fff3e0] border-b border-[#f0a166] px-4 py-2 flex items-center justify-center gap-2">
      <p className="text-sm text-[#7a4a1a] text-center">
        Your progress will be lost when you close this tab.{' '}
        <Link href="/sign-up" className="text-[#d4700a] font-medium hover:underline">
          Create an account
        </Link>
      </p>
      <button
        type="button"
        onClick={(): void => setDismissed(true)}
        className="flex-none flex h-7 w-7 items-center justify-center rounded-full text-[#b85c00] hover:bg-[#ffe0b2] transition-colors"
        aria-label="Dismiss banner"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  )
}
