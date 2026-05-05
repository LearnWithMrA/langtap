// ─────────────────────────────────────────────
// File: components/performance/session-prefetch.tsx
// Purpose: Prefetches core app routes once per browser session.
//          Uses requestIdleCallback so prefetch does not compete
//          with initial page render. Respects gameplay guard: defers
//          until gameplay store signals inactive. Skips on slow
//          connections. Uses sessionStorage so prefetch fires once
//          per tab. Renders nothing. Mounted in the (main) layout.
// Depends on: hooks/useGameplayActive
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useGameplayActive } from '@/hooks/useGameplayActive'

// ── Constants ─────────────────────────────────

const SESSION_KEY = 'langtap-prefetch-done'

const CORE_ROUTES = [
  '/home',
  '/practice/kana',
  '/practice/kotoba',
  '/dojo/kana',
  '/dojo/kotoba',
  '/leaderboard',
  '/profile',
]

// ── Component ─────────────────────────────────

export function SessionPrefetch(): ReactNode {
  const router = useRouter()
  const isGameplayActive = useGameplayActive()
  const doneRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (doneRef.current) return
    if (sessionStorage.getItem(SESSION_KEY)) {
      doneRef.current = true
      return
    }
    if (isGameplayActive) return

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
      for (let i = 0; i < CORE_ROUTES.length; i++) {
        const timer = setTimeout(() => {
          router.prefetch(CORE_ROUTES[i])
          if (i === CORE_ROUTES.length - 1) {
            sessionStorage.setItem(SESSION_KEY, '1')
            doneRef.current = true
          }
        }, i * 100)
        timersRef.current.push(timer)
      }
    })

    return (): void => {
      cancel(id as number)
      for (const timer of timersRef.current) {
        clearTimeout(timer)
      }
      timersRef.current = []
    }
  }, [router, isGameplayActive])

  return null
}
