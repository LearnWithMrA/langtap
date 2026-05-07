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

// Raw row from Supabase. Uses Record so missing columns (from
// unapplied migrations) don't crash the mapper.
type ProfileRow = Record<string, unknown>

// ── Helpers ───────────────────────────────────

function str(row: ProfileRow, key: string, fallback: string): string {
  const v = row[key]
  return typeof v === 'string' ? v : fallback
}

function bool(row: ProfileRow, key: string, fallback: boolean): boolean {
  const v = row[key]
  return typeof v === 'boolean' ? v : fallback
}

function strNull(row: ProfileRow, key: string): string | null {
  const v = row[key]
  return typeof v === 'string' ? v : null
}

function mapRowToProfile(row: ProfileRow): UserProfile {
  return {
    id: str(row, 'id', ''),
    username: str(row, 'username', ''),
    jlptLevel: str(row, 'jlpt_level', 'N5') as UserProfile['jlptLevel'],
    inputMode: str(row, 'input_mode', 'tap') as UserProfile['inputMode'],
    onboardingComplete: bool(row, 'onboarding_complete', false),
    notificationsEnabled: bool(row, 'notifications_enabled', false),
    distanceUnit: str(row, 'distance_unit', 'metric') as UserProfile['distanceUnit'],
    leaderboardVisibility: str(
      row,
      'leaderboard_visibility',
      'public',
    ) as UserProfile['leaderboardVisibility'],
    userTz: str(row, 'user_tz', 'UTC'),
    usernameChangedAt: strNull(row, 'username_changed_at'),
    guestImportedAt: strNull(row, 'guest_imported_at'),
    guestImportSkippedAt: strNull(row, 'guest_import_skipped_at'),
    legacyImportedAt: strNull(row, 'legacy_imported_at'),
    legacyImportSkippedAt: strNull(row, 'legacy_import_skipped_at'),
    createdAt: str(row, 'created_at', new Date().toISOString()),
  }
}

// ── Main exports ──────────────────────────────

export async function loadProfile(userId: string): Promise<ServiceResult<UserProfile>> {
  const supabase = createBrowserSupabaseClient()

  // SELECT * so missing columns from unapplied migrations don't
  // cause a PostgREST 400. The mapper provides safe defaults.
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

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
