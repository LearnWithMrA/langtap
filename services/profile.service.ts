// ─────────────────────────────────────────────
// File: services/profile.service.ts
// Purpose: Read and write user profile data from Supabase.
//          Maps snake_case database columns to camelCase TypeScript types.
//          Never called directly from components; go through hooks.
// Depends on: services/supabase-browser.ts, types/user.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { UserProfile } from '@/types/user.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

// Raw row shape from Supabase (snake_case)
type ProfileRow = {
  id: string
  username: string
  jlpt_level: string
  input_mode: string
  onboarding_complete: boolean
  notifications_enabled: boolean
  distance_unit: string
  leaderboard_visibility: string
  user_tz: string
  username_changed_at: string | null
  guest_imported_at: string | null
  guest_import_skipped_at: string | null
  legacy_imported_at: string | null
  legacy_import_skipped_at: string | null
  created_at: string
}

// ── Helpers ───────────────────────────────────

function mapRowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    jlptLevel: row.jlpt_level as UserProfile['jlptLevel'],
    inputMode: row.input_mode as UserProfile['inputMode'],
    onboardingComplete: row.onboarding_complete,
    notificationsEnabled: row.notifications_enabled,
    distanceUnit: row.distance_unit as UserProfile['distanceUnit'],
    leaderboardVisibility: row.leaderboard_visibility as UserProfile['leaderboardVisibility'],
    userTz: row.user_tz,
    usernameChangedAt: row.username_changed_at,
    guestImportedAt: row.guest_imported_at,
    guestImportSkippedAt: row.guest_import_skipped_at,
    legacyImportedAt: row.legacy_imported_at,
    legacyImportSkippedAt: row.legacy_import_skipped_at,
    createdAt: row.created_at,
  }
}

// ── Main exports ──────────────────────────────

export async function loadProfile(userId: string): Promise<ServiceResult<UserProfile>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, jlpt_level, input_mode, onboarding_complete, notifications_enabled, distance_unit, leaderboard_visibility, user_tz, username_changed_at, guest_imported_at, guest_import_skipped_at, legacy_imported_at, legacy_import_skipped_at, created_at',
    )
    .eq('id', userId)
    .single()

  if (error) {
    return { ok: false, error: 'Failed to load profile.' }
  }

  return { ok: true, data: mapRowToProfile(data as ProfileRow) }
}

export async function updateProfile(
  userId: string,
  updates: Partial<{
    username: string
    jlpt_level: string
    input_mode: string
    onboarding_complete: boolean
    notifications_enabled: boolean
    distance_unit: string
    leaderboard_visibility: string
    username_changed_at: string
  }>,
): Promise<ServiceResult<void>> {
  const supabase = createBrowserSupabaseClient()

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)

  if (error) {
    return { ok: false, error: 'Failed to update profile.' }
  }

  return { ok: true, data: undefined }
}

// ── Username change (via RPC) ────────────────

export type UsernameChangeResult =
  | { ok: true }
  | { ok: false; errorCode: string; nextAllowedAt?: string }

export async function changeUsername(newUsername: string): Promise<UsernameChangeResult> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('change_username', {
    p_new_username: newUsername,
  })

  if (error) {
    return { ok: false, errorCode: 'network' }
  }

  const d = data as Record<string, unknown> | null
  if (d && d['ok'] === true) {
    return { ok: true }
  }

  const errorCode = typeof d?.['error_code'] === 'string' ? d['error_code'] : 'unknown'
  const nextAllowedAt =
    typeof d?.['next_allowed_at'] === 'string' ? d['next_allowed_at'] : undefined

  return { ok: false, errorCode, nextAllowedAt }
}
