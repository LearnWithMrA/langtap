// ─────────────────────────────────────────────
// File: components/dojo/kotoba-level-group.tsx
// Purpose: Accordion row for a single level group within a Kotoba unit.
//          Header row shows chevron + label + mini progress bar +
//          percentage, plus a small green lock button (or grey reset
//          swap) on the right when the group has at least one word.
//          Expanding reveals a responsive word-tile grid
//          (KotobaWordTile, mobile-first two-column, auto-fill on md+)
//          or a "Coming soon" placeholder when the group has no words
//          in v1.
//          Multi-open by contract: opening a sibling row leaves this
//          row in its existing state. The single-open rule applies to
//          the parent unit accordion, not here.
// Depends on: components/dojo/kotoba-word-tile.tsx,
//             components/dojo/group-bar.tsx,
//             engine/mastery.ts,
//             types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import type { CSSProperties, ReactNode } from 'react'
import { KotobaWordTile } from '@/components/dojo/kotoba-word-tile'
import { UnlockButton } from '@/components/dojo/group-bar'
import { MASTERY_THRESHOLD, progressBarFillClassFromPercent } from '@/engine/mastery'
import type { KotobaLevelGroup, KotobaWord } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaLevelGroupProps = {
  group: KotobaLevelGroup
  words: Readonly<Record<string, KotobaWord>>
  scores: Readonly<Record<string, number>>
  lockedWordIds: ReadonlySet<string>
  isOpen: boolean
  onToggle: (groupId: string) => void
  onWordClick: (word: KotobaWord) => void
  onUnlockGroup: (group: KotobaLevelGroup) => void
}

// ── Helpers ───────────────────────────────────

function groupProgressPercent(
  wordIds: readonly string[],
  scores: Readonly<Record<string, number>>,
): number {
  if (wordIds.length === 0) return 0
  const total = wordIds.reduce((acc, id) => acc + Math.min(scores[id] ?? 0, MASTERY_THRESHOLD), 0)
  return Math.round((total / (wordIds.length * MASTERY_THRESHOLD)) * 100)
}

function countLockedInGroup(
  wordIds: readonly string[],
  lockedWordIds: ReadonlySet<string>,
): number {
  return wordIds.reduce((n, id) => n + (lockedWordIds.has(id) ? 1 : 0), 0)
}

// ── Icons ─────────────────────────────────────

function Chevron({ open, style }: { open: boolean; style: CSSProperties }): ReactNode {
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
      className={['transition-transform duration-150', open ? '' : '-rotate-90'].join(' ')}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Component ─────────────────────────────────

export function KotobaLevelGroupRow({
  group,
  words,
  scores,
  lockedWordIds,
  isOpen,
  onToggle,
  onWordClick,
  onUnlockGroup,
}: KotobaLevelGroupProps): ReactNode {
  const percent = groupProgressPercent(group.wordIds, scores)
  const lockedCount = countLockedInGroup(group.wordIds, lockedWordIds)
  const hasAnyWords = group.wordIds.length > 0
  const panelId = `kotoba-levelgroup-panel-${group.id}`

  return (
    <div className="border-t border-warm-200 first:border-t-0">
      <div className="flex items-center w-full gap-3 min-h-11 px-2 py-3">
        <button
          type="button"
          onClick={(): void => onToggle(group.id)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={[
            'flex items-center flex-1 min-w-0 gap-3',
            'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 rounded-md',
          ].join(' ')}
        >
          <Chevron open={isOpen} style={{ width: 14, height: 14 }} />
          <span className="text-base font-medium text-warm-800 flex-shrink-0">{group.label}</span>

          <div className="flex-1 min-w-0 flex items-center gap-2 ml-2">
            <div
              role="progressbar"
              aria-label={`${group.label} mastery`}
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
          </div>
        </button>

        {hasAnyWords && lockedCount > 0 && (
          <UnlockButton
            size="small"
            color="green-light"
            icon="locked"
            onClick={(): void => onUnlockGroup(group)}
            ariaLabel={`Unlock ${lockedCount} word${lockedCount === 1 ? '' : 's'} in ${group.label}`}
          />
        )}
      </div>

      {isOpen && (
        <div id={panelId} role="region" aria-label={group.label} className="px-2 pb-4">
          {group.wordIds.length === 0 ? (
            <p className="text-sm text-warm-500 text-center py-12">Coming soon</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(144px,1fr))] md:gap-4 justify-items-center">
              {group.wordIds.map((wordId) => {
                const word = words[wordId]
                if (!word) return null
                const score = scores[wordId] ?? 0
                const isLocked = lockedWordIds.has(wordId)
                return (
                  <KotobaWordTile
                    key={wordId}
                    word={word}
                    score={score}
                    isLocked={isLocked}
                    onClick={onWordClick}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
