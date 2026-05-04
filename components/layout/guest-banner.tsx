// ------------------------------------------------------------
// File: components/layout/guest-banner.tsx
// Purpose: Banner shown to guest users when they hit the 30m combined
//          practice distance cap. Prompts them to create an
//          account. Dismissal hides for the current session only.
// Depends on: hooks/useAuth.ts, stores/auth-modal.store.ts,
//             stores/guest-distance.store.ts, engine/constants.ts
// ------------------------------------------------------------

'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModalStore } from '@/stores/auth-modal.store'
import { useGuestDistanceStore } from '@/stores/guest-distance.store'
import { GUEST_TRIAL_DISTANCE_CAP } from '@/engine/constants'

// ── Component ─────────────────────────────────

export function GuestBanner(): ReactNode {
  const { isGuest, isLoading } = useAuth()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [pathname])
  const openSignUp = useAuthModalStore((s) => s.openSignUp)
  const distances = useGuestDistanceStore((s) => s.distances)
  const isOverCap = distances.kana + distances.kotoba >= GUEST_TRIAL_DISTANCE_CAP

  if (isLoading || !isGuest || !isOverCap || dismissed) {
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
