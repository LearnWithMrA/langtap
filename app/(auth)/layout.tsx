// ------------------------------------------------------------
// File: app/(auth)/layout.tsx
// Purpose: Layout for auth screens (sign-up, log-in).
//          Blue diagonal gradient background, no navigation chrome.
//          Visual shell built in Sprint 2B.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">{children}</div>
    </div>
  )
}
