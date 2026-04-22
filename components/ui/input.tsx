// ------------------------------------------------------------
// File: components/ui/input.tsx
// Purpose: Primitive Input component. Text input with label,
//          disabled state, and error state. The error string is
//          rendered below the field and tied to the input via
//          aria-describedby for screen reader announcements.
//          Font size is 16px minimum to prevent iOS Safari zoom
//          on focus.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useId } from 'react'
import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type InputProps = {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  label?: string
  disabled?: boolean
  error?: string
  autoFocus?: boolean
  className?: string
}

// -- Component ---------------------------------------------------

export function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  label,
  disabled = false,
  error,
  autoFocus = false,
  className = '',
}: InputProps): ReactNode {
  // useId produces a stable, unique ID for label/input association
  const generatedId = useId()
  const inputId = `input-${generatedId}`
  const errorId = `error-${generatedId}`

  const hasError = Boolean(error)

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={[
          'w-full border rounded-xl px-4 py-3 bg-surface-raised',
          'text-base text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          hasError
            ? 'border-feedback-wrong focus:ring-feedback-wrong'
            : 'border-border focus:ring-sage-300',
        ].join(' ')}
      />
      {hasError && (
        <p id={errorId} role="alert" className="text-xs text-feedback-wrong">
          {error}
        </p>
      )}
    </div>
  )
}
