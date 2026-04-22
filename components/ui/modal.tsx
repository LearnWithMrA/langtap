// ------------------------------------------------------------
// File: components/ui/modal.tsx
// Purpose: Confirmation modal for destructive or hero-detail flows.
//          Supports one or two sequential steps, an optional third
//          "secondary" action button alongside cancel and confirm, and
//          a ReactNode title so a step can render a big hero glyph
//          (e.g. the Kotoba word popover) in place of a plain heading.
//          Accessibility: focus trap, Escape to close, scroll lock,
//          focus restore, backdrop click to close, role="dialog".
//          Footer buttons are laid out as equal-width flex children so
//          short and long labels line up cleanly.
// Depends on: components/ui/button.tsx
// ------------------------------------------------------------

'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// -- Types -------------------------------------------------------

type ModalStep = {
  title: ReactNode
  body: ReactNode
  confirmLabel: string
  cancelLabel?: string
}

export type ModalSecondaryAction = {
  label: string
  onClick: () => void
}

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  steps: [ModalStep] | [ModalStep, ModalStep]
  currentStep?: number
  onNextStep?: () => void
  isDanger?: boolean
  secondaryAction?: ModalSecondaryAction
  confirmClassName?: string
}

// -- Constants ---------------------------------------------------

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// -- Helpers -----------------------------------------------------

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

function useFocusTrap(
  panelRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  onClose: () => void,
): void {
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!isOpen) return
    triggerRef.current = document.activeElement

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
    firstFocusable?.focus()

    return (): void => {
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
  secondaryAction,
  confirmClassName,
}: ModalProps): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null)

  useScrollLock(isOpen)
  useFocusTrap(panelRef, isOpen, onClose)

  if (!isOpen) return null

  const step = steps[currentStep] ?? steps[0]
  const isFinalStep = currentStep >= steps.length - 1
  const cancelLabel = step.cancelLabel ?? 'Cancel'

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
      <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />

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

        {/* Footer buttons share equal width via flex-1 so short labels
            (Yes / No) and long labels (Reset progress / Mark mastered)
            never visually mismatch within the same modal. */}
        <div className="flex gap-3">
          <Button className="flex-1" variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          {secondaryAction && (
            <Button
              className="flex-1"
              variant="secondary"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            className={`flex-1 ${confirmClassName ?? ''}`}
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
