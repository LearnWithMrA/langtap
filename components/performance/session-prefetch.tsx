// ─────────────────────────────────────────────
// File: components/performance/session-prefetch.tsx
// Purpose: Prefetches core app routes once per browser session.
//          Uses requestIdleCallback so prefetch does not compete
//          with initial page render or active gameplay. Skips on
//          slow connections. Uses sessionStorage as a guard so
//          prefetch fires once per tab, not on every mount.
//          Renders nothing. Mounted in the (main) layout.
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

// ── Constants ─────────────────────────────────

const SESSION_KEY = 'langtap-prefetch-done'

const CORE_ROUTES = [
  '/home',
  '/dojo/kana',
  '/dojo/kotoba',
  '/practice/kana',
  '/practice/kotoba',
  '/leaderboard',
  '/profile',
]

// ── Component ─────────────────────────────────

export function SessionPrefetch(): ReactNode {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY)) return

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
    if (nav.connection?.saveData || nav.connection?.effectiveType === '2g') return

    const schedule =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb: () => void): ReturnType<typeof setTimeout> => setTimeout(cb, 200)

    const cancel =
      typeof cancelIdleCallback === 'function'
        ? cancelIdleCallback
        : (id: number): void => clearTimeout(id)

    const id = schedule(() => {
      for (const route of CORE_ROUTES) {
        router.prefetch(route)
      }
      sessionStorage.setItem(SESSION_KEY, '1')
    })

    return (): void => {
      cancel(id as number)
    }
  }, [router])

  return null
}
