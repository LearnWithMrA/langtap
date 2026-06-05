// ─────────────────────────────────────────────
// File: services/streak.service.ts
// Purpose: Loads practice summary (date + count pairs) from the
//          practice_sessions table. Returns server-derived local
//          dates for streak computation. Does not compute streak
//          state itself; the engine pure functions handle that.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

export type PracticeDaySummary = {
  date: string
  count: number
}

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ── Main export ───────────────────────────────

export async function loadPracticeSummary(
  userId: string,
  since: string,
): Promise<ServiceResult<PracticeDaySummary[]>> {
  try {
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('local_date, characters_practiced')
      .eq('user_id', userId)
      .gte('local_date', since)
      .order('local_date', { ascending: true })

    if (error) {
      return { ok: false, error: error.message }
    }

    const summary: PracticeDaySummary[] = (data ?? []).map(
      (row: { local_date: string; characters_practiced: number }) => ({
        date: row.local_date,
        count: row.characters_practiced,
      }),
    )

    return { ok: true, data: summary }
  } catch {
    return { ok: false, error: 'Failed to load practice summary' }
  }
}
