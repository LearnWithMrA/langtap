// ---------------------------------------------------------
// File: hooks/useLeaderboard.ts
// Purpose: Fetches ranked leaderboard data from Supabase via
//          the get_leaderboard RPC. Caches results per param
//          combination with a 60-second TTL.
// Depends on: services/leaderboard.service.ts,
//             types/leaderboard.types.ts
// ---------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import { loadLeaderboard } from '@/services/leaderboard.service'
import type { LeaderboardBoard, GameType, TimePeriod } from '@/types/leaderboard.types'
import type { InputMode } from '@/types/user.types'

// ── Cache ─────────────────────────────────────

type CacheEntry = {
  board: LeaderboardBoard
  fetchedAt: number
}

const CACHE_TTL_MS = 60_000
const cache = new Map<string, CacheEntry>()

function cacheKey(gameType: GameType, inputMode: InputMode, period: TimePeriod): string {
  return `${gameType}-${inputMode}-${period}`
}

function getCached(key: string): LeaderboardBoard | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.board
}

// ── Hook ──────────────────────────────────────

export function useLeaderboard(
  gameType: GameType,
  inputMode: InputMode,
  period: TimePeriod,
): {
  board: LeaderboardBoard | null
  isLoading: boolean
  error: string | null
} {
  const key = cacheKey(gameType, inputMode, period)
  const cached = getCached(key)

  const [board, setBoard] = useState<LeaderboardBoard | null>(cached)
  const [isLoading, setIsLoading] = useState(cached === null)
  const [error, setError] = useState<string | null>(null)
  const activeKeyRef = useRef(key)

  useEffect(() => {
    activeKeyRef.current = key

    const hit = getCached(key)
    if (hit) {
      setBoard(hit)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    void loadLeaderboard(gameType, inputMode, period).then((result) => {
      if (activeKeyRef.current !== key) return

      if (result.ok) {
        cache.set(key, { board: result.data, fetchedAt: Date.now() })
        setBoard(result.data)
        setError(null)
      } else {
        setError(result.error)
        setBoard(null)
      }
      setIsLoading(false)
    })
  }, [key, gameType, inputMode, period])

  return { board, isLoading, error }
}
