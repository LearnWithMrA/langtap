// ─────────────────────────────────────────────
// File: components/performance/practice-data-preloader.tsx
// Purpose: Pre-warms word bank and practice data into module cache.
//          Word banks (content): all 5 levels loaded eagerly (~290 KB
//          gzip). Kotoba level maps (progression): only the player's
//          selected JLPT level, loaded once the authoritative level
//          is known. For authenticated users, waits for profile.
//          For guests, uses onboarding store. Renders nothing.
// Depends on: data/words/word-bank-loader.ts,
//             stores/user.store.ts, stores/onboarding.store.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { preloadAllWordBanks, loadKotobaLevels } from '@/data/words/word-bank-loader'
import { useUserStore } from '@/stores/user.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useAuth } from '@/hooks/useAuth'
import type { JlptLevel } from '@/types/user.types'

// ── Component ─────────────────────────────────

export function PracticeDataPreloader(): ReactNode {
  const wordBanksRef = useRef(false)
  const kotobaRef = useRef<JlptLevel | null>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const isProfileLoaded = useUserStore((s) => s.isProfileLoaded)
  const profileLevel = useUserStore((s) => s.profile?.jlptLevel)
  const onboardingLevel = useOnboardingStore((s) => s.jlptLevel) as JlptLevel | null

  const levelReady = authLoading ? false : isAuthenticated ? isProfileLoaded : true
  const resolvedLevel: JlptLevel | null = isAuthenticated ? (profileLevel ?? null) : onboardingLevel

  useEffect(() => {
    if (wordBanksRef.current) return
    wordBanksRef.current = true
    void preloadAllWordBanks()
  }, [])

  useEffect(() => {
    if (!levelReady || !resolvedLevel) return
    if (kotobaRef.current === resolvedLevel) return
    kotobaRef.current = resolvedLevel
    void loadKotobaLevels(resolvedLevel)
  }, [levelReady, resolvedLevel])

  return null
}
