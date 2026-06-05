// ─────────────────────────────────────────────
// File: services/practice-session.service.ts
// Purpose: Wraps the record_practice_activity RPC. Records batched
//          practice completions for the streak mechanic and heatmap.
//          Client passes completion_id and characters_count only.
//          Server reads user_tz from profiles.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

export type PracticeActivityResult = {
  localDate: string
  charactersPracticed: number
  inserted: boolean
}

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ── Main export ───────────────────────────────

export async function recordPracticeActivity(
  completionId: string,
  charactersCount: number,
): Promise<ServiceResult<PracticeActivityResult>> {
  try {
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('record_practice_activity', {
      p_completion_id: completionId,
      p_characters_count: charactersCount,
    })

    if (error) {
      return { ok: false, error: error.message }
    }

    const row = data as { local_date: string; characters_practiced: number; inserted: boolean }

    return {
      ok: true,
      data: {
        localDate: row.local_date,
        charactersPracticed: row.characters_practiced,
        inserted: row.inserted,
      },
    }
  } catch {
    return { ok: false, error: 'Failed to record practice activity' }
  }
}
