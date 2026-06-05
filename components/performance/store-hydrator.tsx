// ─────────────────────────────────────────────
// File: components/performance/store-hydrator.tsx
// Purpose: Hydrates skipHydration stores from localStorage, then
//          for signed-in users, loads server data via atomic RPCs
//          and performs epoch-aware merge. Marks local winners
//          dirty so they sync on next checkpoint. Re-runs server
//          load on auth user change (resetStoresForAuthChange
//          clears hasHydrated, which re-triggers local rehydrate,
//          then this component detects the new auth state and
//          re-fetches from server).
// Depends on: stores, services, hooks/useAuth, hooks/useSettings
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
import { useSettingsSync } from '@/hooks/useSettings'
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

function findLocalWinners(local: MasteryScoreMap, remote: MasteryScoreMap): string[] {
  const winners: string[] = []
  for (const [key, localScore] of Object.entries(local)) {
    const remoteScore = remote[key] ?? 0
    if (localScore > remoteScore) winners.push(key)
  }
  return winners
}

// ── Main export ───────────────────────────────

export function StoreHydrator(): ReactNode {
  const masteryHydrated = useMasteryStore((s) => s.hasHydrated)
  const wordHydrated = useWordMasteryStore((s) => s.hasHydrated)
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated)
  const learningScores = useMasteryStore((s) => s.learningScores)
  const bootstrapped = useUnlockStore((s) => s.bootstrapped)
  const { isAuthenticated, isGuest } = useAuth()
  const isLoading = useUserStore((s) => s.isLoading)
  const lastUserIdRef = useRef<string | null>(null)
  const user = useUserStore((s) => s.user)

  useSettingsSync()

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

  const migrationPhaseComplete = useUserStore((s) => s.migrationPhaseComplete)

  // Step 2: For signed-in users, load server data with epoch-aware merge
  useEffect(() => {
    // Wait for auth to settle before deciding
    if (isLoading) return
    if (!masteryHydrated || !wordHydrated) return

    const currentUserId = user?.id ?? null

    if (!isAuthenticated || isGuest) {
      lastUserIdRef.current = null
      useUserStore.getState().setServerHydrated(true)
      return
    }

    // Wait for migration phase to complete before loading server data
    if (!migrationPhaseComplete) return

    // Skip if same user already loaded
    if (lastUserIdRef.current === currentUserId) return
    lastUserIdRef.current = currentUserId

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
          useMasteryStore.getState().clearAllDirty()
        } else if (server.epoch === localEpoch) {
          const localScores = useMasteryStore.getState().scores
          const localLearning = useMasteryStore.getState().learningScores
          const mergedScores = maxMerge(localScores, server.scores)
          const mergedLearning = maxMerge(localLearning, server.learningScores)
          useMasteryStore.getState().replaceAll(mergedScores, mergedLearning, server.epoch)

          // Mark local winners dirty so they sync on next checkpoint
          const scoreWinners = findLocalWinners(localScores, server.scores)
          const learningWinners = findLocalWinners(localLearning, server.learningScores)
          const allWinners = [...new Set([...scoreWinners, ...learningWinners])]
          if (allWinners.length > 0) {
            const dirtyMap = new Map<string, number>()
            for (const id of allWinners) dirtyMap.set(id, 1)
            // Set dirty versions for local winners (version 1 since store was just replaced)
            useMasteryStore.setState((state) => {
              const newDirty = new Map(state.dirtyVersions)
              for (const [id, ver] of dirtyMap) {
                if (!newDirty.has(id)) newDirty.set(id, ver)
              }
              return { dirtyVersions: newDirty }
            })
          }
        } else {
          useMasteryStore.getState().replaceAll(server.scores, server.learningScores, server.epoch)
        }

        // Kana unlocks: epoch-aware
        const localOnboardingUnlocks = useOnboardingStore.getState().selectedCharacterIds
        if (server.epoch > localEpoch) {
          // Reset deleted server unlocks; use only server state
          useUnlockStore
            .getState()
            .bootstrap(useMasteryStore.getState().learningScores, server.unlockIds)
        } else {
          const mergedUnlocks = unionIds(localOnboardingUnlocks, server.unlockIds)
          useUnlockStore
            .getState()
            .bootstrap(useMasteryStore.getState().learningScores, mergedUnlocks)
        }
      }

      // Word mastery: epoch-aware merge
      if (wordResult.ok) {
        const server = wordResult.data
        const localEpoch = useWordMasteryStore.getState().epoch

        if (server.epoch > localEpoch) {
          useWordMasteryStore.getState().replaceAll(server.scores, server.unlockIds, server.epoch)
          useWordMasteryStore.getState().clearAllDirty()
        } else if (server.epoch === localEpoch) {
          const localScores = useWordMasteryStore.getState().scores
          const localUnlocks = [...useWordMasteryStore.getState().manuallyUnlockedWords]
          const mergedScores = maxMerge(localScores, server.scores)
          const mergedUnlocks = unionIds(localUnlocks, server.unlockIds)
          useWordMasteryStore.getState().replaceAll(mergedScores, mergedUnlocks, server.epoch)

          // Mark local score winners dirty
          const winners = findLocalWinners(localScores, server.scores)
          if (winners.length > 0) {
            useWordMasteryStore.setState((state) => {
              const newDirty = new Map(state.dirtyVersions)
              for (const id of winners) {
                if (!newDirty.has(id)) newDirty.set(id, 1)
              }
              return { dirtyVersions: newDirty }
            })
          }
        } else {
          useWordMasteryStore.getState().replaceAll(server.scores, server.unlockIds, server.epoch)
        }
      }

      useUserStore.getState().setServerHydrated(true)
    }

    loadServerData()
  }, [
    isLoading,
    masteryHydrated,
    wordHydrated,
    isAuthenticated,
    isGuest,
    user,
    migrationPhaseComplete,
  ])

  // Step 3: Bootstrap unlock store after local hydration (guest path)
  useEffect(() => {
    if (!masteryHydrated || !onboardingHydrated || bootstrapped) return
    // Server path handles bootstrap in Step 2; this is the guest fallback
    if (isAuthenticated && !isGuest) return
    const manualIds = useOnboardingStore.getState().selectedCharacterIds
    useUnlockStore.getState().bootstrap(learningScores, manualIds)
  }, [masteryHydrated, onboardingHydrated, learningScores, bootstrapped, isAuthenticated, isGuest])

  return null
}
