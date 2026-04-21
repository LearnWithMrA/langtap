// ─────────────────────────────────────────────
// File: components/dojo/kotoba-word-tile.tsx
// Purpose: Single cell in a Kotoba level-group grid. Visually a Kana
//          CharacterTile scaled up to hold two or three rows of text:
//          - Kanji-bearing word (three rows): kanji glyph in the glyph
//            slot, kana reading below, english gloss at the bottom.
//          - Kana-only word (two rows): the kana reading promotes into
//            the glyph slot and the english gloss takes the reading
//            slot. There is no third row; the tile's usable space is
//            filled by the two content rows centred vertically above
//            the progress pill.
//          Visual system ported from CharacterTile:
//          - Warm off-white fill for unlocked non-mastered tiles.
//          - Mastered tiles swap fill to soft gold and recolour text.
//          - 3D keyboard-key effect via asymmetric border (3px sides,
//            6px bottom) driven by progressBarBorderClass().
//          - Mini progress pill at the bottom, same heat contract.
//          - Locked tiles dim to opacity 70 and gain a padlock badge
//            top-right; tapping them opens the UnlockPrompt via the
//            parent client.
// Depends on: engine/mastery.ts, types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import type { CSSProperties, ReactNode } from 'react'
import {
  MASTERY_THRESHOLD,
  isMastered,
  progressBarBorderClass,
  progressBarFillClass,
} from '@/engine/mastery'
import type { KotobaWord } from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaWordTileProps = {
  word: KotobaWord
  score: number
  isLocked: boolean
  onClick: (word: KotobaWord) => void
}

// ── Helpers ───────────────────────────────────

function buildAriaLabel(word: KotobaWord, score: number, isLocked: boolean): string {
  const head = word.kanji ? `Word ${word.kanji}, reading ${word.kana}` : `Word ${word.kana}`
  const gloss = `, meaning ${word.english}`
  if (isLocked) return `${head}${gloss}, locked. Tap to unlock.`
  if (isMastered(score)) return `${head}${gloss}, mastered, mastery ${score}.`
  return `${head}${gloss}, mastery ${score}.`
}

function pillFillPercent(score: number): number {
  if (score <= 0) return 0
  return Math.min(100, Math.round((score / MASTERY_THRESHOLD) * 100))
}

// ── Component ─────────────────────────────────

