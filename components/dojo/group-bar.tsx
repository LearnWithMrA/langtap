// ─────────────────────────────────────────────
// File: components/dojo/group-bar.tsx
// Purpose: Shared heading + progress + unlock-action row used at both the
//          script level (Hiragana / Katakana) and the stage level (Seion /
//          Dakuon / Yoon) of the Kana Dojo.
//          Design ported from the Gemini reference:
//          - Chevron + heading (clickable to collapse/expand)
//          - Progress bar: 8px pill with grey unprogressed track and a
//            heatmap-coloured fill driven by total mastery progress.
//          - Bold 13px percentage readout on the right.
//          - "Unlock All" action button in a 3D blue key style. Three
//            sizes: large (for the master H1 button rendered by the
//            parent), medium for script-level bars, small for stage-level
//            bars. Size is derived from the `level` prop here.
//          Progress % formula: Σ min(score_i, MASTERY_THRESHOLD) / (n × MASTERY_THRESHOLD),
//          total mastery across every character in the group.
// Depends on: engine/mastery.ts, types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import type { CSSProperties, ReactNode } from 'react'
import { MASTERY_THRESHOLD, progressBarFillClassFromPercent } from '@/engine/mastery'
import type { KanaCharacter } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

export type GroupActivity = 'active' | 'completed' | 'future' | 'in-progress' | 'normal'
export type GroupLevel = 'script' | 'stage'

type GroupBarProps = {
  label: string
  level: GroupLevel
  activity: GroupActivity
  isOpen: boolean
  onToggle: () => void
  characters: readonly KanaCharacter[]
  scores: Readonly<Record<string, number>>
  lockedCount: number
  onUnlock?: () => void
  onReset?: () => void
  controlsId: string
}

// ── Helpers ───────────────────────────────────

// Total mastery progress percentage across a set of characters.
function groupProgressPercent(
  characters: readonly KanaCharacter[],
  scores: Readonly<Record<string, number>>,
): number {
  if (characters.length === 0) return 0
  const total = characters.reduce(
    (acc, c) => acc + Math.min(scores[c.id] ?? 0, MASTERY_THRESHOLD),
    0,
  )
  return Math.round((total / (characters.length * MASTERY_THRESHOLD)) * 100)
}

// ── Icons ─────────────────────────────────────

