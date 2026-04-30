// ─────────────────────────────────────────────
// File: components/performance/session-prefetch.tsx
// Purpose: Prefetches core app routes once per browser session.
//          Runs after a short delay so it does not compete with
//          the initial page load. Uses sessionStorage as a guard
//          so prefetch fires once per tab, not on every mount.
//          Renders nothing. Mounted in the (main) layout.
// ─────────────────────────────────────────────

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

// ── Constants ─────────────────────────────────

const SESSION_KEY = 'langtap-prefetch-done'
const DELAY_MS = 500

const CORE_ROUTES = ['/home', '/dojo/kana', '/dojo/kotoba', '/practice', '/leaderboard', '/profile']

// ── Component ─────────────────────────────────

export function SessionPrefetch(): ReactNode {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_KEY)) return

    const timer = setTimeout((): void => {
      for (const route of CORE_ROUTES) {
        router.prefetch(route)
      }
      sessionStorage.setItem(SESSION_KEY, '1')
    }, DELAY_MS)

    return (): void => {
      clearTimeout(timer)
    }
  }, [router])

  return null
}
