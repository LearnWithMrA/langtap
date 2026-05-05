// ─────────────────────────────────────────────
// File: components/performance/practice-data-preloader.tsx
// Purpose: Pre-warms the word bank cache after auth and store
//          hydration. By the time a user navigates to /practice,
//          word data is cached and the practice hook selects a
//          prompt synchronously. Renders nothing. Mounted in the
//          (main) layout after AuthInitializer and StoreHydrator.
// Depends on: data/words/word-bank-loader.ts,
//             stores/onboarding.store.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { loadWordBank, loadKotobaLevels } from '@/data/words/word-bank-loader'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { JlptLevel } from '@/types/user.types'

// ── Component ─────────────────────────────────

export function PracticeDataPreloader(): ReactNode {
  const initRef = useRef(false)
  const jlptLevel = useOnboardingStore((s) => s.jlptLevel) as JlptLevel | null
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!hasHydrated || initRef.current) return
    initRef.current = true

    const level: JlptLevel = jlptLevel ?? 'N5'

    const schedule =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb: () => void): ReturnType<typeof setTimeout> => setTimeout(cb, 100)

    schedule(() => {
      void loadWordBank(level)
      void loadKotobaLevels(level)
    })
  }, [hasHydrated, jlptLevel])

  return null
}
