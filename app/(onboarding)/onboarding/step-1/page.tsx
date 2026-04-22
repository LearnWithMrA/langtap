// ------------------------------------------------------------
// File: app/(onboarding)/onboarding/step-1/page.tsx
// Purpose: Onboarding Step 1 - JLPT self-assessment.
//          User selects their vocabulary level (N5-N1).
//          Single picker writing to kotoba_jlpt_level via the
//          onboarding store. Visual shell built in Sprint 2B.
// Depends on: components/onboarding/step-indicator.tsx,
//             components/onboarding/jlpt-picker.tsx,
//             components/ui/key-button.tsx,
//             stores/onboarding.store.ts
// ------------------------------------------------------------

'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { JlptPicker } from '@/components/onboarding/jlpt-picker'
import { KeyButton } from '@/components/ui/key-button'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Component ---------------------------------------------------

export default function OnboardingStep1Page(): ReactNode {
  const router = useRouter()
  const onboardingComplete = useOnboardingStore((s: OnboardingStore) => s.onboardingComplete)

  useEffect(() => {
    useOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/practice')
    }
  }, [onboardingComplete, router])

  const handleNext = (): void => {
    router.push('/onboarding/step-2')
  }

  return (
    <div className="bg-surface-raised rounded-2xl shadow-lg px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-5 max-w-[440px] mx-auto">
      <StepIndicator currentStep={1} />

      <h1 className="text-xl font-bold text-text-primary text-center mt-2.5 mb-1">
        How much Japanese do you know?
      </h1>
      <p className="text-sm text-text-secondary text-center mb-5">
        This helps us choose the right words for you. You can change this later in Settings.
      </p>

      <JlptPicker />

      <p className="text-xs text-text-muted text-center mt-4 mb-4">
        Words below this level will be marked as mastered. To reset, change your level in Settings or in Kotoba Dojo.
      </p>

      <KeyButton
        onClick={handleNext}
        className="w-full bg-[#c4b0d0] text-white py-3 text-base font-bold shadow-[0_4px_0_0_#a68fb8] focus:!ring-[#c4b0d0]"
      >
        Next
      </KeyButton>
    </div>
  )
}
