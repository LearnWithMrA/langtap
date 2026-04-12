// ------------------------------------------------------------
// File: components/ui/pricing-card.tsx
// Purpose: Pricing tier card for the landing page. Three tiers:
//          Free, Regular, Unlimited. Paid tiers show "Coming soon"
//          in the button area. Cards are equal height via flex.
// Depends on: components/ui/key-button.tsx
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { KeyButton } from '@/components/ui/key-button'

// -- Types --------------------------------------------------

type PricingTier = {
  name: string
  price: string
  distance: string
  bgClass: string
  textClass: string
  shadowClass: string
  ctaLabel: string
  ctaHref: string
  comingSoon: boolean
}

// -- Constants ----------------------------------------------

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '$0 / month',
    distance: '50m per day',
    bgClass: 'bg-sage-100',
    textClass: 'text-warm-800',
    shadowClass: 'shadow-[0_4px_0_0_var(--color-sage-300)]',
    ctaLabel: 'Start for free',
    ctaHref: '/sign-up',
    comingSoon: false,
  },
  {
    name: 'Regular',
    price: '$3 / month',
    distance: '300m per day',
    bgClass: 'bg-sage-500',
    textClass: 'text-white',
    shadowClass: 'shadow-[0_4px_0_0_var(--color-sage-600)]',
    ctaLabel: 'Get started',
    ctaHref: '/sign-up',
    comingSoon: true,
  },
  {
    name: 'Unlimited',
    price: '$5 / month',
    distance: 'No limit',
    bgClass: 'bg-warm-800',
    textClass: 'text-white',
    shadowClass: 'shadow-[0_4px_0_0_#1a1408]',
    ctaLabel: 'Get started',
    ctaHref: '/sign-up',
    comingSoon: true,
  },
]

// -- Component ----------------------------------------------

export function PricingSection(): ReactNode {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mx-auto items-stretch">
      {TIERS.map((tier) => (
        <div
          key={tier.name}
          className={[
            'flex flex-col items-center rounded-2xl p-6',
            tier.bgClass,
            tier.textClass,
            tier.shadowClass,
          ].join(' ')}
        >
          <h3 className="text-xl font-bold">{tier.name}</h3>
          <p className="text-2xl font-bold mt-3">{tier.price}</p>
          <p className="text-sm opacity-80 mt-2">{tier.distance}</p>
          <div className="flex-1" />
          {tier.comingSoon ? (
            <div className="w-full rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-medium mt-4">
              Coming soon
            </div>
          ) : (
            <KeyButton
              href={tier.ctaHref}
              className="w-full justify-center px-4 py-3 text-sm mt-4 bg-white text-warm-800 shadow-[0_3px_0_0_var(--color-warm-200)]"
              aria-label={`${tier.ctaLabel} - ${tier.name} tier`}
            >
              {tier.ctaLabel}
            </KeyButton>
          )}
        </div>
      ))}
    </div>
  )
}
