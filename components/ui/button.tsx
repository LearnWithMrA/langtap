// ------------------------------------------------------------
// File: components/ui/button.tsx
// Purpose: Primitive Button component. Four variants, three sizes.
//          Always meets the 44x44pt minimum touch target (Apple HIG).
//          Renders a loading spinner when loading=true and disables
//          interaction. Uses type="button" by default to avoid
//          accidental form submission.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  'aria-label'?: string
  children: ReactNode
}

// -- Variant styles ----------------------------------------------

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-sage-500 text-white hover:bg-sage-600 focus:ring-sage-300',
  secondary: 'bg-sage-100 text-sage-600 hover:bg-sage-200 focus:ring-sage-300',
  ghost: 'bg-transparent text-text-secondary hover:bg-warm-100 focus:ring-warm-200',
  danger: 'bg-blush-100 text-blush-300 hover:bg-blush-300 hover:text-white focus:ring-blush-300',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm min-h-11 min-w-11',
  md: 'px-4 py-3 text-base min-h-11 min-w-11',
  lg: 'px-6 py-4 text-lg min-h-11 min-w-11',
}

// -- Component ---------------------------------------------------

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  children,
}: ButtonProps): ReactNode {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-xl font-medium',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  )
}
