// ------------------------------------------------------------
// File: app/(onboarding)/layout.tsx
// Purpose: Layout for onboarding steps 1-3. Blue diagonal gradient
//          matching the auth screens. Centres a max-w-[440px] card.
//          Visual shell built in Sprint 2B.
// Depends on: nothing
// ------------------------------------------------------------

import type { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="min-h-dvh bg-onboarding-bg flex items-start md:items-center justify-center p-4 pt-8 md:pt-4">
      <div className="w-full">{children}</div>
    </div>
  )
}
