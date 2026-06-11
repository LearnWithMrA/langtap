// ─────────────────────────────────────────────
// File: services/membership.service.ts
// Purpose: Membership status helpers. Pure derivation from the loaded
//          profile - membership writes are server-side only (guard
//          trigger on profiles). Stripe checkout/portal calls will be
//          added here in Sprint 19.
// Depends on: types/user.types.ts
// ─────────────────────────────────────────────

import type { MembershipTier, UserProfile } from '@/types/user.types'

// ── Types ─────────────────────────────────────

export type MembershipStatus = {
  tier: MembershipTier
  isActive: boolean
  label: string
  priceLabel: string
}

// ── Constants ─────────────────────────────────

const TIER_LABELS: Record<MembershipTier, { label: string; priceLabel: string }> = {
  free: { label: 'Free', priceLabel: '$0 / month' },
  monthly: { label: 'Monthly', priceLabel: '$2.99 / month' },
  annual: { label: 'Annual', priceLabel: '$19.99 / year' },
  lifetime: { label: 'Lifetime', priceLabel: 'One-time' },
}

// ── Main exports ──────────────────────────────

// True when the profile currently grants paid (uncapped) membership.
// Mirrors the server-side is_active_member() SQL function exactly.
export function isActiveMembership(
  tier: MembershipTier,
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  if (tier === 'lifetime') return true
  if (tier === 'monthly' || tier === 'annual') {
    return expiresAt !== null && new Date(expiresAt).getTime() > now.getTime()
  }
  return false
}

// Derives the display status for the membership card.
// An expired paid tier displays as Free.
export function getMembershipStatus(
  profile: Pick<UserProfile, 'membershipTier' | 'membershipExpiresAt'> | null,
  now: Date = new Date(),
): MembershipStatus {
  const tier = profile?.membershipTier ?? 'free'
  const isActive = isActiveMembership(tier, profile?.membershipExpiresAt ?? null, now)
  const effectiveTier: MembershipTier = isActive ? tier : 'free'
  return {
    tier: effectiveTier,
    isActive,
    label: TIER_LABELS[effectiveTier].label,
    priceLabel: TIER_LABELS[effectiveTier].priceLabel,
  }
}
