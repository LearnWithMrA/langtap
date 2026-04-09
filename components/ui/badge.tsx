// ------------------------------------------------------------
// File: components/ui/badge.tsx
// Purpose: Primitive Badge component for small label chips.
//          Used for JLPT level indicators and input mode labels.
//          Non-interactive - decorative label only.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type BadgeVariant = 'sage' | 'mint' | 'blush' | 'warm'

type BadgeProps = {
  label: string
  variant?: BadgeVariant
  className?: string
}

// -- Variant styles ----------------------------------------------

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  sage: 'bg-sage-100 text-sage-600',
  mint: 'bg-mint-100 text-mint-500',
  blush: 'bg-blush-100 text-blush-300',
  warm: 'bg-warm-100 text-warm-600',
}

// -- Component ---------------------------------------------------

export function Badge({ label, variant = 'sage', className = '' }: BadgeProps): ReactNode {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {label}
    </span>
  )
}
