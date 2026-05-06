// ---------------------------------------------------------
// File: services/leaderboard.service.ts
// Purpose: Server-derived leaderboard scoring and ranked data.
//          All writes go through security-definer RPCs that
//          verify attempts against stored expected answers.
//          No client-provided scores.
// Depends on: services/supabase-browser.ts,
//             types/leaderboard.types.ts
// ---------------------------------------------------------

import { createBrowserSupabaseClient } from '@/services/supabase-browser'
import type {
  LeaderboardBoard,
  LeaderboardEntry,
  LeaderboardAttemptEntry,
  GameType,
  TimePeriod,
} from '@/types/leaderboard.types'
import type { InputMode } from '@/types/user.types'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

type LeaderboardRpcRow = {
  rank: number
  username: string
  score: number
  is_current_user: boolean
}

// ── Session RPCs ──────────────────────────────

export async function startLeaderboardSession(input: {
  gameType: GameType
  inputMode: InputMode
  wordId: string
  kotobaInput: 'readings' | 'kanji' | null
}): Promise<ServiceResult<string | null>> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('start_leaderboard_session', {
    p_game_type: input.gameType,
    p_input_mode: input.inputMode,
    p_word_id: input.wordId,
    p_kotoba_input: input.kotobaInput,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: data as string | null }
}

export async function finalizeLeaderboardSession(input: {
  sessionId: string
  attempts: LeaderboardAttemptEntry[]
}): Promise<ServiceResult<void>> {
  const supabase = createBrowserSupabaseClient()

  const { error } = await supabase.rpc('finalize_leaderboard_session', {
    p_session_id: input.sessionId,
    p_attempts: input.attempts,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, data: undefined }
}

// ── Read RPC ──────────────────────────────────

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
