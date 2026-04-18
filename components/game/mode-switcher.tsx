// ------------------------------------------------------------
// File: components/game/mode-switcher.tsx
// Purpose: Controlled input mode toggle. Shows the current mode
//          icon and opens a popover to switch between Type, Tap,
//          and Swipe. Mode state is owned by the parent; this
//          component only manages its own popover open/close.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

// -- Types --------------------------------------------------

type InputMode = 'type' | 'tap' | 'swipe'

type ModeSwitcherProps = {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
}

// -- Mode icon SVGs -----------------------------------------

function IconKeyboard(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={2} y={5} width={20} height={14} rx={2} />
      <path d="M6 9h1 M10 9h1 M14 9h1 M18 9h1 M8 13h8" />
    </svg>
  )
}

function IconTap(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={3} />
      <circle cx={12} cy={12} r={7} opacity={0.4} />
      <circle cx={12} cy={12} r={10} opacity={0.2} />
    </svg>
  )
}

function IconSwipe(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12 h14" />
      <path d="M15 8 l4 4 -4 4" />
    </svg>
  )
}

// -- Constants ----------------------------------------------

const MODE_ICONS: Record<InputMode, () => ReactNode> = {
  type: IconKeyboard,
  tap: IconTap,
  swipe: IconSwipe,
}

const MODE_LABELS: Record<InputMode, string> = {
  type: 'Type',
  tap: 'Tap',
  swipe: 'Swipe',
}

const ALL_MODES: InputMode[] = ['type', 'tap', 'swipe']

// -- Component ----------------------------------------------

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect((): (() => void) => {
    function handleClickOutside(e: MouseEvent): void {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = useCallback(
    (selected: InputMode): void => {
      onModeChange(selected)
      setIsOpen(false)
    },
    [onModeChange],
  )

  const CurrentIcon = MODE_ICONS[mode]

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={(): void => setIsOpen(!isOpen)}
        className="min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm text-warm-800 hover:text-sage-400 hover:bg-white/40 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sage-300 cursor-pointer"
        aria-label={`Current mode: ${MODE_LABELS[mode]}. Click to switch.`}
        aria-expanded={isOpen}
      >
        <CurrentIcon />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg py-1 min-w-[140px] z-50">
          {ALL_MODES.map((m) => {
            const ModeIcon = MODE_ICONS[m]
            const isActive = m === mode
            return (
              <button
                key={m}
                type="button"
                onClick={(): void => handleSelect(m)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer',
                  isActive
                    ? 'text-sage-500 font-bold'
                    : 'text-warm-800 hover:text-sage-400 hover:bg-sage-50',
                ].join(' ')}
                aria-label={`Switch to ${MODE_LABELS[m]} mode`}
              >
                <ModeIcon />
                {MODE_LABELS[m]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
