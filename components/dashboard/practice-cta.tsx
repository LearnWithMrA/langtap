// ─────────────────────────────────────────────
// File: components/dashboard/practice-cta.tsx
// Purpose: Primary call-to-action button for starting kana practice,
//          with a mode indicator label below.
// Depends on: hooks/useKeySound.ts
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useKeySound } from '@/hooks/useKeySound'

// ── Component ─────────────────────────────────

export function PracticeCta({ mode }: { mode: string }): ReactNode {
  const router = useRouter()
  const { playSound } = useKeySound()

  const modeLabels: Record<string, string> = {
    tap: 'Tap mode',
    type: 'Type mode',
    swipe: 'Swipe mode',
  }

  return (
    <div>
      <button
        type="button"
        onClick={(): void => {
          playSound('key-click')
          router.push('/practice')
        }}
        aria-label="Start practising kana"
        className="w-full bg-mint-500 text-white text-base font-bold rounded-xl py-3 shadow-[0_4px_0_0_#2e9a73] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all duration-75 min-h-[48px]"
      >
        Practice Kana
      </button>
      <p
        className="text-xs text-warm-400 text-center mt-2 cursor-pointer hover:text-warm-600 transition-colors duration-150"
        aria-label={`Current input mode: ${modeLabels[mode] ?? mode}. Tap to change.`}
      >
        {modeLabels[mode] ?? mode}
      </p>
    </div>
  )
}
