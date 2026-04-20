// ─────────────────────────────────────────────
// File: components/dojo/character-grid.tsx
// Purpose: Gojuon grid renderer. Two orientations off the same data,
//          switched at exactly the viewport width where the horizontal
//          grid would otherwise clip:
//          - Vertical (default, rendered below `min-[1028px]`): vowel
//            columns across the top, consonant rows down the side. Five
//            cells wide (three for yoon). Tiles scale down to 52×60 so
//            the whole grid is ~328px wide and fits a 375px viewport
//            with room to spare. The grid is horizontally centred via
//            `flex justify-center`, with `overflow-x-auto` as a safety
//            net for sub-360px phones.
//          - Horizontal (`hidden min-[1028px]:grid`): consonant columns
//            across the top, vowel rows down the side. Tiles stay at
//            76×86. Grid width is 988px and the `min-[1028px]` breakpoint
//            is chosen so the flip happens the instant the desktop grid
//            would start clipping (988px grid + 40px outer px-5 = 1028px).
//          Each breakpoint renders a single CSS Grid with an explicit
//          `grid-template-columns` so the header row and every data row
//          share the exact same column tracks.
//          Empty cells (や-row has no い/え, わ-row has only wa/wo, など)
//          render as transparent placeholders sized to match the active
//          breakpoint's tile.
// Depends on: components/dojo/character-tile.tsx, types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { CharacterTile } from '@/components/dojo/character-tile'
import type { KanaCharacter } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

type CharacterGridProps = {
  characters: readonly KanaCharacter[]
  scores: Readonly<Record<string, number>>
  lockedIds: ReadonlySet<string>
  onTileClick: (character: KanaCharacter) => void
}

type Axes = {
  rowKeys: readonly string[]
  columnKeys: readonly string[]
  lookup: ReadonlyMap<string, KanaCharacter>
}

// ── Helpers ───────────────────────────────────

// Formats a consonant row key for display on the axis. The pure-vowel
// "a" row needs no label (it's implied by the vowel headers on the
// other axis), so it renders blank. Standalone `n` keeps its label as
// there's no vowel to imply. Every other row (`ka`, `kya`, `cha`, etc.)
// drops its trailing 'a' and gains a trailing dash to read as a
// consonant prefix (`k-`, `ky-`, `ch-`).
function consonantLabel(row: string): string {
  if (row === 'a') return ''
  if (row === 'n') return 'n'
  if (row.endsWith('a') && row.length > 1) return row.slice(0, -1) + '-'
  return row
}

// Returns row and column axis keys in first-seen order, plus a lookup
// keyed by "row|column" for O(1) cell resolution.
function deriveAxes(characters: readonly KanaCharacter[]): Axes {
  const rowKeys: string[] = []
  const columnKeys: string[] = []
  const seenRows = new Set<string>()
  const seenColumns = new Set<string>()
  const lookup = new Map<string, KanaCharacter>()
  for (const c of characters) {
    if (!seenRows.has(c.row)) {
      seenRows.add(c.row)
      rowKeys.push(c.row)
    }
    if (!seenColumns.has(c.column)) {
      seenColumns.add(c.column)
      columnKeys.push(c.column)
    }
    lookup.set(`${c.row}|${c.column}`, c)
  }
  return { rowKeys, columnKeys, lookup }
}

// ── Sub-components ────────────────────────────

type CellProps = {
  character: KanaCharacter | undefined
  scores: Readonly<Record<string, number>>
  lockedIds: ReadonlySet<string>
  onTileClick: (character: KanaCharacter) => void
}

function Cell({ character, scores, lockedIds, onTileClick }: CellProps): ReactNode {
  if (!character) {
    // Transparent placeholder sized to match the tile's fluid scaling:
    // fills the grid column width, uses the same viewport-based height
    // clamp as CharacterTile so grid rows stay aligned.
    return (
      <div
        className="w-full max-w-[76px]"
        style={{ height: 'clamp(54px, calc(20vw - 10px), 86px)' }}
        aria-hidden="true"
      />
    )
  }
  return (
    <CharacterTile
      character={character}
      score={scores[character.id] ?? 0}
      isLocked={lockedIds.has(character.id)}
      onClick={onTileClick}
    />
  )
}