function Chevron({ open, sizeStyle }: { open: boolean; sizeStyle: CSSProperties }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={sizeStyle}
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

// ── Unlock icon button (shared 3D blue style) ─

type UnlockButtonSize = 'large' | 'medium' | 'small'
// `dark` / `medium` / `light` are the Kana sky-blue tiers.
// `green-dark` / `green-medium` / `green-light` are the Kotoba sage-green
// tiers; semantically equivalent, just on a different palette so the
// two dojos read as siblings without sharing a look.
// `grey` is the shared "everything unlocked, tap to reset" state.
type UnlockButtonColor =
  | 'dark'
  | 'medium'
  | 'light'
  | 'green-dark'
  | 'green-medium'
  | 'green-light'
  | 'grey'
type UnlockButtonIcon = 'locked' | 'unlocked'

type UnlockButtonProps = {
  size: UnlockButtonSize
  color: UnlockButtonColor
  icon: UnlockButtonIcon
  onClick: () => void
  ariaLabel: string
}

// Size controls outer dimensions, corner radius, bottom-border width,
// and the active-press translate. The lock glyph inside uses its own
// clamp (ICON_GLYPH_STYLES) so the icon gets visually smaller at each
// tier even though every button keeps the keyboard-key shape.
const UNLOCK_BUTTON_SIZE_CLASSES: Record<UnlockButtonSize, string> = {
  large:
    'border-b-[clamp(2px,calc(1.25vw-2px),4px)] active:translate-y-[2px] active:border-b-[2px]',
  medium: 'border-b-[clamp(2px,calc(0.625vw),3px)] active:translate-y-[1px] active:border-b-[2px]',
  small: 'border-b-[clamp(2px,calc(0.625vw),3px)] active:translate-y-[1px] active:border-b-[2px]',
}

const UNLOCK_BUTTON_SIZE_STYLES: Record<UnlockButtonSize, CSSProperties> = {
  large: {
    width: 'clamp(30px, calc(6.25vw + 10px), 40px)',
    height: 'clamp(30px, calc(6.25vw + 10px), 40px)',
    borderRadius: 'clamp(6px, 2vw, 8px)',
  },
  medium: {
    width: 'clamp(24px, calc(5vw + 8px), 32px)',
    height: 'clamp(24px, calc(5vw + 8px), 32px)',
    borderRadius: 'clamp(5px, 1.5vw, 7px)',
  },
  small: {
    width: 'clamp(20px, calc(5vw + 4px), 28px)',
    height: 'clamp(20px, calc(5vw + 4px), 28px)',
    borderRadius: 'clamp(4px, 1.25vw, 6px)',
  },
}

// Icon glyph sizes (inside the button). Smaller per tier so the
// master action reads strongest, script next, stage lightest/smallest.
const ICON_GLYPH_STYLES: Record<UnlockButtonSize, CSSProperties> = {
  large: {
    width: 'clamp(14px, calc(3.75vw + 2px), 20px)',
    height: 'clamp(14px, calc(3.75vw + 2px), 20px)',
  },
  medium: {
    width: 'clamp(12px, calc(2.5vw + 4px), 16px)',
    height: 'clamp(12px, calc(2.5vw + 4px), 16px)',
  },
  small: {
    width: 'clamp(10px, calc(2.5vw + 2px), 14px)',
    height: 'clamp(10px, calc(2.5vw + 2px), 14px)',
  },
}

// Colour controls the fill + bottom-border colour only. Every tier
// renders at 85% opacity so the button reads as softly translucent
// against the dojo background. The `grey` tier is used for the
// "everything unlocked, tap to reset" state.
const UNLOCK_BUTTON_COLOR_CLASSES: Record<UnlockButtonColor, string> = {
  dark: 'bg-sky-600/85 border-b-sky-700/85',
  medium: 'bg-sky-500/85 border-b-sky-600/85',
  light: 'bg-sky-400/85 border-b-sky-500/85',
  // Kotoba tiers use sage-greens to echo the pale-green page wash and
  // the mint-500 active tab without introducing new tokens.
  'green-dark': 'bg-sage-600/85 border-b-[color:var(--color-sage-600)]',
  'green-medium': 'bg-sage-500/85 border-b-sage-600/85',
  'green-light': 'bg-sage-400/85 border-b-sage-500/85',
  grey: 'bg-warm-400/85 border-b-warm-600/85',
}

function LockGlyph({ style, open }: { style: CSSProperties; open: boolean }): ReactNode {
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
    >
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      {/* Closed shackle connects on both sides; open shackle drops the
          right descender so the right leg reads as detached. */}
      {open ? <path d="M7 11V7a5 5 0 0 1 10 0" /> : <path d="M7 11V7a5 5 0 0 1 10 0v4" />}
    </svg>
  )
}

export function UnlockButton({
  size,
  color,
  icon,
  onClick,
  ariaLabel,
}: UnlockButtonProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center justify-center flex-shrink-0',
        'text-white',
        'transition-transform duration-75',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700',
        UNLOCK_BUTTON_SIZE_CLASSES[size],
        UNLOCK_BUTTON_COLOR_CLASSES[color],
      ].join(' ')}
      style={UNLOCK_BUTTON_SIZE_STYLES[size]}
    >
      <LockGlyph style={ICON_GLYPH_STYLES[size]} open={icon === 'unlocked'} />
    </button>
  )
}

// ── GroupBar ──────────────────────────────────

// Every text size / icon size in the group bar scales with viewport so
// the whole row fits cleanly on a 320px phone without any single piece
// going past the edge.
const HEADING_STYLE: Record<GroupLevel, CSSProperties> = {
  script: { fontSize: 'clamp(14px, calc(3.75vw + 2px), 20px)' },
  stage: { fontSize: 'clamp(12px, calc(2.5vw + 4px), 16px)' },
}

