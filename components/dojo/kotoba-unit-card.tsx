// ─────────────────────────────────────────────
// File: components/dojo/kotoba-unit-card.tsx
// Purpose: Summary card for a single Kotoba unit. The card is always
//          expandable: tapping any non-button surface toggles the
//          unit's level-group accordion underneath. Variant styling:
//          - default (at least one word below MASTERY_THRESHOLD)
//          - completed (every word at or above MASTERY_THRESHOLD and
//            unlocked)
//          When locked words remain in the unit, a medium green lock
//          button sits inline with the progress bar and percentage so
//          the user can bulk-unlock the whole unit without entering
//          the accordion first. The card uses role="button" on a div
//          rather than a nested <button>, so the lock button can live
//          inside the card without nesting buttons.
// Depends on: components/dojo/group-bar.tsx, engine/mastery.ts,
//             types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { UnlockButton } from '@/components/dojo/group-bar'
import { MASTERY_THRESHOLD, progressBarFillClassFromPercent } from '@/engine/mastery'
import type { KotobaUnit, KotobaWord } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaUnitCardProps = {
  unit: KotobaUnit
  words: Readonly<Record<string, KotobaWord>>
  scores: Readonly<Record<string, number>>
  lockedWordIds: ReadonlySet<string>
  isOpen: boolean
  onToggle: (unitId: string) => void
  onUnlockUnit: (unit: KotobaUnit) => void
  onResetUnit: (unit: KotobaUnit) => void
  controlsId: string
}

// ── Helpers ───────────────────────────────────

function allUnitWordIds(unit: KotobaUnit): string[] {
  return unit.groups.flatMap((g) => [...g.wordIds])
}

function unitProgressPercent(unit: KotobaUnit, scores: Readonly<Record<string, number>>): number {
  const wordIds = allUnitWordIds(unit)
  if (wordIds.length === 0) return 0
  const total = wordIds.reduce((acc, id) => acc + Math.min(scores[id] ?? 0, MASTERY_THRESHOLD), 0)
  return Math.round((total / (wordIds.length * MASTERY_THRESHOLD)) * 100)
}

function isCompleted(
  unit: KotobaUnit,
  scores: Readonly<Record<string, number>>,
  lockedWordIds: ReadonlySet<string>,
): boolean {
  const wordIds = allUnitWordIds(unit)
  if (wordIds.length === 0) return false
  return wordIds.every((id) => !lockedWordIds.has(id) && (scores[id] ?? 0) >= MASTERY_THRESHOLD)
}

function countLockedInUnit(unit: KotobaUnit, lockedWordIds: ReadonlySet<string>): number {
  return allUnitWordIds(unit).reduce((n, id) => n + (lockedWordIds.has(id) ? 1 : 0), 0)
}

// ── Icons ─────────────────────────────────────

function CheckIcon({ style }: { style?: CSSProperties }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block"
    >
      <polyline points="5 13 10 18 19 7" />
    </svg>
  )
}

// ── Component ─────────────────────────────────

export function KotobaUnitCard({
  unit,
  words,
  scores,
  lockedWordIds,
  isOpen,
  onToggle,
  onUnlockUnit,
  onResetUnit,
  controlsId,
}: KotobaUnitCardProps): ReactNode {
  const percent = unitProgressPercent(unit, scores)
  const lockedCount = countLockedInUnit(unit, lockedWordIds)
  const completed = isCompleted(unit, scores, lockedWordIds)
  // Suppress unused warning: `words` is reserved for future per-card detail.
  void words

  const variantClasses = completed
    ? 'bg-mint-100 border-mint-300 text-warm-800'
    : 'bg-sage-50 border-sage-200 text-warm-800'

  const wordCount = allUnitWordIds(unit).length
  const ariaLabel = [
    unit.label,
    unit.levelRange,
    `${percent}% mastered across ${wordCount} word${wordCount === 1 ? '' : 's'}`,
    isOpen ? 'open' : 'closed',
  ].join(', ')

  const handleToggle = (): void => onToggle(unit.id)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  const stopPropagation = (event: MouseEvent | KeyboardEvent): void => {
    event.stopPropagation()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      aria-label={ariaLabel}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={[
        'relative w-full cursor-pointer select-none rounded-xl border p-4',
        'transition-transform duration-75',
        'hover:translate-y-[-1px] hover:shadow-sm active:translate-y-[0px]',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500',
        variantClasses,
      ].join(' ')}
    >
      {completed && (
        <span className="absolute top-3 right-3 text-mint-500" aria-hidden="true">
          <CheckIcon style={{ width: 18, height: 18 }} />
        </span>
      )}

      <h3 className="text-lg font-semibold leading-tight">{unit.label}</h3>
      <p className="text-sm text-warm-600 mt-1">{unit.levelRange}</p>

      <div className="mt-4 flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={`${unit.label} mastery`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="flex-1 h-2 rounded-full bg-[#e5e7eb] overflow-hidden"
        >
          <div
            className={[
              'h-full rounded-full transition-all duration-300',
              progressBarFillClassFromPercent(percent),
            ].join(' ')}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-bold tabular-nums text-warm-600">{percent}%</span>
        <span onClick={stopPropagation} onKeyDown={stopPropagation}>
          {lockedCount > 0 ? (
            <UnlockButton
              size="medium"
              color="green-medium"
              icon="locked"
              onClick={(): void => onUnlockUnit(unit)}
              ariaLabel={`Unlock ${lockedCount} word${lockedCount === 1 ? '' : 's'} in ${unit.label}`}
            />
          ) : (
            <UnlockButton
              size="medium"
              color="grey"
              icon="unlocked"
              onClick={(): void => onResetUnit(unit)}
              ariaLabel={`Reset progress on all words in ${unit.label}`}
            />
          )}
        </span>
      </div>
    </div>
  )
}
