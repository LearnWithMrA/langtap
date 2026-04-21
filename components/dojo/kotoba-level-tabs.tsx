// ─────────────────────────────────────────────
// File: components/dojo/kotoba-level-tabs.tsx
// Purpose: N5-N1 JLPT level tab row for the Kotoba Dojo. Single-select,
//          roving tabindex, ARIA tablist semantics. Visually a row of
//          key-style buttons: active uses mint-500 fill, inactive uses
//          sage-100. Horizontal scroll on very narrow viewports so the
//          row never wraps or overflows the content column.
//          Tab change is a plain onChange callback; the parent owns the
//          active level and is expected to reflect it in the URL
//          (`?level=n5`) so the tab is deep-linkable.
// Depends on: types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { JLPT_LABELS, JLPT_ORDER } from '@/types/kotoba.types'
import type { JlptLevel } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaLevelTabsProps = {
  active: JlptLevel
  onChange: (level: JlptLevel) => void
  tabPanelId: string
}

// ── Component ─────────────────────────────────

export function KotobaLevelTabs({ active, onChange, tabPanelId }: KotobaLevelTabsProps): ReactNode {
  const refs = useRef<Record<JlptLevel, HTMLButtonElement | null>>({
    n5: null,
    n4: null,
    n3: null,
    n2: null,
    n1: null,
  })

  const focusLevel = (level: JlptLevel): void => {
    refs.current[level]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const max = JLPT_ORDER.length - 1
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = index === max ? 0 : index + 1
      const target = JLPT_ORDER[next]
      onChange(target)
      focusLevel(target)
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const next = index === 0 ? max : index - 1
      const target = JLPT_ORDER[next]
      onChange(target)
      focusLevel(target)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      const target = JLPT_ORDER[0]
      onChange(target)
      focusLevel(target)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      const target = JLPT_ORDER[max]
      onChange(target)
      focusLevel(target)
    }
  }

  return (
    <div role="tablist" aria-label="JLPT level" className="flex gap-2 pb-2 -mx-1 px-1 w-full">
      {JLPT_ORDER.map((level, index) => {
        const isActive = level === active
        return (
          <button
            key={level}
            ref={(el): void => {
              refs.current[level] = el
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={tabPanelId}
            tabIndex={isActive ? 0 : -1}
            onClick={(): void => onChange(level)}
            onKeyDown={(event): void => handleKeyDown(event, index)}
            className={[
              'flex-1 min-h-11 min-w-0 rounded-lg font-bold',
              'px-2 min-[380px]:px-3 sm:px-4',
              'border-b-[4px] transition-transform duration-75',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500',
              isActive
                ? 'bg-mint-500 text-white border-b-[color:var(--color-sage-600)] active:translate-y-[1px] active:border-b-[2px]'
                : 'bg-sage-100 text-warm-700 border-b-sage-200 hover:bg-sage-200 active:translate-y-[1px] active:border-b-[2px]',
            ].join(' ')}
          >
            {JLPT_LABELS[level]}
          </button>
        )
      })}
    </div>
  )
}
