// ─────────────────────────────────────────────
// File: services/reset.service.ts
// Purpose: Client wrappers for the four reset RPCs. Non-optimistic:
//          returns the new epoch on success, caller updates local
//          state only after RPC confirms. Rejects anonymous users
//          server-side.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

type ResetResult = { newEpoch: number }

// ── Helpers ───────────────────────────────────

function parseResetResponse(data: unknown): ResetResult | null {
  if (data === null || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d['new_epoch'] !== 'number') return null
  return { newEpoch: d['new_epoch'] as number }
}

// ── Main exports ──────────────────────────────

export async function resetAllMastery(): Promise<ServiceResult<ResetResult>> {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase.rpc('reset_all_mastery')

  if (error) return { ok: false, error: `Kana reset failed (${error.code}): ${error.message}` }

  const result = parseResetResponse(data)
  if (!result) return { ok: false, error: 'Kana reset failed: invalid response from server.' }

  return { ok: true, data: result }
}

export async function resetAllWordMastery(): Promise<ServiceResult<ResetResult>> {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase.rpc('reset_all_word_mastery')

  if (error) return { ok: false, error: `Word reset failed (${error.code}): ${error.message}` }

  const result = parseResetResponse(data)
  if (!result) return { ok: false, error: 'Word reset failed: invalid response from server.' }

  return { ok: true, data: result }
}
