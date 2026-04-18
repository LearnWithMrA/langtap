// ------------------------------------------------------------
// File: components/game/mode-button.tsx
// Purpose: Large keyboard-key-style mode selection button for
//          the game home screen. Supports unlocked (navigates
//          to practice) and locked (shows tooltip) states.
//          Uses aria-disabled instead of native disabled so
//          click events still fire for the locked tooltip.
// Depends on: public/images/icon-lock.svg
// ------------------------------------------------------------

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useKeySound } from '@/hooks/useKeySound'

// -- Types --------------------------------------------------

type ModeButtonVariant = 'kana' | 'kotoba'

type ModeButtonProps = {
  variant: ModeButtonVariant
  label: string
  locked: boolean
  onClick: () => void
}

// -- Constants ----------------------------------------------

const TOOLTIP_DURATION_MS = 3000

const VARIANT_STYLES: Record<ModeButtonVariant, { base: string; shadow: string }> = {
  kana: {
    base: 'bg-sage-500 text-white',
    shadow: 'shadow-[0_6px_0_0_#456e3d]',
  },
  kotoba: {
    base: 'bg-blush-300 text-warm-800',
    shadow: 'shadow-[0_6px_0_0_#c88a94]',
  },
}

const LOCKED_STYLES = {
  base: 'bg-warm-200 text-warm-400',
  shadow: 'shadow-[0_6px_0_0_#b8a898]',
}

// -- Component ----------------------------------------------

export function ModeButton({ variant, label, locked, onClick }: ModeButtonProps): ReactNode {
  const { playSound } = useKeySound()
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect((): (() => void) => {
    return (): void => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current)
    }
  }, [])

  const handleClick = useCallback((): void => {
    if (locked) {
      setShowTooltip(true)
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(false), TOOLTIP_DURATION_MS)
      return
    }
    playSound(variant === 'kana' ? 'ui-mode-kana' : 'ui-mode-kotoba')
    onClick()
  }, [locked, onClick, playSound, variant])

  const styles = locked ? LOCKED_STYLES : VARIANT_STYLES[variant]

  return (
    <div className="relative">
      <button
        type="button"
        aria-disabled={locked}
        aria-label={locked ? `${label} mode - locked` : `Start ${label} practice`}
        onClick={handleClick}
        className={[
          'flex flex-col items-center justify-center',
          'w-[180px] h-[100px]',
          'rounded-2xl text-xl font-bold text-center px-5',
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-offset-2',
          styles.base,
          styles.shadow,
          locked
            ? 'cursor-not-allowed'
            : 'hover:brightness-110 active:translate-y-1 active:shadow-none cursor-pointer',
        ].join(' ')}
      >
        <span className="whitespace-nowrap">{label}</span>
        {locked && (
          <svg
            width={16}
            height={18}
            viewBox="0 0 18 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-1"
          >
            <rect x={2} y={9} width={14} height={10} rx={2} />
            <path d="M5 9 V6 Q5 1 9 1 Q13 1 13 6 V9" />
          </svg>
        )}
      </button>

      {showTooltip && (
        <div
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-white/90 text-warm-600 text-sm rounded-lg px-3 py-1.5 shadow-sm"
          role="tooltip"
        >
          Complete Kana to unlock
        </div>
      )}
    </div>
  )
}
