// ─────────────────────────────────────────────
// File: components/profile/header-card.tsx
// Purpose: Profile header card showing avatar, username, membership
//          date, and tier badge. Wired to real UserProfile data.
// Depends on: components/profile/profile-helpers.ts,
//             types/user.types.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { UserProfile } from '@/types/user.types'
import { formatMemberSince } from '@/components/profile/profile-helpers'

// ── Main export ───────────────────────────────

export function HeaderCard({
  profile,
  isGuest,
  onSignOut,
}: {
  profile: UserProfile | null
  isGuest: boolean
  onSignOut: () => void
}): ReactNode {
  const username = profile?.username ?? 'Guest'
  const initial = username.charAt(0).toUpperCase()

  return (
    <div
      role="region"
      aria-label="Profile header"
      className="bg-surface-raised rounded-2xl border border-border px-4 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4">
        <div
          className="h-16 w-16 rounded-full bg-profile-accent/25 flex items-center justify-center shrink-0"
          aria-label={`Profile avatar for ${username}`}
        >
          <span className="text-2xl font-bold text-profile-accent-dark">{initial}</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-warm-800">{username}</h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-sm text-warm-400">
              {isGuest
                ? 'Playing as guest'
                : `Member since ${formatMemberSince(profile?.createdAt ?? new Date().toISOString())}`}
            </span>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-warm-100 text-warm-600">
              Free
            </span>
          </div>
        </div>
        {!isGuest && (
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out of your account"
            className="bg-blush-300 text-white rounded-xl px-5 py-2 text-sm font-medium shadow-[0_4px_0_0_#d4899a] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[44px] shrink-0"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
