// ------------------------------------------------------------
// File: components/ui/card.tsx
// Purpose: Primitive Card container component.
//          Raised surface with border, rounded corners, and padding.
//          Use className to override padding or add layout utilities.
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type CardProps = {
  children: ReactNode
  className?: string
}

// -- Component ---------------------------------------------------

export function Card({ children, className = '' }: CardProps): ReactNode {
  return (
    <div className={`bg-surface-raised border border-border rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}
