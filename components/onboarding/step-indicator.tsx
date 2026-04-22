// ------------------------------------------------------------
// File: components/onboarding/step-indicator.tsx
// Purpose: Three-dot progress indicator for the onboarding flow.
//          Active step: mint-500. Completed: sage-400. Future: warm-300.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type StepIndicatorProps = {
  currentStep: 1 | 2 | 3
}

// -- Constants ---------------------------------------------------

const TOTAL_STEPS = 3

// -- Component ---------------------------------------------------

export function StepIndicator({ currentStep }: StepIndicatorProps): ReactNode {
  return (
    <div
      role="group"
      aria-label={`Onboarding progress, step ${currentStep} of ${TOTAL_STEPS}`}
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1
        const isCurrent = step === currentStep
        const isCompleted = step < currentStep

        return (
          <span
            key={step}
            aria-hidden="true"
            className={[
              'h-2.5 w-2.5 rounded-full border-2 border-[#c4b0d0]',
              isCurrent || isCompleted ? 'bg-[#c4b0d0]' : 'bg-transparent',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}
