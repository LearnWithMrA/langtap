// ─────────────────────────────────────────────
// File: types/user.types.ts
// Purpose: TypeScript type definitions for user profile, JLPT level,
//          input mode, and auth user. Used across services, stores, and hooks.
// Depends on: nothing
// ─────────────────────────────────────────────

// ── JLPT Level ────────────────────────────────

/** The five JLPT vocabulary levels. N5 is beginner, N1 is advanced. */
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

// ── Input Mode ────────────────────────────────

/** The three practice input modes. */
export type InputMode = 'tap' | 'type' | 'swipe'

// ── Auth User ─────────────────────────────────

/** Minimal auth user returned from Supabase getUser(). */
export type AuthUser = {
  id: string
  email: string | undefined
  isAnonymous: boolean
}

// ── User Profile ──────────────────────────────

/** Leaderboard visibility options. */
export type LeaderboardVisibility = 'public' | 'hidden'

/** Membership tiers. Writes are server-side only (guard trigger). */
export type MembershipTier = 'free' | 'monthly' | 'annual' | 'lifetime'

/** Row shape from the profiles table. */
export type UserProfile = {
  id: string
  username: string
  jlptLevel: JlptLevel
  inputMode: InputMode
  inputDirection: 'kana-to-romaji' | 'romaji-to-kana' | 'alternate'
  kotobaInput: 'readings' | 'kanji'
  hintsEnabled: boolean
  furiganaEnabled: boolean
  wordAudioEnabled: boolean
  keyClicksEnabled: boolean
  autoAdvance: 'instant' | 'delayed'
  onboardingComplete: boolean
  notificationsEnabled: boolean
  distanceUnit: 'metric' | 'imperial'
  leaderboardVisibility: LeaderboardVisibility
  userTz: string
  membershipTier: MembershipTier
  membershipExpiresAt: string | null
  usernameChangedAt: string | null
  guestImportedAt: string | null
  guestImportSkippedAt: string | null
  legacyImportedAt: string | null
  legacyImportSkippedAt: string | null
  createdAt: string
}
