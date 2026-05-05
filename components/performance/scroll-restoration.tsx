// ─────────────────────────────────────────────
// File: components/performance/scroll-restoration.tsx
// Purpose: Manual scroll position restoration for back/forward
//          navigation. Saves scroll position per pathname and
//          restores on popstate. Prevents jarring scroll-to-top
//          when navigating back to scrollable pages (dojo).
//          Mounted in the (main) layout. Renders nothing.
// Depends on: nothing
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// ── Component ─────────────────────────────────

export function ScrollRestoration(): ReactNode {
  const pathname = usePathname()
  const positions = useRef<Map<string, number>>(new Map())
  const isPopstate = useRef(false)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'

    function handlePopstate(): void {
      isPopstate.current = true
    }

    window.addEventListener('popstate', handlePopstate)
    return (): void => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  useEffect(() => {
    const posMap = positions.current
    const prev = posMap.get(pathname)
    if (isPopstate.current && prev !== undefined) {
      window.scrollTo(0, prev)
    } else {
      window.scrollTo(0, 0)
    }
    isPopstate.current = false

    return (): void => {
      posMap.set(pathname, window.scrollY)
    }
  }, [pathname])

  return null
}
