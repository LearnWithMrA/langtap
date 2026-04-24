// ─────────────────────────────────────────────
// File: components/profile/membership-card.tsx
// Purpose: Membership tier card showing the current plan and a
//          placeholder for future upgrade functionality.
// Depends on: none
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'

// ── Main export ───────────────────────────────

export function MembershipCard(): ReactNode {
  return (
    <div
      role="region"
      aria-label="Membership information"
      className="bg-surface-raised rounded-2xl border border-border px-4 py-5"
    >
      <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-3">Membership</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-warm-800">Free</span>
        <span className="text-sm text-warm-400">$0 / month</span>
      </div>
      <p className="text-sm text-warm-500 mt-1">Paid plans coming soon</p>
      <button
        type="button"
        className="w-full mt-4 bg-profile-accent/20 text-profile-accent-dark text-sm font-medium rounded-xl py-2.5 hover:bg-profile-accent/30 transition-colors duration-150 min-h-11"
      >
        Notify me when plans are available
      </button>
    </div>
  )
}
