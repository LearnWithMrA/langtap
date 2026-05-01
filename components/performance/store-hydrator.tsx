// ─────────────────────────────────────────────
// File: components/performance/store-hydrator.tsx
// Purpose: Hydrates skipHydration stores (mastery, word mastery,
//          onboarding) once at layout level, then bootstraps the
//          unlock store so all pages get pre-computed unlock state
//          without re-initialising.
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
  const hasHydrated = useMasteryStore((s) => s.hasHydrated)
  const wordHasHydrated = useWordMasteryStore((s) => s.hasHydrated)
  const scores = useMasteryStore((s) => s.scores)
  const bootstrapped = useUnlockStore((s) => s.bootstrapped)

  useEffect(() => {
    if (!hasHydrated) {
      useMasteryStore.persist.rehydrate()
    }
  }, [hasHydrated])

  useEffect(() => {
    if (!wordHasHydrated) {
      useWordMasteryStore.persist.rehydrate()
    }
  }, [wordHasHydrated])

  useEffect(() => {
    useOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (!hasHydrated || bootstrapped) return
    const manualIds = useOnboardingStore.getState().selectedCharacterIds
    const resolved = useUnlockStore.getState().bootstrap(scores, manualIds)
    if (resolved.length !== manualIds.length) {
      useOnboardingStore.getState().setSelectedBulk(resolved as string[])
    }
  }, [hasHydrated, scores, bootstrapped])

  return null
}
