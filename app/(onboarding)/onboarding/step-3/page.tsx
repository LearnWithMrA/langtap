// ------------------------------------------------------------
// File: app/(onboarding)/onboarding/step-3/page.tsx
// Purpose: Onboarding Step 3 - Input mode selection.
//          User picks Type, Tap, or Swipe. "Start practising"
//          completes onboarding and routes to /practice.
//          Visual shell built in Sprint 2B.
// Depends on: components/onboarding/step-indicator.tsx,
//             components/onboarding/input-mode-picker.tsx,
//             components/ui/key-button.tsx,
//             stores/onboarding.store.ts
// ------------------------------------------------------------

'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { InputModePicker } from '@/components/onboarding/input-mode-picker'
import { KeyButton } from '@/components/ui/key-button'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Component ---------------------------------------------------

export default function OnboardingStep3Page(): ReactNode {
  const router = useRouter()
  const completeOnboarding = useOnboardingStore((s: OnboardingStore) => s.completeOnboarding)
  const onboardingComplete = useOnboardingStore((s: OnboardingStore) => s.onboardingComplete)

  useEffect(() => {
    useOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/practice')
    }
  }, [onboardingComplete, router])

  const handleBack = (): void => {
    router.push('/onboarding/step-2')
  }

  const handleStart = (): void => {
    completeOnboarding()
    router.push('/home')
  }

  return (
    <div className="bg-surface-raised rounded-2xl shadow-lg px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-5 max-w-[440px] mx-auto">
      {/* Header row: back + indicator */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back to step 2"
          className="rounded-full p-2 text-text-secondary hover:bg-warm-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#c4b0d0]"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="12 15 7 10 12 5" />
          </svg>
        </button>

        <StepIndicator currentStep={3} />

        {/* Spacer to balance the back button */}
        <div className="w-9" />
      </div>

      <h1 className="text-xl font-bold text-text-primary text-center mt-1.5 mb-1">
        How do you want to practise?
      </h1>
      <p className="text-sm text-text-secondary text-center mb-5">
        Choose the input style that suits you. You can switch any time.
      </p>

      <InputModePicker />

      <div className="mt-5">
        <KeyButton
          onClick={handleStart}
          className="w-full bg-[#c4b0d0] text-white py-3 text-base font-bold shadow-[0_4px_0_0_#a68fb8] focus:!ring-[#c4b0d0]"
        >
          Start practising
        </KeyButton>
      </div>
    </div>
  )
}
