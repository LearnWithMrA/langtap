// ─────────────────────────────────────────────
// File: components/profile/header-card.tsx
// Purpose: Profile header card showing avatar, username, membership
//          date, and tier badge.
// Depends on: components/profile/profile-helpers.ts,
//             samples/profile-fixtures.ts
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { ProfileFixture } from '@/samples/profile-fixtures'
import { formatMemberSince } from '@/components/profile/profile-helpers'

// ── Constants ─────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  free: 'bg-warm-100 text-warm-600',
  regular: 'bg-sage-100 text-sage-600',
  unlimited: 'bg-warm-800 text-white',
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  regular: 'Regular',
  unlimited: 'Unlimited',
}

// ── Main export ───────────────────────────────

export function HeaderCard({
  profile,
  onSignOut,
}: {
  profile: ProfileFixture
  onSignOut: () => void
}): ReactNode {
  const initial = profile.username.charAt(0).toUpperCase()

  return (
    <div
      role="region"
      aria-label="Profile header"
      className="bg-surface-raised rounded-2xl border border-border px-4 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4">
        <div
          className="h-16 w-16 rounded-full bg-profile-accent/25 flex items-center justify-center shrink-0"
          aria-label={`Profile avatar for ${profile.username}`}
        >
          <span className="text-2xl font-bold text-profile-accent-dark">{initial}</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-warm-800">{profile.username}</h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-sm text-warm-400">
              {profile.isGuest
                ? 'Playing as guest'
                : `Member since ${formatMemberSince(profile.memberSince)}`}
            </span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${TIER_STYLES[profile.tier]}`}
            >
              {TIER_LABELS[profile.tier]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out of your account"
          className="bg-blush-300 text-white rounded-xl px-5 py-2 text-sm font-medium shadow-[0_4px_0_0_#d4899a] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[44px] shrink-0"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