export function KotobaWordTile({ word, score, isLocked, onClick }: KotobaWordTileProps): ReactNode {
  const mastered = !isLocked && isMastered(score)
  const fill = pillFillPercent(score)
  const fillClass = progressBarFillClass(score)
  const borderClass = progressBarBorderClass(score)

  // Container-query root so text and the progress pill scale
  // proportionally with the tile's rendered width.
  const buttonStyle: CSSProperties = {
    containerType: 'inline-size',
    width: '100%',
    maxWidth: '200px',
    height: 'clamp(96px, calc(30vw + 12px), 128px)',
    paddingTop: 'clamp(6px, 7cqw, 12px)',
    paddingBottom: 'clamp(4px, 6cqw, 10px)',
    paddingLeft: 'clamp(6px, 5cqw, 10px)',
    paddingRight: 'clamp(6px, 5cqw, 10px)',
  }

  const baseClasses = [
    'relative flex flex-col items-center justify-center',
    'rounded-[12px] min-[1028px]:rounded-[16px]',
    'cursor-pointer select-none',
    'border-[3px] border-b-[6px]',
    'transition-transform duration-75',
    'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-sky-500)]',
  ]

  const colourClasses: string[] = [borderClass]
  if (mastered) {
    colourClasses.push('bg-[color:var(--color-heat-gold-fill)]')
  } else {
    colourClasses.push('bg-cream')
  }

  const interactionClasses: string[] = isLocked
    ? ['opacity-70']
    : ['active:translate-y-[3px] active:border-b-[3px]']

  const primaryClass = mastered
    ? 'text-[color:var(--color-heat-gold)]'
    : isLocked
      ? 'text-[#bdbdbd]'
      : 'text-[#3e312e]'

  const secondaryClass = mastered
    ? 'text-[color:var(--color-heat-gold)]'
    : isLocked
      ? 'text-[#bdbdbd]'
      : 'text-[#7b716a]'

  const tertiaryClass = mastered
    ? 'text-[color:var(--color-heat-gold)]'
    : isLocked
      ? 'text-[#bdbdbd]'
      : 'text-[#a0a0a0]'

  const primaryStyle: CSSProperties = {
    fontSize: 'clamp(20px, 17cqw, 30px)',
    lineHeight: 1.1,
  }

  const secondaryStyle: CSSProperties = {
    fontSize: 'clamp(11px, 9cqw, 16px)',
    lineHeight: 1.2,
    marginTop: 'clamp(3px, 3cqw, 6px)',
  }

  const tertiaryStyle: CSSProperties = {
    fontSize: 'clamp(10px, 7cqw, 13px)',
    lineHeight: 1.15,
    marginTop: 'clamp(2px, 2cqw, 4px)',
  }

  const pillStyle: CSSProperties = {
    bottom: 'clamp(4px, 5cqw, 8px)',
    width: 'clamp(36px, 55cqw, 80px)',
    height: 'clamp(3px, 3cqw, 4px)',
  }

  const lockBadgeStyle: CSSProperties = {
    top: 'clamp(3px, 4cqw, 6px)',
    right: 'clamp(3px, 4cqw, 6px)',
    width: 'clamp(12px, 10cqw, 18px)',
    height: 'clamp(12px, 10cqw, 18px)',
  }

  const lockSvgStyle: CSSProperties = {
    width: 'clamp(8px, 6.5cqw, 12px)',
    height: 'clamp(8px, 6.5cqw, 12px)',
  }

  // Kanji-bearing: glyph is kanji, secondary is kana, tertiary is
  // english. Kana-only: glyph is kana, secondary is english, no
  // tertiary row (the tile's flex-justify-center centres the two rows
  // between padding and the progress pill).
  const primaryText = word.kanji ?? word.kana
  const secondaryText = word.kanji ? word.kana : word.english
  const tertiaryText = word.kanji ? word.english : null

  return (
    <button
      type="button"
      onClick={(): void => onClick(word)}
      aria-label={buildAriaLabel(word, score, isLocked)}
      className={[...baseClasses, ...colourClasses, ...interactionClasses].join(' ')}
      style={buttonStyle}
    >
      {isLocked && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center rounded-full bg-black/5 text-[#9c9c9c]"
          style={lockBadgeStyle}
        >
          <svg
            viewBox="0 0 24 24"
            style={lockSvgStyle}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
      )}

      <span className={['font-medium text-center', primaryClass].join(' ')} style={primaryStyle}>
        {primaryText}
      </span>

      <span
        className={['font-medium text-center max-w-full truncate px-1', secondaryClass].join(' ')}
        style={secondaryStyle}
        title={word.kanji ? undefined : word.english}
      >
        {secondaryText}
      </span>

      {tertiaryText && (
        <span
          className={['font-medium text-center max-w-full truncate px-1', tertiaryClass].join(' ')}
          style={tertiaryStyle}
          title={word.english}
        >
          {tertiaryText}
        </span>
      )}

      {/* Mini progress pill: fluid width, centred above the bottom border */}
      <span
        aria-hidden="true"
        className={[
          'absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden',
          isLocked ? 'bg-transparent' : 'bg-[#e5e7eb]',
        ].join(' ')}
        style={pillStyle}
      >
        {!isLocked && (
          <span
            className={['block h-full rounded-full transition-all duration-300', fillClass].join(
              ' ',
            )}
            style={{ width: `${fill}%` }}
          />
        )}
      </span>
    </button>
  )
}
