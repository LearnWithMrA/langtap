// ------------------------------------------------------------
// File: components/ui/modal.tsx
// Purpose: Two-step confirmation modal for destructive actions.
//          Used for unlock and reset progress flows.
//          Accessibility: focus trap, Escape to close, scroll lock,
//          focus restore, backdrop click to close, role="dialog".
//          One or two steps supported. Second step is the final
//          confirmation - shown only after the first is confirmed.
// Depends on: components/ui/button.tsx
// ------------------------------------------------------------

'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// -- Types -------------------------------------------------------

type ModalStep = {
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel?: string
}

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  steps: [ModalStep] | [ModalStep, ModalStep]
  currentStep?: number
  onNextStep?: () => void
  isDanger?: boolean
}

// -- Constants ---------------------------------------------------

// Selectors for all focusable elements within the modal panel
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// -- Helpers -----------------------------------------------------

// Locks body scroll while modal is open
function useScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return (): void => {
      document.body.style.overflow = previous
    }
  }, [isOpen])
}

// Traps focus within the panel and handles Escape key
function useFocusTrap(
  panelRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  onClose: () => void,
): void {
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!isOpen) return
    // Store the element that opened the modal so we can restore focus on close
    triggerRef.current = document.activeElement

    // Move focus to the first focusable element in the panel
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
    firstFocusable?.focus()

    return (): void => {
      // Restore focus to the trigger element on close
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
    }
  }, [isOpen, panelRef])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !panelRef.current) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [isOpen, panelRef, onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return (): void => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// -- Component ---------------------------------------------------

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  steps,
  currentStep = 0,
  onNextStep,
  isDanger = false,
}: ModalProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null)

  useScrollLock(isOpen)
  useFocusTrap(panelRef, isOpen, onClose)

  if (!isOpen) return null

  const step = steps[currentStep] ?? steps[0]
  const isFinalStep = currentStep >= steps.length - 1
  const cancelLabel = step.cancelLabel ?? 'Cancel'

  // Two-step flow: first confirm advances to step 2, second calls onConfirm
  const handleConfirm = (): void => {
    if (!isFinalStep && onNextStep) {
      onNextStep()
    } else {
      onConfirm()
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg"
      >
        <h2 id="modal-title" className="text-xl font-medium text-text-primary mb-3">
          {step.title}
        </h2>

        <div className="text-sm text-text-secondary mb-6">{step.body}</div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger && isFinalStep ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
          >
            {step.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
