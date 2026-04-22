// ------------------------------------------------------------
// File: app/(onboarding)/onboarding/step-2/page.tsx
// Purpose: Onboarding Step 2A - Knowledge level gate.
//          Two sliders: Hiragana and Katakana, each with
//          None / Some / All. "I know all" for both skips the
//          chart and unlocks all seion. "Some" on either goes
//          to Step 2B (the chart picker).
// Depends on: components/onboarding/step-indicator.tsx,
//             components/ui/key-button.tsx,
//             stores/onboarding.store.ts,
//             data/kana/characters.ts
// ------------------------------------------------------------

'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { KeyButton } from '@/components/ui/key-button'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Types -------------------------------------------------------

type KnowledgeLevel = 'none' | 'some' | 'all'

// -- Helpers -----------------------------------------------------

function getAllIds(script: 'hiragana' | 'katakana'): string[] {
  return KANA_CHARACTERS
    .filter((c) => c.script === script)
    .map((c) => c.id)
}

// -- Component ---------------------------------------------------

export default function OnboardingStep2Page(): ReactNode {
  const router = useRouter()
  const onboardingComplete = useOnboardingStore((s: OnboardingStore) => s.onboardingComplete)
  const clearCharacters = useOnboardingStore((s: OnboardingStore) => s.clearCharacters)
  const setSelectedBulk = useOnboardingStore((s: OnboardingStore) => s.setSelectedBulk)

  const [hiragana, setHiragana] = useState<KnowledgeLevel>('none')
  const [katakana, setKatakana] = useState<KnowledgeLevel>('none')

  const hiraganaIds = useMemo(() => getAllIds('hiragana'), [])
  const katakanaIds = useMemo(() => getAllIds('katakana'), [])

  useEffect(() => {
    useOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (onboardingComplete) {
      router.replace('/practice')
    }
  }, [onboardingComplete, router])

  const bothAll = hiragana === 'all' && katakana === 'all'
  const bothNone = hiragana === 'none' && katakana === 'none'
  const hasSome = hiragana === 'some' || katakana === 'some'

  const handleNext = (): void => {
    if (bothNone) {
      clearCharacters()
      router.push('/onboarding/step-3')
      return
    }

    if (bothAll) {
      setSelectedBulk([...hiraganaIds, ...katakanaIds])
      router.push('/onboarding/step-3')
      return
    }

    if (hasSome) {
      const preSelected: string[] = []
      if (hiragana === 'all') preSelected.push(...hiraganaIds)
      if (katakana === 'all') preSelected.push(...katakanaIds)
      if (preSelected.length > 0) setSelectedBulk(preSelected)
      else clearCharacters()
      router.push('/onboarding/step-2b')
      return
    }

    const preSelected: string[] = []
    if (hiragana === 'all') preSelected.push(...hiraganaIds)
    if (katakana === 'all') preSelected.push(...katakanaIds)
    setSelectedBulk(preSelected)
    router.push('/onboarding/step-3')
  }

  const handleBack = (): void => {
    router.push('/onboarding/step-1')
  }

  const handleSkip = (): void => {
    clearCharacters()
    router.push('/onboarding/step-3')
  }

  return (
    <div className="bg-surface-raised rounded-2xl shadow-lg px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-5 max-w-[440px] mx-auto">
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back to step 1"
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

      <h1 className="text-xl font-bold text-text-primary text-center mt-2.5 mb-1">
        Which characters do you already know?
      </h1>
      <p className="text-sm text-text-secondary text-center mb-3">
        This includes seion, dakuon and yoon. Unlock them now, or skip to start from scratch.
      </p>

      <div className="flex flex-col gap-5 mb-6">
        <ScriptSlider label="Hiragana" value={hiragana} onChange={setHiragana} />
        <ScriptSlider label="Katakana" value={katakana} onChange={setKatakana} />
      </div>

      <KeyButton
        onClick={handleNext}
        className="w-full bg-[#c4b0d0] text-white py-3 text-base font-bold shadow-[0_4px_0_0_#a68fb8] focus:!ring-[#c4b0d0]"
      >
        {bothNone ? 'Skip' : hasSome ? 'Choose characters' : 'Next'}
      </KeyButton>
    </div>
  )
}

// -- ScriptSlider ------------------------------------------------

function ScriptSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: KnowledgeLevel
  onChange: (v: KnowledgeLevel) => void
}): ReactNode {
  const options: { key: KnowledgeLevel; text: string }[] = [
    { key: 'none', text: 'None' },
    { key: 'some', text: 'Some' },
    { key: 'all', text: 'All' },
  ]

  return (
    <div>
      <span className="text-sm font-bold text-text-primary mb-2 block">{label}</span>
      <div className="flex rounded-xl border border-border overflow-hidden">
        {options.map(({ key, text }) => {
          const isActive = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={(): void => onChange(key)}
              className={[
                'flex-1 py-2 text-sm font-medium transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#c4b0d0] focus:ring-inset',
                isActive
                  ? 'bg-[#c4b0d0] text-white'
                  : 'bg-surface-raised text-text-secondary hover:bg-warm-100',
              ].join(' ')}
            >
              {text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
