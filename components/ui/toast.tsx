// ------------------------------------------------------------
// File: components/ui/toast.tsx
// Purpose: Toast notification display component. Renders a managed
//          list of toasts. Pure display - queue state is managed by
//          the caller (useToast hook, to be built in a later sprint).
//          Max 3 toasts visible. Newest on top. Auto-dismiss after
//          durationMs (default 4000ms, 0 = persistent). Pause on hover.
//          aria-live="polite" for info/success/warning.
//          role="alert" for error (assertive).
// Depends on: nothing
// ------------------------------------------------------------

'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// -- Types -------------------------------------------------------

type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export type ToastItem = {
  id: string
  message: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastProps = {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

// -- Constants ---------------------------------------------------

const DEFAULT_DURATION_MS = 4000

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'bg-surface-raised border-border text-text-primary',
  success: 'bg-mint-100 border-mint-300 text-text-primary',
  warning: 'bg-warm-100 border-warm-400 text-text-primary',
  error: 'bg-blush-100 border-blush-300 text-text-primary',
}

// -- ToastEntry (single item with auto-dismiss) ------------------

type ToastEntryProps = {
  toast: ToastItem
  onDismiss: (id: string) => void
}

function ToastEntry({ toast, onDismiss }: ToastEntryProps): ReactNode {
  const { id, message, variant = 'info', durationMs = DEFAULT_DURATION_MS } = toast
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [paused, setPaused] = useState(false)

  // Start or restart the auto-dismiss timer
  useEffect(() => {
    if (durationMs === 0 || paused) return
    timerRef.current = setTimeout(() => onDismiss(id), durationMs)
    return (): void => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [id, durationMs, paused, onDismiss])

  const isError = variant === 'error'

  return (
    <div
      role={isError ? 'alert' : undefined}
      aria-live={isError ? undefined : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={[
        'flex items-start justify-between gap-3',
        'border rounded-xl px-4 py-3 shadow-sm',
        'text-sm',
        VARIANT_CLASSES[variant],
      ].join(' ')}
    >
      <span>{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(id)}
        className="shrink-0 text-text-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-sage-300 rounded"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )
}

// -- Component ---------------------------------------------------

export function Toast({ toasts, onDismiss }: ToastProps): ReactNode {
  // Max 3 visible - show the most recent three
  const visible = toasts.slice(0, 3)

  if (visible.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {visible.map((toast) => (
        <ToastEntry key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
