// ─────────────────────────────────────────────
// File: components/performance/page-transition.tsx
// Purpose: Subtle fade-in animation on route changes within the
//          (main) layout group. Uses CSS animation (not
//          experimental viewTransition). Wraps children with a
//          key tied to the current pathname so React remounts
//          with the fade on each navigation.
// Depends on: nothing
// ─────────────────────────────────────────────

'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// ── Component ─────────────────────────────────

export function PageTransition({ children }: { children: ReactNode }): ReactNode {
  const pathname = usePathname()

  return (
    <div key={pathname} className="animate-[fadeIn_150ms_ease-out]">
      {children}
    </div>
  )
}
