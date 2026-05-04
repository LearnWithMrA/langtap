// ─────────────────────────────────────────────
// File: components/performance/store-hydrator.tsx
// Purpose: Hydrates skipHydration stores (mastery, word mastery,
//          onboarding) once at layout level, then bootstraps the
//          unlock store so all pages get pre-computed unlock state
//          without re-initialising. Gates bootstrap on both mastery
//          and onboarding hydration to prevent stale state.
// Depends on: stores/mastery.store.ts, stores/word-mastery.store.ts,
//             stores/onboarding.store.ts, stores/unlock.store.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useMasteryStore } from '@/stores/mastery.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useUnlockStore } from '@/stores/unlock.store'

export function StoreHydrator(): ReactNode {
  const masteryHydrated = useMasteryStore((s) => s.hasHydrated)
  const wordHydrated = useWordMasteryStore((s) => s.hasHydrated)
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated)
  const learningScores = useMasteryStore((s) => s.learningScores)
  const bootstrapped = useUnlockStore((s) => s.bootstrapped)

  useEffect(() => {
    if (!masteryHydrated) {
      useMasteryStore.persist.rehydrate()
    }
  }, [masteryHydrated])

  useEffect(() => {
    if (!wordHydrated) {
      useWordMasteryStore.persist.rehydrate()
    }
  }, [wordHydrated])

  useEffect(() => {
    if (!onboardingHydrated) {
      useOnboardingStore.persist.rehydrate()
    }
  }, [onboardingHydrated])

  useEffect(() => {
    if (!masteryHydrated || !onboardingHydrated || bootstrapped) return
    const manualIds = useOnboardingStore.getState().selectedCharacterIds
    useUnlockStore.getState().bootstrap(learningScores, manualIds)
  }, [masteryHydrated, onboardingHydrated, learningScores, bootstrapped])

  return null
}
