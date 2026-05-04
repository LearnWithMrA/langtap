// ─────────────────────────────────────────────
// File: services/guest-usage.service.ts
// Purpose: Guest trial cap operations via Supabase RPCs.
//          Ensures anonymous session, loads/increments usage
//          server-side. All writes go through RPCs, never direct
//          table access. The 30m combined cap is enforced by the
//          database, not the client.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

export type GuestUsage = {
  kanaDistance: number
  kotobaDistance: number
  cappedAt: string | null
}

type RpcRow = {
  kana_distance: number
  kotoba_distance: number
  capped_at: string | null
}

// ── Helpers ───────────────────────────────────

function mapRow(row: RpcRow): GuestUsage {
  return {
    kanaDistance: row.kana_distance,
    kotobaDistance: row.kotoba_distance,
    cappedAt: row.capped_at,
  }
}

// ── Service functions ─────────────────────────

export async function ensureGuestSession(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createBrowserSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) return { ok: true }

  const { error } = await supabase.auth.signInAnonymously()
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function loadGuestUsage(): Promise<
  { ok: true; data: GuestUsage } | { ok: false; error: string }
> {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase.rpc('get_or_create_guest_usage')

  if (error) return { ok: false, error: error.message }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { ok: true, data: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null } }
  }

  const row = Array.isArray(data) ? data[0] : data
  return { ok: true, data: mapRow(row as RpcRow) }
}

export async function incrementGuestUsage(
  gameType: 'kana' | 'kotoba',
  metres: number,
): Promise<{ ok: true; data: GuestUsage } | { ok: false; error: string }> {
  if (metres <= 0) {
    return loadGuestUsage()
  }

  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase.rpc('increment_guest_usage', {
    p_game_type: gameType,
    p_metres: Math.floor(metres),
  })

  if (error) return { ok: false, error: error.message }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { ok: true, data: { kanaDistance: 0, kotobaDistance: 0, cappedAt: null } }
  }

  const row = Array.isArray(data) ? data[0] : data
  return { ok: true, data: mapRow(row as RpcRow) }
}
