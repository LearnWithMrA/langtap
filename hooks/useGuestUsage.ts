// ─────────────────────────────────────────────
// File: hooks/useGuestUsage.ts
// Purpose: Server-side guest trial cap hook. Reads from a shared
//          Zustand store so all consumers (PracticeClient wrapper,
//          ActivePracticeClient, GuestBanner) see the same cap
//          state. Triggers init once per app lifecycle when a guest
//          visits a cap-aware surface. Does not move
//          ensureGuestSession() into global auth init to avoid
//          creating anonymous Supabase users on every route.
// Depends on: stores/guest-usage.store.ts,
//             services/guest-usage.service.ts, hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGuestUsageStore } from '@/stores/guest-usage.store'
import {
  ensureGuestSession,
  loadGuestUsage,
  incrementGuestUsage,
} from '@/services/guest-usage.service'
import { GUEST_TRIAL_DISTANCE_CAP } from '@/engine/constants'
import {
  getGuestSessionMarker,
  setGuestSessionMarker,
  setGuestSnapshotMarker,
} from '@/stores/scoped-storage'

// ── Types ─────────────────────────────────────

type UseGuestUsageReturn = {
  isLoading: boolean
  isOverCap: boolean
  usage: ReturnType<typeof useGuestUsageStore.getState>['usage']
  increment: (gameType: 'kana' | 'kotoba', metres: number) => Promise<void>
}

// ── Hook ──────────────────────────────────────

export function useGuestUsage(): UseGuestUsageReturn {
  const { isGuest, isLoading: authLoading, isAnonymous } = useAuth()
  const usage = useGuestUsageStore((s) => s.usage)
  const storeLoading = useGuestUsageStore((s) => s.isLoading)
  const isInitialized = useGuestUsageStore((s) => s.isInitialized)

  useEffect(() => {
    if (authLoading || isInitialized) return
    if (!isGuest) {
      useGuestUsageStore.getState().setLoading(false)
      useGuestUsageStore.getState().markInitialized()
      return
    }

    let mounted = true

    async function init(): Promise<void> {
      const sessionResult = await ensureGuestSession()

      // Set dual session markers for guest-to-account auto-import
      if (sessionResult.ok && !getGuestSessionMarker()) {
        const markerId = crypto.randomUUID()
        setGuestSessionMarker(markerId)
        setGuestSnapshotMarker(markerId)
      }

      if (!mounted || !sessionResult.ok) {
        if (mounted) {
          useGuestUsageStore.getState().setLoading(false)
          useGuestUsageStore.getState().markInitialized()
        }
        return
      }

      const usageResult = await loadGuestUsage()
      if (!mounted) return

      if (usageResult.ok) {
        useGuestUsageStore.getState().setUsage(usageResult.data)
      }
      useGuestUsageStore.getState().setLoading(false)
      useGuestUsageStore.getState().markInitialized()
    }

    init()
    return (): void => {
      mounted = false
    }
  }, [authLoading, isGuest, isInitialized])

  const totalDistance = usage ? usage.kanaDistance + usage.kotobaDistance : 0
  const isOverCap = isGuest && totalDistance >= GUEST_TRIAL_DISTANCE_CAP

  const increment = useCallback(
    async (gameType: 'kana' | 'kotoba', metres: number): Promise<void> => {
      if (!isGuest || !isAnonymous || isOverCap) return
      const result = await incrementGuestUsage(gameType, metres)
      if (result.ok) {
        useGuestUsageStore.getState().setUsage(result.data)
      }
    },
    [isGuest, isAnonymous, isOverCap],
  )

  return {
    isLoading: storeLoading || authLoading,
    isOverCap,
    usage,
    increment,
  }
}
