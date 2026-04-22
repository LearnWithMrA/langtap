// ------------------------------------------------------------
// File: components/onboarding/jlpt-picker.tsx
// Purpose: Five stacked JLPT level buttons for onboarding Step 1.
//          Operates as a radio group. Selected level highlighted in
//          sage-200. Writes to the onboarding store.
// Depends on: stores/onboarding.store.ts
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Types -------------------------------------------------------

type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

type LevelOption = {
  level: JlptLevel
  label: string
  description: string
}

// -- Constants ---------------------------------------------------

const LEVELS: readonly LevelOption[] = [
  { level: 'N5', label: 'N5', description: 'I am just starting out' },
  { level: 'N4', label: 'N4', description: 'I know some basics' },
  { level: 'N3', label: 'N3', description: 'I am getting comfortable' },
  { level: 'N2', label: 'N2', description: 'I am approaching fluency' },
  { level: 'N1', label: 'N1', description: 'I am near native level' },
] as const

// -- Component ---------------------------------------------------

export function JlptPicker(): ReactNode {
  const jlptLevel = useOnboardingStore((s: OnboardingStore) => s.jlptLevel)
  const setJlptLevel = useOnboardingStore((s: OnboardingStore) => s.setJlptLevel)

  return (
    <div role="radiogroup" aria-label="JLPT level selection" className="flex flex-col gap-2">
      {LEVELS.map(({ level, label, description }) => {
        const isSelected = jlptLevel === level

        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={(): void => setJlptLevel(level)}
            className={[
              'w-full px-4 rounded-xl text-left flex items-center',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#c4b0d0] focus:ring-offset-1',
              isSelected
                ? 'bg-onboarding-bg border border-[#d4c6db]'
                : 'bg-surface-raised border border-border hover:bg-warm-100',
            ].join(' ')}
            style={{ height: '36px' }}
          >
            <span className="text-sm font-bold text-text-primary">{label}:</span>
            <span className="text-sm text-text-secondary ml-1.5">{description}</span>
          </button>
        )
      })}
    </div>
  )
}