// ── Component ─────────────────────────────────

export function CharacterGrid({
  characters,
  scores,
  lockedIds,
  onTileClick,
}: CharacterGridProps): ReactNode {
  const { rowKeys, columnKeys, lookup } = deriveAxes(characters)

  // Vertical layout: every grid (seion 5-col, dakuon 5-col, yoon 3-col)
  // uses the SAME viewport-based tile width so Seion/Dakuon and Yoon
  // shrink in sync. Formula: tile = 0.2 * viewport - 20, clamped to
  // [44, 76]. At V=480 the tile is 76px (full); at V=320 (smallest
  // supported phone) the tile is 44px and the whole grid (20 + 5·44 + 5·8
  // = 280) fits inside the viewport after the 40px outer padding.
  const fluidTile = 'clamp(44px, calc(20vw - 20px), 76px)'
  const mobileTemplate = `20px repeat(${columnKeys.length}, ${fluidTile})`

  // Horizontal layout: fixed tile size because the breakpoint
  // (min-[1028px]) guarantees there's always room for the full grid.
  const desktopTemplate = `20px repeat(${rowKeys.length}, 76px)`

  return (
    <>
      {/* Vertical (default, shown below min-[1028px]). Centred via
          flex justify-center; tiles scale fluidly via the shared clamp()
          tile width so Seion/Dakuon/Yoon all resize together.
          overflow-x-auto is the safety net for sub-min-tile-width phones. */}
      <div className="min-[1028px]:hidden flex justify-center overflow-x-auto">
        <div className="grid gap-2 items-center" style={{ gridTemplateColumns: mobileTemplate }}>
          {/* Header row: empty gutter + column labels */}
          <span aria-hidden="true" />
          {columnKeys.map((colKey) => (
            <span
              key={`m-h-${colKey}`}
              className="text-center text-[13px] font-semibold text-[#a3acb3] tabular-nums"
            >
              {colKey}
            </span>
          ))}

          {/* Data rows: row label + N cells */}
          {rowKeys.map((rowKey) => (
            <Fragment key={`m-r-${rowKey}`}>
              <span className="text-right text-[13px] font-semibold text-[#a3acb3] tabular-nums">
                {consonantLabel(rowKey)}
              </span>
              {columnKeys.map((colKey) => (
                <Cell
                  key={`m-${rowKey}-${colKey}`}
                  character={lookup.get(`${rowKey}|${colKey}`)}
                  scores={scores}
                  lockedIds={lockedIds}
                  onTileClick={onTileClick}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Horizontal (shown at min-[1028px]+ where the full 988px grid fits). */}
      <div
        className="hidden min-[1028px]:grid gap-3 items-center"
        style={{ gridTemplateColumns: desktopTemplate }}
      >
        {/* Header row */}
        <span aria-hidden="true" />
        {rowKeys.map((rowKey) => (
          <span
            key={`d-h-${rowKey}`}
            className="text-center text-[13px] font-semibold text-[#a3acb3] tabular-nums"
          >
            {consonantLabel(rowKey)}
          </span>
        ))}

        {/* Data rows */}
        {columnKeys.map((colKey) => (
          <Fragment key={`d-r-${colKey}`}>
            <span className="text-right text-[13px] font-semibold text-[#a3acb3] tabular-nums">
              {colKey}
            </span>
            {rowKeys.map((rowKey) => (
              <Cell
                key={`d-${colKey}-${rowKey}`}
                character={lookup.get(`${rowKey}|${colKey}`)}
                scores={scores}
                lockedIds={lockedIds}
                onTileClick={onTileClick}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </>
  )
}
