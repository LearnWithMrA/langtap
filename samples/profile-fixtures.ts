// ─────────────────────────────────────────────
// File: samples/profile-fixtures.ts
// Purpose: Mock profile data for the Profile screen visual shell.
//          Three presets:
//            - FREE_USER: standard logged-in user on the free plan
//            - GUEST: unauthenticated guest
//            - RECENTLY_CHANGED: user who changed username recently
//              (30-day cooldown active)
//          Used while the real user store (Sprint 3) and Supabase
//          persistence are not yet wired up.
// Depends on: none (self-contained mock data)
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

export type MembershipTier = 'free' | 'regular' | 'unlimited'

export type ProfileFixture = {
  readonly isGuest: boolean
  readonly username: string
  readonly email: string | null
  readonly memberSince: string
  readonly tier: MembershipTier
  readonly usernameChangedAt: string | null
  readonly distanceUnit: 'metric' | 'imperial'
}

export type ProfileFixtureKey = 'free_user' | 'guest' | 'recently_changed'

// ── Fixtures ──────────────────────────────────

const FREE_USER: ProfileFixture = {
  isGuest: false,
  username: 'tanuki42',
  email: 'tanuki42@example.com',
  memberSince: '2026-03-15',
  tier: 'free',
  usernameChangedAt: null,
  distanceUnit: 'metric',
}

const GUEST: ProfileFixture = {
  isGuest: true,
  username: 'user_a1b2c3d4',
  email: null,
  memberSince: new Date().toISOString().slice(0, 10),
  tier: 'free',
  usernameChangedAt: null,
  distanceUnit: 'metric',
}

const RECENTLY_CHANGED: ProfileFixture = {
  isGuest: false,
  username: 'sakura_rain',
  email: 'sakura@example.com',
  memberSince: '2026-01-10',
  tier: 'free',
  usernameChangedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  distanceUnit: 'imperial',
}

const FIXTURES: Record<ProfileFixtureKey, ProfileFixture> = {
  free_user: FREE_USER,
  guest: GUEST,
  recently_changed: RECENTLY_CHANGED,
}

export function getProfileFixture(key: ProfileFixtureKey): ProfileFixture {
  return FIXTURES[key]
}
