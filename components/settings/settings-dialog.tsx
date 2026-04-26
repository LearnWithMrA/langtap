// ─────────────────────────────────────────────
// File: components/settings/settings-dialog.tsx
// Purpose: Game settings dialog overlay. Centered card with translucent
//          backdrop. Controls practice direction, hints, audio, and
//          pacing. Opens from the gear icon in AppTopBar. Focus trap,
//          Escape to close, scroll lock.
// Depends on: stores/settings.store.ts, types/settings.types.ts
// ─────────────────────────────────────────────

'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings.store'
import type { InputDirection, KotobaInput, AutoAdvance } from '@/types/settings.types'

// ── Constants ─────────────────────────────────

const INPUT_DIRECTION_OPTIONS: { value: InputDirection; label: string; recommended?: boolean }[] = [
  { value: 'kana-to-romaji', label: 'Kana to Romaji' },
  { value: 'alternate', label: 'Alternate' },
  { value: 'romaji-to-kana', label: 'Romaji to Kana' },
]

const KOTOBA_INPUT_OPTIONS: { value: KotobaInput; label: string; badge?: string }[] = [
  { value: 'readings', label: 'Readings' },
  { value: 'kanji', label: 'Kanji', badge: '4x points' },
]

const AUTO_ADVANCE_OPTIONS: { value: AutoAdvance; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'delayed', label: 'Delayed' },
]

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="switch"]',
  '[role="radio"]',
].join(', ')

// ── Sub-components ────────────────────────────

function SectionLabel({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-1.5">{children}</p>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  sublabel,
  ariaLabel,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  sublabel: string
  ariaLabel: string
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-warm-700">{label}</p>
        <p className="text-xs text-warm-400">{sublabel}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={(): void => onChange(!checked)}
        style={{ width: 40, height: 24 }}
        className={[
          'relative rounded-full transition-colors duration-150 flex-shrink-0 overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-sage-300',
          checked ? 'bg-sage-500' : 'bg-warm-200',
        ].join(' ')}
      >
        <span
          style={{ width: 20, height: 20, top: 2, left: checked ? 18 : 2 }}
          className="absolute bg-white rounded-full shadow-sm transition-all duration-150"
        />
      </button>
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; recommended?: boolean }[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}): ReactNode {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="rounded-xl bg-warm-100 p-1 flex gap-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={(): void => onChange(option.value)}
          className={[
            'flex-1 rounded-lg px-2 py-0.5 text-sm flex items-center justify-center transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-sage-300',
            value === option.value
              ? 'bg-sage-500 text-white shadow-sm font-medium'
              : 'text-warm-500 hover:text-warm-600',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────

export function SettingsDialog(): ReactNode {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = useSettingsStore((s) => s.isSettingsOpen)
  const closeSettings = useSettingsStore((s) => s.closeSettings)
  const inputDirection = useSettingsStore((s) => s.inputDirection)
  const setInputDirection = useSettingsStore((s) => s.setInputDirection)
  const kotobaInput = useSettingsStore((s) => s.kotobaInput)
  const setKotobaInput = useSettingsStore((s) => s.setKotobaInput)
  const mnemonics = useSettingsStore((s) => s.mnemonics)
  const setMnemonics = useSettingsStore((s) => s.setMnemonics)

  const wordAudio = useSettingsStore((s) => s.wordAudio)
  const setWordAudio = useSettingsStore((s) => s.setWordAudio)
  const keyClicks = useSettingsStore((s) => s.keyClicks)
  const setKeyClicks = useSettingsStore((s) => s.setKeyClicks)
  const autoAdvance = useSettingsStore((s) => s.autoAdvance)
  const setAutoAdvance = useSettingsStore((s) => s.setAutoAdvance)

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return (): void => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Focus trap and Escape handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (!isOpen || !panelRef.current) return

      if (e.key === 'Escape') {
        e.preventDefault()
        closeSettings()
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
    [isOpen, closeSettings],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return (): void => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Focus the close button on open
  useEffect(() => {
    if (!isOpen || !panelRef.current) return
    const closeBtn = panelRef.current.querySelector<HTMLElement>('[data-close-btn]')
    closeBtn?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeSettings}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-warm-800/40 backdrop-blur-sm" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Game settings"
        onClick={(e): void => e.stopPropagation()}
        className="relative bg-surface-raised border border-border rounded-2xl w-full max-w-sm shadow-lg max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-4 pb-1 flex-shrink-0">
          <h2 className="text-lg font-bold text-warm-800">Settings</h2>
          <button
            type="button"
            data-close-btn
            onClick={closeSettings}
            aria-label="Close settings"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-300"
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <line x1={5} y1={5} x2={15} y2={15} />
              <line x1={5} y1={15} x2={15} y2={5} />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-4 overflow-y-auto flex-1">
          {/* Input section */}
          <div className="py-2.5 border-b border-border">
            <SectionLabel>Kana Input</SectionLabel>
            <SegmentedControl
              options={INPUT_DIRECTION_OPTIONS}
              value={inputDirection}
              onChange={setInputDirection}
              ariaLabel="Practice direction"
            />
          </div>

          {/* Kotoba Input section */}
          <div className="py-2.5 border-b border-border">
            <SectionLabel>Kotoba Input</SectionLabel>
            <div
              role="radiogroup"
              aria-label="Kotoba input mode"
              className="rounded-xl bg-warm-100 p-1 flex gap-0.5"
            >
              {KOTOBA_INPUT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={kotobaInput === option.value}
                  onClick={(): void => setKotobaInput(option.value)}
                  className={[
                    'flex-1 rounded-lg px-2 py-0.5 text-sm transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-sage-300',
                    kotobaInput === option.value
                      ? 'bg-sage-500 text-white shadow-sm font-medium'
                      : 'text-warm-500 hover:text-warm-600',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {option.label}
                    {option.badge && (
                      <span
                        className={[
                          'text-xs font-medium',
                          kotobaInput === option.value ? 'text-white/70' : 'text-sage-500',
                        ].join(' ')}
                      >
                        {option.badge}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Hints section */}
          <div className="py-2.5 border-b border-border">
            <SectionLabel>Hints</SectionLabel>
            <Toggle
              checked={mnemonics}
              onChange={setMnemonics}
              label="Memory hints"
              sublabel="Show hints on wrong answers"
              ariaLabel="Toggle memory hints"
            />
          </div>

          {/* Audio section */}
          <div className="py-2.5 border-b border-border">
            <SectionLabel>Audio</SectionLabel>
            <div className="flex flex-col gap-1">
              <Toggle
                checked={wordAudio}
                onChange={setWordAudio}
                label="Pronunciation"
                sublabel="Play audio after answers"
                ariaLabel="Toggle pronunciation audio"
              />
              <Toggle
                checked={keyClicks}
                onChange={setKeyClicks}
                label="Key click sounds"
                sublabel="Mechanical click on button presses"
                ariaLabel="Toggle key click sounds"
              />
            </div>
          </div>

          {/* Pacing section */}
          <div className="pt-2.5">
            <SectionLabel>Pacing</SectionLabel>
            <p className="text-xs text-warm-400 mb-1.5">When to move on to new word</p>
            <SegmentedControl
              options={AUTO_ADVANCE_OPTIONS}
              value={autoAdvance}
              onChange={setAutoAdvance}
              ariaLabel="Auto-advance mode"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