const CHEVRON_STYLE: Record<GroupLevel, CSSProperties> = {
  script: {
    width: 'clamp(10px, calc(2.5vw + 2px), 14px)',
    height: 'clamp(10px, calc(2.5vw + 2px), 14px)',
  },
  stage: {
    width: 'clamp(9px, calc(1.875vw + 3px), 12px)',
    height: 'clamp(9px, calc(1.875vw + 3px), 12px)',
  },
}

// Script buttons are medium and stage buttons are small so the icon
// visibly shrinks at each tier (master large → script medium → stage
// small). The 4px outer-width difference between medium and small
// icon buttons is small enough that bar widths still read as aligned.
const BUTTON_SIZE: Record<GroupLevel, UnlockButtonSize> = {
  script: 'medium',
  stage: 'small',
}

const BUTTON_COLOR: Record<GroupLevel, UnlockButtonColor> = {
  script: 'medium',
  stage: 'light',
}

const PERCENT_STYLE: CSSProperties = {
  fontSize: 'clamp(10px, calc(1.875vw + 4px), 13px)',
}

// Both tiers share the same heading min-width so the bar / percentage /
// unlock button that follow all line up across script and stage rows.
// Stage additionally gets internal padding-left to shift the chevron +
// heading right into a sub-bullet indent; because box-sizing is
// border-box and paddingLeft is inside min-width, the button's outer
// width stays pinned at 145px and the progress bar still starts at the
// same x as the script rows.
const HEADING_BUTTON_STYLE: Record<GroupLevel, CSSProperties> = {
  script: { minWidth: 'clamp(95px, calc(31.25vw - 5px), 145px)' },
  stage: {
    minWidth: 'clamp(95px, calc(31.25vw - 5px), 145px)',
    paddingLeft: 'clamp(16px, 5vw, 24px)',
  },
}

export function GroupBar({
  label,
  level,
  activity,
  isOpen,
  onToggle,
  characters,
  scores,
  lockedCount,
  onUnlock,
  onReset,
  controlsId,
}: GroupBarProps): ReactNode {
  const percent = groupProgressPercent(characters, scores)
  const headingColour = activity === 'future' ? 'text-warm-400' : 'text-[#3e312e]'

  return (
    <div className="flex items-center w-full gap-2 min-[480px]:gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={controlsId}
        className="flex items-center gap-2 min-[480px]:gap-3 min-h-11 flex-shrink-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-sky-500)] rounded-md"
        style={HEADING_BUTTON_STYLE[level]}
      >
        <Chevron open={isOpen} sizeStyle={CHEVRON_STYLE[level]} />
        <h2
          className={['font-semibold leading-none', headingColour].join(' ')}
          style={HEADING_STYLE[level]}
        >
          {label}
        </h2>
      </button>

      {/* Progress track + fill */}
      <div className="flex-1 min-w-0 flex items-center gap-2 min-[480px]:gap-4">
        <div
          role="progressbar"
          aria-label={`${label} progress`}
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
        <span
          className="font-bold tabular-nums text-[#7b716a] text-right flex-shrink-0"
          style={PERCENT_STYLE}
        >
          {percent}%
        </span>
      </div>

      {lockedCount > 0 && onUnlock ? (
        <UnlockButton
          size={BUTTON_SIZE[level]}
          color={BUTTON_COLOR[level]}
          icon="locked"
          onClick={onUnlock}
          ariaLabel={`Unlock ${lockedCount} character${lockedCount === 1 ? '' : 's'} in ${label}`}
        />
      ) : onReset ? (
        <UnlockButton
          size={BUTTON_SIZE[level]}
          color="grey"
          icon="unlocked"
          onClick={onReset}
          ariaLabel={`Reset progress on all characters in ${label}`}
        />
      ) : null}
    </div>
  )
}
