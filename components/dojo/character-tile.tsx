// ─────────────────────────────────────────────
// File: components/dojo/character-tile.tsx
// Purpose: Single cell in the Kana Dojo gojuon grid. The tile is a
//          fluid container that stays at 76×86 while the grid can give
//          it that width, then scales proportionally down toward a 52px
//          floor when the viewport narrows. Every in-tile dimension
//          (glyph size, romaji size, progress pill width, padding, lock
//          badge size) is expressed in `cqw` (container-query width)
//          clamped between the small-phone and full-size values, so the
//          scaling is linear and in-sync rather than a breakpoint jump.
//          Visual system (ported from the Gemini reference):
//          - Warm off-white fill for unlocked non-mastered tiles.
//          - Mastered tiles swap fill to soft gold and recolour the
//            glyph + romaji to gold.
//          - 3D keyboard-key effect via asymmetric border (3px sides,
//            6px bottom). Border colour walks the heatmap palette via
//            progressBarBorderClass(). Active press shrinks the bottom
//            border and translates the tile down.
//          - Locked tiles keep the warm fill but dim to opacity 70 and
//            gain a small padlock badge in the top-right corner; the
//            glyph block stays vertically centred (no progress bar to
//            clear).
//          - Unlocked tiles pull the glyph block toward the top so the
//            progress pill at the bottom has breathing room.
// Depends on: engine/mastery.ts, types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import type { CSSProperties, ReactNode } from 'react'
import {
  MASTERY_THRESHOLD,
  isMastered,
  progressBarBorderClass,
  progressBarFillClass,
} from '@/engine/mastery'
import type { KanaCharacter } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

type CharacterTileProps = {
  character: KanaCharacter
  score: number
  isLocked: boolean
  onClick: (character: KanaCharacter) => void
}

// ── Helpers ───────────────────────────────────

function buildAriaLabel(character: KanaCharacter, score: number, isLocked: boolean): string {
  if (isLocked) {
    return `Character ${character.kana}, romaji ${character.romaji}, locked. Tap to unlock.`
  }
  if (isMastered(score)) {
    return `Character ${character.kana}, romaji ${character.romaji}, mastered, mastery ${score}.`
  }
  return `Character ${character.kana}, romaji ${character.romaji}, mastery ${score}.`
}

// Mini-pill fill width: 0..100% of the path from 0 to MASTERY_THRESHOLD.
function pillFillPercent(score: number): number {
  if (score <= 0) return 0
  return Math.min(100, Math.round((score / MASTERY_THRESHOLD) * 100))
}

// ── Component ─────────────────────────────────

export function CharacterTile({
  character,
  score,
  isLocked,
  onClick,
}: CharacterTileProps): ReactNode {
  const mastered = !isLocked && isMastered(score)
  const fill = pillFillPercent(score)
  const fillClass = progressBarFillClass(score)
  const borderClass = progressBarBorderClass(score)

  // The tile itself is the container for cqw units inside. Width fills
  // the grid column (capped at 76px). Height uses a separate viewport
  // clamp: 54px at V=320, linearly up to 86px at V=480. Floors on the
  // internal clamps are intentionally low so content truly scales with
  // tile width — at V=375 the kana shrinks to ~20px instead of being
  // locked at the old 20px floor, and by V=320 it's ~16px. The pill,
  // padding, and mt also shrink in sync so the whole cell reads as a
  // smaller copy rather than a tighter squeeze.
  const buttonStyle: CSSProperties = {
    containerType: 'inline-size',
    width: '100%',
    maxWidth: '76px',
    height: 'clamp(54px, calc(20vw - 10px), 86px)',
    paddingTop: isLocked ? undefined : 'clamp(3px, 16cqw, 12px)',
    paddingBottom: isLocked ? 'clamp(2px, 10cqw, 8px)' : undefined,
  }

  const layoutClass = isLocked ? 'justify-center' : ''

  const baseClasses = [
    'relative flex flex-col items-center',
    'rounded-[12px] min-[1028px]:rounded-[16px]',
    'cursor-pointer select-none',
    'border-[3px] border-b-[6px]',
    'transition-transform duration-75',
    'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-sky-500)]',
    layoutClass,
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

  const kanaClass = mastered
    ? 'text-[color:var(--color-heat-gold)]'
    : isLocked
      ? 'text-[#bdbdbd]'
      : 'text-[#4a4a4a]'

  const romajiClass = mastered
    ? 'text-[color:var(--color-heat-gold)]'
    : isLocked
      ? 'text-[#bdbdbd]'
      : 'text-[#a0a0a0]'

  const kanaStyle: CSSProperties = {
    fontSize: 'clamp(12px, 37cqw, 28px)',
    marginTop: isLocked ? 'clamp(1px, 5cqw, 4px)' : undefined,
  }

  const romajiStyle: CSSProperties = {
    fontSize: 'clamp(6px, 17cqw, 13px)',
    marginTop: isLocked ? 'clamp(1px, 5cqw, 4px)' : 'clamp(0.5px, 4cqw, 3px)',
  }

  const pillStyle: CSSProperties = {
    bottom: 'clamp(3px, 10cqw, 8px)',
    width: 'clamp(18px, 63cqw, 48px)',
    height: 'clamp(3px, 5cqw, 4px)',
  }

  const lockBadgeStyle: CSSProperties = {
    top: 'clamp(2px, 8cqw, 6px)',
    right: 'clamp(2px, 8cqw, 6px)',
    width: 'clamp(8px, 21cqw, 16px)',
    height: 'clamp(8px, 21cqw, 16px)',
  }

  const lockSvgStyle: CSSProperties = {
    width: 'clamp(6px, 13cqw, 10px)',
    height: 'clamp(6px, 13cqw, 10px)',
  }

  return (
    <button
      type="button"
      onClick={(): void => onClick(character)}
      aria-label={buildAriaLabel(character, score, isLocked)}
      className={[...baseClasses, ...colourClasses, ...interactionClasses].join(' ')}
      style={buttonStyle}
    >
      {/* Lock badge: top-right corner, scales with the tile */}
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

      <span className={['leading-none font-medium', kanaClass].join(' ')} style={kanaStyle}>
        {character.kana}
      </span>

      <span className={['leading-none font-semibold', romajiClass].join(' ')} style={romajiStyle}>
        {character.romaji}
      </span>

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
