// ─────────────────────────────────────────────
// File: hooks/useResetActions.ts
// Purpose: Encapsulates all reset operations (per-domain and factory).
//          Owns the service calls, store updates, and localStorage
//          cleanup. The component only handles UI state.
//          Non-optimistic: local state cleared only on RPC success.
// Depends on: services/reset.service.ts, services/factory-reset.service.ts,
//             stores/mastery.store.ts, stores/word-mastery.store.ts,
//             stores/unlock.store.ts, stores/counter.store.ts,
//             hooks/useSyncCheckpoint.ts, hooks/useDialogueSeen.ts
// ─────────────────────────────────────────────

import { useCallback } from 'react'
import { resetAllMastery, resetAllWordMastery } from '@/services/reset.service'
import { factoryReset } from '@/services/factory-reset.service'
import { useMasteryStore } from '@/stores/mastery.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { useUnlockStore } from '@/stores/unlock.store'
import { useCounterStore } from '@/stores/counter.store'
import { useSyncCheckpoint } from '@/hooks/useSyncCheckpoint'
import { clearAllDialoguesSeen, clearDialoguesByPrefix } from '@/hooks/useDialogueSeen'
import { clearPracticeCounters } from '@/hooks/usePracticeCounters'

// ── Types ─────────────────────────────────────

type ResetResult = { ok: true } | { ok: false; error: string }

// ── Constants ─────────────────────────────────

const DOJO_KANA_TIP_KEY = 'dojo.kana.tipIndex'
const DOJO_KOTOBA_TIP_KEY = 'dojo.kotoba.tipIndex'
const FROZEN_PROMPT_KEY = 'langtap-frozen-prompt'
const LEGACY_COUNTERS_KEY = 'langtap:practice-counters'

// ── Helpers ───────────────────────────────────

function clearLocalProgressState(): void {
  clearAllDialoguesSeen()
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DOJO_KANA_TIP_KEY)
    window.localStorage.removeItem(DOJO_KOTOBA_TIP_KEY)
    window.localStorage.removeItem(FROZEN_PROMPT_KEY)
    window.localStorage.removeItem(LEGACY_COUNTERS_KEY)
    clearPracticeCounters('kana')
    clearPracticeCounters('kotoba')
  }
}

// ── Hook ──────────────────────────────────────

export function useResetActions(): {
  resetKana: () => Promise<ResetResult>
  resetKotoba: () => Promise<ResetResult>
  resetAll: () => Promise<ResetResult>
} {
  const { flushDirty } = useSyncCheckpoint()

  const resetKana = useCallback(async (): Promise<ResetResult> => {
    try {
      await flushDirty()
      const result = await resetAllMastery()
      if (!result.ok) return { ok: false, error: result.error }

      useMasteryStore.getState().resetAll()
      useMasteryStore.getState().setEpoch(result.data.newEpoch)
      useUnlockStore.getState().recompute({}, new Set())
      useCounterStore.getState().resetAll()
      clearDialoguesByPrefix(['kana-', 'sokuon-', 'longvowel-', 'long-vowel-', 'dual-mnemonic-'])
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DOJO_KANA_TIP_KEY)
        window.localStorage.removeItem(FROZEN_PROMPT_KEY)
        clearPracticeCounters('kana')
      }
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { ok: false, error: `Kana reset failed: ${message}` }
    }
  }, [flushDirty])

  const resetKotoba = useCallback(async (): Promise<ResetResult> => {
    try {
      await flushDirty()
      const result = await resetAllWordMastery()
      if (!result.ok) return { ok: false, error: result.error }

      useWordMasteryStore.getState().resetAll()
      useWordMasteryStore.getState().setEpoch(result.data.newEpoch)
      clearDialoguesByPrefix(['kotoba-'])
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DOJO_KOTOBA_TIP_KEY)
        clearPracticeCounters('kotoba')
      }
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { ok: false, error: `Kotoba reset failed: ${message}` }
    }
  }, [flushDirty])

  const resetAll = useCallback(async (): Promise<ResetResult> => {
    try {
      await flushDirty()
      const result = await factoryReset()
      if (!result.ok) return { ok: false, error: result.error }

      useMasteryStore.getState().resetAll()
      useMasteryStore.getState().setEpoch(result.data.newMasteryEpoch)
      useWordMasteryStore.getState().resetAll()
      useWordMasteryStore.getState().setEpoch(result.data.newWordMasteryEpoch)
      useCounterStore.getState().resetAll()
      // Onboarding unlocks (preserved in onboarding store) merge back
      // on next hydration: post-onboarding state, not pre-onboarding.
      useUnlockStore.getState().recompute({}, new Set())
      clearLocalProgressState()
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { ok: false, error: `Full reset failed: ${message}` }
    }
  }, [flushDirty])

  return { resetKana, resetKotoba, resetAll }
}
