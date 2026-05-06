// ---------------------------------------------------------
// File: services/leaderboard.service.ts
// Purpose: Record leaderboard completion events and fetch
//          ranked leaderboard data. All writes go through
//          server-side security-definer RPCs. No direct
//          table access from the client.
// Depends on: services/supabase-browser.ts,
//             types/leaderboard.types.ts
// ---------------------------------------------------------

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type { LeaderboardBoard, LeaderboardEntry, GameType, TimePeriod } from '@/types/leaderboard.types'
import type { InputMode } from '@/types/user.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

type LeaderboardRpcRow = {
  rank: number
  username: string
  score: number
  is_current_user: boolean
}

// ── Main exports ──────────────────────────────

export async function recordLeaderboardCompletion(input: {
  eventId: string
  gameType: GameType
  inputMode: InputMode
  scoreDelta: number
}): Promise<ServiceResult<void>> {
  const supabase = createBrowserSupabaseClient()

  const { error } = await supabase.rpc('record_leaderboard_completion', {
    p_event_id: input.eventId,
    p_game_type: input.gameType,
    p_input_mode: input.inputMode,
    p_score_delta: input.scoreDelta,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: undefined }
}

export async function loadLeaderboard(
  gameType: GameType,
  inputMode: InputMode,
  period: TimePeriod,
): Promise<ServiceResult<LeaderboardBoard>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_game_type: gameType,
    p_input_mode: inputMode,
    p_period: period,
    p_limit: 50,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const rows = (data as LeaderboardRpcRow[] | null) ?? []

  const entries: LeaderboardEntry[] = []
  let currentUserPinned: LeaderboardEntry | null = null

  for (const row of rows) {
    const entry: LeaderboardEntry = {
      rank: row.rank,
      username: row.username,
      score: row.score,
      isCurrentUser: row.is_current_user,
    }

    if (row.is_current_user && row.rank > 50) {
      currentUserPinned = entry
    } else {
      entries.push(entry)
    }
  }

  return { ok: true, data: { entries, currentUserPinned } }
}
