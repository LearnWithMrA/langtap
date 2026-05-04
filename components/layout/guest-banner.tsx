// ------------------------------------------------------------
// File: components/layout/guest-banner.tsx
// Purpose: Banner shown to guest users when they hit the 30m combined
//          practice distance cap (server-side enforced). Prompts them
//          to create an account. Dismissal hides for the current page
//          visit only (resets on route navigation).
// Depends on: hooks/useGuestUsage.ts, stores/auth-modal.store.ts
// ------------------------------------------------------------

'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useGuestUsage } from '@/hooks/useGuestUsage'
import { useAuthModalStore } from '@/stores/auth-modal.store'

// ── Component ─────────────────────────────────

export function GuestBanner(): ReactNode {
  const { isOverCap, isLoading } = useGuestUsage()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)
  const openSignUp = useAuthModalStore((s) => s.openSignUp)

  useEffect(() => {
    setDismissed(false)
  }, [pathname])

  if (isLoading || !isOverCap || dismissed) {
    return null
  }

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-[#fff3e0] border-b border-[#f0a166] px-4 py-2 flex items-center justify-center gap-2">
      <p className="text-sm text-[#7a4a1a] text-center">
        You've hit the limit as a guest.{' '}
        <button
          type="button"
          onClick={openSignUp}
          className="text-[#d4700a] font-medium hover:underline"
        >
          Create an account
        </button>{' '}
        to continue.
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
