// ─────────────────────────────────────────────
// File: services/unlock.service.ts
// Purpose: Read and write manual character unlocks in Supabase.
//          Used during onboarding (step 2b bulk unlock) and from
//          the Dojo screen (individual unlocks). Batch insert for
//          onboarding, single insert for Dojo.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ── Main exports ──────────────────────────────

export async function loadManualUnlocks(userId: string): Promise<ServiceResult<string[]>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase
    .from('manual_unlocks')
    .select('character_id')
    .eq('user_id', userId)

  if (error) {
    return { ok: false, error: 'Failed to load unlocks.' }
  }

  const ids = (data ?? []).map((row: { character_id: string }) => row.character_id)
  return { ok: true, data: ids }
}

export async function syncManualUnlocks(
  userId: string,
  characterIds: string[],
): Promise<ServiceResult<void>> {
  if (characterIds.length === 0) {
    return { ok: true, data: undefined }
  }

  const supabase = createBrowserSupabaseClient()

  const rows = characterIds.map((id) => ({
    user_id: userId,
    character_id: id,
  }))

  const { error } = await supabase
    .from('manual_unlocks')
    .upsert(rows, { onConflict: 'user_id,character_id' })

  if (error) {
    return { ok: false, error: 'Failed to save unlocks.' }
  }

  return { ok: true, data: undefined }
}

export async function addManualUnlock(
  userId: string,
  characterId: string,
): Promise<ServiceResult<void>> {
  return syncManualUnlocks(userId, [characterId])
}
