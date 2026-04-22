// ------------------------------------------------------------
// File: app/(onboarding)/onboarding/step-2b/page.tsx
// Purpose: Onboarding Step 2B - Character picker.
//          Stripped-down chart with no heading text to maximise
//          space for the kana grid. Reached from Step 2A when
//          user selects "Some" for either script.
// Depends on: components/onboarding/step-indicator.tsx,
//             components/onboarding/kana-chart-selector.tsx,
//             components/ui/key-button.tsx, components/ui/modal.tsx,
//             stores/onboarding.store.ts
// ------------------------------------------------------------

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { KanaChartSelector } from '@/components/onboarding/kana-chart-selector'
import { KeyButton } from '@/components/ui/key-button'
import { Modal } from '@/components/ui/modal'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Component ---------------------------------------------------

export default function OnboardingStep2BPage(): ReactNode {
  const router = useRouter()
  const selectedIds = useOnboardingStore((s: OnboardingStore) => s.selectedCharacterIds)
  const toggleGroup = useOnboardingStore((s: OnboardingStore) => s.toggleGroup)
  const removeGroup = useOnboardingStore((s: OnboardingStore) => s.removeGroup)
  const onboardingComplete = useOnboardingStore((s: OnboardingStore) => s.onboardingComplete)
  const [showModal, setShowModal] = useState(false)
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>([])

  const handleActiveGroupChange = useCallback((ids: string[]): void => {
    setActiveGroupIds(ids)
  }, [])

  useEffect(() => {
    useOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/practice')
    }
  }, [onboardingComplete, router])

  const count = selectedIds.length

  const handleBack = (): void => {
    router.push('/onboarding/step-2')
  }

  const handleUnlockClick = (): void => {
    setShowModal(true)
  }

  const handleConfirmUnlock = (): void => {
    setShowModal(false)
    router.push('/onboarding/step-3')
  }

  return (
    <div className="md:w-fit md:mx-auto max-w-[440px] mx-auto md:max-w-none flex flex-col max-h-[calc(100dvh-2rem)] md:max-h-none">
      <div className="bg-surface-raised rounded-2xl shadow-lg px-3 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4 flex-1 min-h-0 flex flex-col md:flex-none">
        <div className="flex items-center justify-between -mb-1">
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

          <StepIndicator currentStep={2} />

          <div className="w-9" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <KanaChartSelector onActiveGroupChange={handleActiveGroupChange} />
        </div>

        <div className="py-3 flex items-center justify-between gap-3">
          {((): ReactNode => {
            const anyGroupSelected = activeGroupIds.some((id) => selectedIds.includes(id))
            return (
              <KeyButton
                onClick={(): void =>
                  anyGroupSelected ? removeGroup(activeGroupIds) : toggleGroup(activeGroupIds)
                }
                className="bg-[#e4d8ec] text-[#6b4d82] px-5 py-2.5 text-sm font-bold shadow-[0_4px_0_0_#d4c6db] focus:!ring-[#c4b0d0]"
              >
                {anyGroupSelected ? 'Clear' : 'Select all'}
              </KeyButton>
            )
          })()}

          <div className="flex items-center gap-2">
            <KeyButton
              onClick={handleUnlockClick}
              disabled={count === 0}
              className="bg-[#c4b0d0] text-white px-5 py-2.5 text-sm font-bold shadow-[0_4px_0_0_#a68fb8] focus:!ring-[#c4b0d0]"
            >
              Unlock these
            </KeyButton>
          </div>
        </div>

        <Modal
          isOpen={showModal}
          onClose={(): void => setShowModal(false)}
          onConfirm={handleConfirmUnlock}
          confirmClassName="!bg-[#c4b0d0] !text-white hover:!bg-[#a68fb8]"
          steps={[
            {
              title: `Unlock ${count} character${count !== 1 ? 's' : ''}?`,
              body: 'These characters will be available for practice straight away. You can unlock more from the Dojo at any time.',
              confirmLabel: 'Unlock',
              cancelLabel: 'Cancel',
            },
          ]}
        />
      </div>
    </div>
  )
}
