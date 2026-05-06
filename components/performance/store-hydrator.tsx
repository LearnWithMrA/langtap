// ─────────────────────────────────────────────
// File: components/performance/store-hydrator.tsx
// Purpose: Hydrates skipHydration stores from localStorage, then
//          for signed-in users, loads server data via atomic RPCs
//          and performs epoch-aware merge. Gates the unlock store
//          bootstrap on hydration completion.
//          For guests: localStorage-only (no server load).
//          For signed-in users: epoch-aware merge:
//            - Server epoch > local: discard local, use server
//            - Server epoch === local: max-merge scores, union unlocks
//            - Server epoch < local: warning, use server
// Depends on: stores/mastery.store.ts, stores/word-mastery.store.ts,
//             stores/onboarding.store.ts, stores/unlock.store.ts,
//             stores/user.store.ts, services/mastery.service.ts,
//             services/word-mastery.service.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useMasteryStore } from '@/stores/mastery.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useUnlockStore } from '@/stores/unlock.store'
import { useUserStore } from '@/stores/user.store'
import { useAuth } from '@/hooks/useAuth'
import { loadMasterySnapshot } from '@/services/mastery.service'
import { loadWordMasterySnapshot } from '@/services/word-mastery.service'
import type { MasteryScoreMap } from '@/types/game.types'

// ── Helpers ───────────────────────────────────

function maxMerge(local: MasteryScoreMap, remote: MasteryScoreMap): MasteryScoreMap {
  const merged = { ...remote }
  for (const [key, localScore] of Object.entries(local)) {
    const remoteScore = merged[key] ?? 0
    merged[key] = Math.max(localScore, remoteScore)
  }
  return merged
}

function unionIds(local: readonly string[], remote: readonly string[]): string[] {
  return [...new Set([...local, ...remote])]
}

// ── Main export ───────────────────────────────

export function StoreHydrator(): ReactNode {
  const masteryHydrated = useMasteryStore((s) => s.hasHydrated)
  const wordHydrated = useWordMasteryStore((s) => s.hasHydrated)
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated)
  const learningScores = useMasteryStore((s) => s.learningScores)
  const bootstrapped = useUnlockStore((s) => s.bootstrapped)
  const { isAuthenticated, isGuest } = useAuth()
  const serverLoadAttempted = useRef(false)

  // Step 1: Trigger localStorage rehydration for skipHydration stores
  useEffect(() => {
    if (!masteryHydrated) useMasteryStore.persist.rehydrate()
  }, [masteryHydrated])

  useEffect(() => {
    if (!wordHydrated) useWordMasteryStore.persist.rehydrate()
  }, [wordHydrated])

  useEffect(() => {
    if (!onboardingHydrated) useOnboardingStore.persist.rehydrate()
  }, [onboardingHydrated])

  // Step 2: For signed-in users, load server data with epoch-aware merge
  useEffect(() => {
    if (!masteryHydrated || !wordHydrated) return
    if (!isAuthenticated || isGuest) {
      useUserStore.getState().setServerHydrated(true)
      return
    }
    if (serverLoadAttempted.current) return
    serverLoadAttempted.current = true

    async function loadServerData(): Promise<void> {
      const [masteryResult, wordResult] = await Promise.all([
        loadMasterySnapshot(),
        loadWordMasterySnapshot(),
      ])

      // Kana mastery: epoch-aware merge
      if (masteryResult.ok) {
        const server = masteryResult.data
        const localEpoch = useMasteryStore.getState().epoch

        if (server.epoch > localEpoch) {
          useMasteryStore.getState().replaceAll(server.scores, server.learningScores, server.epoch)
        } else if (server.epoch === localEpoch) {
          const localScores = useMasteryStore.getState().scores
          const localLearning = useMasteryStore.getState().learningScores
          const mergedScores = maxMerge(localScores, server.scores)
          const mergedLearning = maxMerge(localLearning, server.learningScores)
          useMasteryStore.getState().replaceAll(mergedScores, mergedLearning, server.epoch)
        } else {
          useMasteryStore.getState().replaceAll(server.scores, server.learningScores, server.epoch)
        }
      }

      // Word mastery: epoch-aware merge
      if (wordResult.ok) {
        const server = wordResult.data
        const localEpoch = useWordMasteryStore.getState().epoch

        if (server.epoch > localEpoch) {
          useWordMasteryStore.getState().replaceAll(server.scores, server.unlockIds, server.epoch)
        } else if (server.epoch === localEpoch) {
          const localScores = useWordMasteryStore.getState().scores
          const localUnlocks = [...useWordMasteryStore.getState().manuallyUnlockedWords]
          const mergedScores = maxMerge(localScores, server.scores)
          const mergedUnlocks = unionIds(localUnlocks, server.unlockIds)
          useWordMasteryStore.getState().replaceAll(mergedScores, mergedUnlocks, server.epoch)
        } else {
          useWordMasteryStore.getState().replaceAll(server.scores, server.unlockIds, server.epoch)
        }
      }

      useUserStore.getState().setServerHydrated(true)
    }

    loadServerData()
  }, [masteryHydrated, wordHydrated, isAuthenticated, isGuest])

  // Step 3: Bootstrap unlock store after local hydration
  useEffect(() => {
    if (!masteryHydrated || !onboardingHydrated || bootstrapped) return
    const manualIds = useOnboardingStore.getState().selectedCharacterIds
    useUnlockStore.getState().bootstrap(learningScores, manualIds)
  }, [masteryHydrated, onboardingHydrated, learningScores, bootstrapped])

  return null
}
