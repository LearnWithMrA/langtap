// ─────────────────────────────────────────────
// File: services/counter.service.ts
// Purpose: Best-effort sync of word counters to Supabase.
//          Counters are session-scoped and in-memory only on the
//          client. No epoch, no row lock, no retry on restart.
//          Plain client upsert (not RPC) since counters are not
//          security-critical and do not participate in the epoch model.
// Depends on: services/supabase-browser.ts, types/word.types.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { WordCounterMap } from '@/types/word.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ── Sync (best-effort) ────────────────────────

export async function syncCounters(
  userId: string,
  counters: WordCounterMap,
): Promise<ServiceResult<void>> {
  const ids = Object.keys(counters)
  if (ids.length === 0) {
    return { ok: true, data: undefined }
  }

  const supabase = createBrowserSupabaseClient()

  const rows = ids.map((wordId) => ({
    user_id: userId,
    word_id: wordId,
    count: counters[wordId],
  }))

  const { error } = await supabase
    .from('word_counters')
    .upsert(rows, { onConflict: 'user_id,word_id' })

  if (error) {
    return { ok: false, error: 'Failed to sync word counters.' }
  }

  return { ok: true, data: undefined }
}
