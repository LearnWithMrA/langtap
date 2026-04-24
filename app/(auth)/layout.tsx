// ------------------------------------------------------------
// File: app/(auth)/layout.tsx
// Purpose: Layout for auth screens (sign-up, log-in).
//          Sky blue pastel solid background, no navigation chrome.
//          Visual shell built in Sprint 2B.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      className="min-h-dvh bg-[#5b8fb9] flex items-center justify-center p-4"
      style={{ '--color-sage-300': '#7bafd4' } as React.CSSProperties}
    >
      <div className="w-full max-w-[440px]">{children}</div>
    </div>
  )
}
