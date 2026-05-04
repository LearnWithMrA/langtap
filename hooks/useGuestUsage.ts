// ─────────────────────────────────────────────
// File: hooks/useGuestUsage.ts
// Purpose: Server-side guest trial cap hook. Ensures anonymous
//          Supabase session, loads usage from server, exposes
//          cap state and increment function. Replaces localStorage
//          guest-distance.store as the cap authority.
// Depends on: services/guest-usage.service.ts, hooks/useAuth.ts
// ─────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  ensureGuestSession,
  loadGuestUsage,
  incrementGuestUsage,
  type GuestUsage,
} from '@/services/guest-usage.service'
import { GUEST_TRIAL_DISTANCE_CAP } from '@/engine/constants'

// ── Types ─────────────────────────────────────

type UseGuestUsageReturn = {
  isLoading: boolean
  isOverCap: boolean
  usage: GuestUsage | null
  increment: (gameType: 'kana' | 'kotoba', metres: number) => Promise<void>
}

// ── Hook ──────────────────────────────────────

export function useGuestUsage(): UseGuestUsageReturn {
  const { isGuest, isLoading: authLoading, isAnonymous } = useAuth()
  const [usage, setUsage] = useState<GuestUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initRef = useRef(false)

  useEffect(() => {
    if (authLoading || initRef.current) return
    if (!isGuest) {
      setUsage(null)
      setIsLoading(false)
      return
    }

    let mounted = true
    initRef.current = true

    async function init(): Promise<void> {
      const sessionResult = await ensureGuestSession()
      if (!mounted || !sessionResult.ok) {
        if (mounted) setIsLoading(false)
        return
      }

      const usageResult = await loadGuestUsage()
      if (!mounted) return

      if (usageResult.ok) {
        setUsage(usageResult.data)
      }
      setIsLoading(false)
    }

    init()
    return (): void => {
      mounted = false
    }
  }, [authLoading, isGuest])

  const totalDistance = usage ? usage.kanaDistance + usage.kotobaDistance : 0
  const isOverCap = isGuest && totalDistance >= GUEST_TRIAL_DISTANCE_CAP

  const increment = useCallback(
    async (gameType: 'kana' | 'kotoba', metres: number): Promise<void> => {
      if (!isGuest || !isAnonymous || isOverCap) return
      const result = await incrementGuestUsage(gameType, metres)
      if (result.ok) {
        setUsage(result.data)
      }
    },
    [isGuest, isAnonymous, isOverCap],
  )

  return {
    isLoading: isLoading || authLoading,
    isOverCap,
    usage,
    increment,
  }
}
