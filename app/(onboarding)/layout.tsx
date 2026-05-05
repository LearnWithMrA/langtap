// ------------------------------------------------------------
// File: app/(onboarding)/layout.tsx
// Purpose: Layout for onboarding steps 1-3. Blue diagonal gradient
//          matching the auth screens. Centres a max-w-[440px] card.
//          Visual shell built in Sprint 2B. AuthInitializer mounted
//          here so step-3 can access user state for profile sync.
// Depends on: components/performance/auth-initializer.tsx
// ------------------------------------------------------------

import type { ReactNode } from 'react'
import { AuthInitializer } from '@/components/performance/auth-initializer'

export default function OnboardingLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="min-h-dvh bg-onboarding-bg flex items-start md:items-center justify-center p-4 pt-8 md:pt-4">
      <AuthInitializer />
      <div className="w-full" style={{ animation: 'scaleIn 500ms ease-out' }}>
        {children}
      </div>
    </div>
  )
}
