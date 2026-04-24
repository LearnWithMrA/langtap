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
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-warm-800">Free</span>
            <span className="text-sm text-warm-400">$0 / month</span>
          </div>
          <p className="text-sm text-warm-500 mt-1">Paid plans coming soon</p>
        </div>
        <button
          type="button"
          className="flex-shrink-0 bg-profile-accent/20 text-profile-accent-dark text-sm font-medium rounded-xl px-4 py-2.5 shadow-[0_4px_0_0_rgba(180,140,50,0.25)] active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-11"
        >
          Notify me
        </button>
      </div>
    </div>
  )
}
