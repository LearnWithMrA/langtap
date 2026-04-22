// ------------------------------------------------------------
// File: components/onboarding/input-mode-picker.tsx
// Purpose: Three mode option cards for onboarding Step 3.
//          Operates as a radio group. Selected card gets a sage
//          left accent bar. Writes to onboarding store.
// Depends on: stores/onboarding.store.ts
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Types -------------------------------------------------------

type InputMode = 'type' | 'tap' | 'swipe'

type ModeOption = {
  mode: InputMode
  label: string
  description: string
  icon: ReactNode
}

// -- Icons -------------------------------------------------------

function KeyboardIcon(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10" />
      <line x1="10" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="14" y2="10" />
      <line x1="18" y1="10" x2="18" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  )
}

function TapIcon(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1" x2="12" y2="5" />
    </svg>
  )
}

function SwipeIcon(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 16c0-4 3-8 7-8s7 4 7 8" />
      <polyline points="15 14 19 16 15 18" />
    </svg>
  )
}

// -- Constants ---------------------------------------------------

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    mode: 'tap',
    label: 'Tap',
    description: 'Tap the correct character on screen',
    icon: <TapIcon />,
  },
  {
    mode: 'type',
    label: 'Type',
    description: 'Use your keyboard to type',
    icon: <KeyboardIcon />,
  },
  {
    mode: 'swipe',
    label: 'Swipe',
    description: 'Use your phone\'s swipe keyboard',
    icon: <SwipeIcon />,
  },
] as const

// -- Component ---------------------------------------------------

export function InputModePicker(): ReactNode {
  const inputMode = useOnboardingStore((s: OnboardingStore) => s.inputMode)
  const setInputMode = useOnboardingStore((s: OnboardingStore) => s.setInputMode)

  return (
    <div role="radiogroup" aria-label="Input mode selection" className="flex flex-col gap-2">
      {MODE_OPTIONS.map(({ mode, label, description, icon }) => {
        const isSelected = inputMode === mode

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={(): void => setInputMode(mode)}
            className={[
              'w-full rounded-xl py-2.5 px-3 text-left',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#c4b0d0] focus:ring-offset-1',
              'min-h-11',
              isSelected
                ? 'border-2 border-[#c4b0d0] bg-[#f5f0f8] border-l-4'
                : 'border-2 border-border bg-surface-raised hover:bg-warm-100',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <span className={isSelected ? 'text-[#9b7bb0]' : 'text-text-secondary'}>
                {icon}
              </span>
              <div>
                <span className="text-base font-bold text-text-primary">{label}</span>
                <span className="block text-sm text-text-secondary mt-0.5">{description}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
