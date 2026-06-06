// ─────────────────────────────────────────────
// File: components/layout/bug-report-modal.tsx
// Purpose: Modal form for submitting bug reports. Type dropdown,
//          description textarea with character counter, optional
//          image upload with client-side MIME/size validation.
//          Calls useBugReport hook for submission.
// Depends on: hooks/useBugReport.ts, stores/settings.store.ts,
//             types/bug-report.types.ts
// ─────────────────────────────────────────────

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import { useBugReport } from '@/hooks/useBugReport'
import { useSettingsStore } from '@/stores/settings.store'
import type { BugReportType, BugReportAppState } from '@/types/bug-report.types'
import { Button } from '@/components/ui/button'

// ── Constants ─────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const MAX_DESCRIPTION_LENGTH = 2000
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

const TYPE_OPTIONS: { value: BugReportType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
]

const STRINGS = {
  title: 'Send Feedback',
  typeLabel: 'Type',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Tell us what happened...',
  screenshotLabel: 'Screenshot (optional)',
  screenshotHelp: 'PNG, JPEG, or WebP. Max 5MB.',
  submit: 'Submit',
  submitting: 'Submitting...',
  cancel: 'Cancel',
  successTitle: 'Thanks for your feedback!',
  successBody: 'Your report has been submitted.',
  close: 'Close',
  fileTooLarge: 'File must be 5MB or smaller',
  invalidFileType: 'File must be PNG, JPEG, or WebP',
  removeFile: 'Remove file',
} as const

// ── Types ─────────────────────────────────────

type BugReportModalProps = {
  isOpen: boolean
  onClose: () => void
}

// ── Helpers ───────────────────────────────────

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) return STRINGS.invalidFileType
  if (file.size > MAX_FILE_SIZE_BYTES) return STRINGS.fileTooLarge
  return null
}

// ── Component ─────────────────────────────────

export function BugReportModal({ isOpen, onClose }: BugReportModalProps): ReactNode {
  const { status, error, cooldownActive, submit, reset } = useBugReport()
  const inputMode = useSettingsStore((s) => s.inputMode)

  const [type, setType] = useState<BugReportType>('bug')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<Element | null>(null)

  const resetForm = useCallback((): void => {
    setType('bug')
    setDescription('')
    setScreenshot(null)
    setFileError(null)
    reset()
  }, [reset])

  const handleClose = useCallback((): void => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return (): void => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Save trigger element on open, restore on close
  useEffect(() => {
    if (!isOpen) return
    triggerRef.current = document.activeElement
    return (): void => {
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
    }
  }, [isOpen])

  // Focus first focusable element on open and after content swap (success view)
  useEffect(() => {
    if (!isOpen) return
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
    firstFocusable?.focus()
  }, [isOpen, status])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }

      if (e.key !== 'Tab' || !panelRef.current) return

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
    }

    document.addEventListener('keydown', handleKeyDown)
    return (): void => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) {
      setScreenshot(null)
      setFileError(null)
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      setFileError(validationError)
      setScreenshot(null)
      if (e.target) e.target.value = ''
      return
    }

    setFileError(null)
    setScreenshot(file)
  }, [])

  const handleRemoveFile = useCallback((): void => {
    setScreenshot(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSubmit = useCallback(async (): Promise<void> => {
    const appState: BugReportAppState = {
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      input_mode: inputMode,
    }

    await submit({ type, description, screenshot: screenshot ?? undefined }, appState)
  }, [type, description, screenshot, inputMode, submit])

  if (!isOpen) return null

  const isSubmitDisabled =
    description.trim().length === 0 || status === 'submitting' || cooldownActive

  const showSuccess = status === 'success'

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-title"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-md shadow-lg"
      >
        {showSuccess ? (
          <>
            <h2 id="bug-report-title" className="text-xl font-medium text-text-primary mb-2">
              {STRINGS.successTitle}
            </h2>
            <p className="text-sm text-text-secondary mb-6">{STRINGS.successBody}</p>
            <Button variant="primary" size="sm" onClick={handleClose}>
              {STRINGS.close}
            </Button>
          </>
        ) : (
          <>
            <h2 id="bug-report-title" className="text-xl font-medium text-text-primary mb-4">
              {STRINGS.title}
            </h2>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label
                  htmlFor="bug-report-type"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  {STRINGS.typeLabel}
                </label>
                <select
                  id="bug-report-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as BugReportType)}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-300"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="bug-report-description"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  {STRINGS.descriptionLabel}
                </label>
                <textarea
                  id="bug-report-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  placeholder={STRINGS.descriptionPlaceholder}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-sage-300"
                />
                <p className="text-xs text-text-muted mt-1 text-right">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </p>
              </div>

              {/* Screenshot */}
              <div>
                <label
                  htmlFor="bug-report-screenshot"
                  className="block text-sm font-medium text-text-primary mb-1"
                >
                  {STRINGS.screenshotLabel}
                </label>
                {screenshot ? (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="truncate flex-1">{screenshot.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      aria-label={STRINGS.removeFile}
                      className="text-text-muted hover:text-text-primary min-w-11 min-h-11 flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <input
                    ref={fileInputRef}
                    id="bug-report-screenshot"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:text-sm file:text-sage-600 file:cursor-pointer hover:file:bg-sage-200"
                  />
                )}
                {fileError && <p className="text-xs text-blush-300 mt-1">{fileError}</p>}
                {!fileError && !screenshot && (
                  <p className="text-xs text-text-muted mt-1">{STRINGS.screenshotHelp}</p>
                )}
              </div>

              {/* Server error */}
              {error && <p className="text-sm text-blush-300">{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <Button className="flex-1" variant="ghost" size="sm" onClick={handleClose}>
                {STRINGS.cancel}
              </Button>
              <Button
                className="flex-1"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                loading={status === 'submitting'}
              >
                {status === 'submitting' ? STRINGS.submitting : STRINGS.submit}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
