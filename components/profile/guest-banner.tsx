// ─────────────────────────────────────────────
// File: components/profile/guest-banner.tsx
// Purpose: Guest conversion banner shown at the top of the Profile
//          screen when the user is unauthenticated. Prompts the user
//          to create an account to persist progress.
// Depends on: components/profile/profile-icons.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { IconShield } from '@/components/profile/profile-icons'

// ── Main export ───────────────────────────────

export function GuestBanner(): ReactNode {
  return (
    <div
      role="status"
      className="bg-warm-100 border border-border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2"
    >
      <div className="flex items-start gap-2 flex-1">
        <span className="text-sage-400 shrink-0 mt-0.5">
          <IconShield />
        </span>
        <p className="text-sm text-warm-600">
          Your progress lives only in this browser. Create a free account to save it forever.
        </p>
      </div>
      <button
        type="button"
        className="bg-profile-accent text-white text-sm font-medium rounded-xl px-4 py-2 shadow-[0_3px_0_0_var(--color-profile-accent-dark)] hover:brightness-105 active:translate-y-[1px] active:shadow-none transition-all duration-75 min-h-11 w-full sm:w-auto shrink-0"
      >
        Create account
      </button>
    </div>
  )
}
