// ------------------------------------------------------------
// File: components/ui/key-button.tsx
// Purpose: Keyboard-key-style button with 3D press-down effect
//          and optional key-click sound. Used for CTAs, nav buttons,
//          and tap grid buttons per UX_DESIGN.md Section 2.3.
// Depends on: next/link
// ------------------------------------------------------------

'use client'

import { useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useSettingsStore } from '@/stores/settings.store'

// -- Types --------------------------------------------------

type KeyButtonProps = {
  children: ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  sound?: 'click' | 'soft' | 'none'
  className?: string
  'aria-label'?: string
}

// -- Helpers ------------------------------------------------

function playKeySound(variant: 'click' | 'soft'): void {
  if (!useSettingsStore.getState().keyClicks) return
  const file = '/sounds/Keyboard%20Click.mp3'
  const audio = new Audio(file)
  audio.volume = variant === 'click' ? 0.5 : 0.3
  audio.play().catch(() => {})
}

// -- Component ----------------------------------------------

export function KeyButton({
  children,
  onClick,
  href,
  disabled = false,
  sound = 'click',
  className = '',
  'aria-label': ariaLabel,
}: KeyButtonProps): ReactNode {
  const handleClick = useCallback((): void => {
    if (disabled) return
    if (sound !== 'none') playKeySound(sound)
    onClick?.()
  }, [disabled, sound, onClick])

  const baseClasses = [
    'inline-flex items-center justify-center',
    'rounded-xl font-medium',
    'transition-all duration-75',
    'hover:brightness-105',
    'active:translate-y-[2px] active:shadow-none',
    'focus:outline-none focus:ring-2 focus:ring-sage-300 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:active:translate-y-0',
    'min-h-11 min-w-11',
    'cursor-pointer',
    className,
  ].join(' ')

  if (href && !disabled) {
    const isInternal = href.startsWith('/') || href.startsWith('#')
    const linkProps = {
      className: baseClasses,
      'aria-label': ariaLabel,
      onClick: (): void => {
        if (sound !== 'none') playKeySound(sound)
      },
    }

    if (isInternal) {
      return (
        <Link href={href} {...linkProps}>
          {children}
        </Link>
      )
    }

    return (
      <a href={href} {...linkProps}>
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={baseClasses}
    >
      {children}
    </button>
  )
}
