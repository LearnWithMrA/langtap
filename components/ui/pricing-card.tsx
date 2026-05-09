// ─────────────────────────────────────────────
// File: components/ui/pricing-card.tsx
// Purpose: Pricing section for the landing page. Three tiers:
//          Free (100m/day), Member (monthly/annual toggle),
//          Lifetime. Promotional banner above cards.
//          Paid tiers show "Coming soon" until Stripe is wired.
// Depends on: components/ui/key-button.tsx
// ─────────────────────────────────────────────

'use client'

import { useState, type ReactNode } from 'react'
import { KeyButton } from '@/components/ui/key-button'

// ── Component ────────────────────────────────

export function PricingSection(): ReactNode {
  const [annual, setAnnual] = useState(false)

  const memberPrice = annual ? '$29 / year' : '$5 / month'

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-sm text-warm-600 text-center max-w-md leading-relaxed">
        LangTap is in a promotional period. All signed-in members currently have unlimited practice
        with no daily cap.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mx-auto items-stretch">
        {/* Free */}
        <div className="flex flex-col items-center text-center rounded-2xl p-6 bg-sage-100 text-warm-800 shadow-[0_4px_0_0_var(--color-sage-300)]">
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-2xl font-bold mt-3">$0 / month</p>
          <p className="text-sm opacity-80 mt-2">100m per day</p>
          <div className="flex-1" />
          <KeyButton
            href="/sign-up"
            className="w-full justify-center px-4 py-3 text-sm mt-4 bg-white text-warm-800 shadow-[0_3px_0_0_var(--color-warm-200)]"
            aria-label="Start for free"
          >
            Start for free
          </KeyButton>
        </div>

        {/* Member (monthly / annual toggle) */}
        <div className="relative overflow-hidden flex flex-col items-center text-center rounded-2xl p-6 bg-sage-500 text-white shadow-[0_4px_0_0_var(--color-sage-600)]">
          <h3 className="text-xl font-bold">Member</h3>

          {/* Corner ribbon: annual savings */}
          {annual && (
            <div className="absolute top-[18px] -right-[36px] rotate-45 bg-white/30 text-[10px] font-bold text-white tracking-wider px-12 py-1 text-center">
              SAVE 50%
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center gap-2 mt-3 bg-white/15 rounded-full px-1 py-1">
            <button
              type="button"
              onClick={(): void => setAnnual(false)}
              className={[
                'px-3 py-1 text-xs font-medium rounded-full transition-all duration-150',
                !annual ? 'bg-white text-sage-600' : 'text-white/80 hover:text-white',
              ].join(' ')}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={(): void => setAnnual(true)}
              className={[
                'px-3 py-1 text-xs font-medium rounded-full transition-all duration-150',
                annual ? 'bg-white text-sage-600' : 'text-white/80 hover:text-white',
              ].join(' ')}
            >
              Annual
            </button>
          </div>

          <p className="text-2xl font-bold mt-3">{memberPrice}</p>
          <p className="text-sm opacity-80 mt-2">Unlimited</p>
          <div className="flex-1" />
          <div className="w-full rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-medium mt-4">
            Coming soon
          </div>
        </div>

        {/* Lifetime */}
        <div className="flex flex-col items-center text-center rounded-2xl p-6 bg-warm-800 text-white shadow-[0_4px_0_0_#1a1408]">
          <h3 className="text-xl font-bold">Lifetime</h3>
          <p className="text-2xl font-bold mt-3">$39</p>
          <p className="text-xs font-medium bg-white/15 rounded-full px-3 py-0.5 mt-1">
            One-time payment
          </p>
          <p className="text-sm opacity-80 mt-2">Unlimited forever</p>
          <div className="flex-1" />
          <div className="w-full rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-medium mt-4">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  )
}
