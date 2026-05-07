// ─────────────────────────────────────────────
// File: hooks/useDailyCap.ts
// Purpose: Daily distance cap hook for signed-in permanent users.
//          Loads today's usage on mount via get_daily_usage RPC.
//          Exposes an increment function that calls
//          increment_daily_distance RPC per prompt completion.
//          State is shared via a Zustand store so the PracticeClient
//          gate and ActivePracticeClient see cap transitions
//          immediately.
//          Guests use the guest cap path, not this hook.
// Depends on: stores/daily-cap.store.ts, services/supabase-browser.ts,
//             hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDailyCapStore } from '@/stores/daily-cap.store'
import type { DailyCapState } from '@/stores/daily-cap.store'
import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

type UseDailyCapReturn = {
  isLoading: boolean
  isCapped: boolean
  capState: DailyCapState | null
  increment: (metres: number, completionId: string) => Promise<void>
}

// ── Helpers ───────────────────────────────────

function parseRpcResponse(data: unknown): DailyCapState | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (typeof d['total_today'] !== 'number') return null
  return {
    totalToday: d['total_today'] as number,
    isCapped: d['is_capped'] === true,
    capAmount: typeof d['cap_amount'] === 'number' ? (d['cap_amount'] as number) : 100,
    capEnabled: d['cap_enabled'] === true,
  }
}

// ── Hook ──────────────────────────────────────

export function useDailyCap(): UseDailyCapReturn {
  const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth()
  const capState = useDailyCapStore((s) => s.capState)
  const storeLoading = useDailyCapStore((s) => s.isLoading)
  const isInitialized = useDailyCapStore((s) => s.isInitialized)

  useEffect(() => {
    if (authLoading || isInitialized) return

    if (!isAuthenticated || isGuest) {
      useDailyCapStore.getState().setLoading(false)
      useDailyCapStore.getState().markInitialized()
      return
    }

    let mounted = true

    async function load(): Promise<void> {
      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.rpc('get_daily_usage')

      if (!mounted) return

      if (!error && data) {
        const parsed = parseRpcResponse(data)
        if (parsed) useDailyCapStore.getState().setCapState(parsed)
      }
      useDailyCapStore.getState().setLoading(false)
      useDailyCapStore.getState().markInitialized()
    }

    load()
    return (): void => {
      mounted = false
    }
  }, [authLoading, isAuthenticated, isGuest, isInitialized])

  const increment = useCallback(
    async (metres: number, completionId: string): Promise<void> => {
      if (!isAuthenticated || isGuest) return
      if (useDailyCapStore.getState().capState?.isCapped) return

      const floored = Math.floor(metres)
      if (floored <= 0) return

      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.rpc('increment_daily_distance', {
        p_metres: floored,
        p_completion_id: completionId,
      })

      if (!error && data) {
        const parsed = parseRpcResponse(data)
        if (parsed) useDailyCapStore.getState().setCapState(parsed)
      }
    },
    [isAuthenticated, isGuest],
  )

  return {
    isLoading: storeLoading || authLoading,
    isCapped: capState?.isCapped ?? false,
    capState,
    increment,
  }
}
