// ─────────────────────────────────────────────
// File: components/dojo/character-group.tsx
// Purpose: Top-level collapsible group for one script (Hiragana or
//          Katakana) in the Kana Dojo. Renders a GroupBar at the script
//          level, and when open, three nested StageBlocks (Seion, Dakuon,
//          Yoon) each with their own GroupBar and collapsible
//          CharacterGrid.
//          Active-stage logic is scoped per-script: the earliest stage
//          within this script that still has locked characters is the
//          stage that auto-opens and shows the "Current" badge.
//          Stage/script unlock actions propagate up via onUnlockScript
//          and onUnlockStage callbacks. The tiles themselves call
//          onTileClick for per-character interactions (detail popover
//          on unlocked tiles, unlock prompt on locked tiles).
// Depends on: components/dojo/group-bar.tsx,
//             components/dojo/character-grid.tsx,
//             types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import type { ReactNode } from 'react'
import { CharacterGrid } from '@/components/dojo/character-grid'
import { CharacterTile } from '@/components/dojo/character-tile'
import { GroupBar } from '@/components/dojo/group-bar'
import type { GroupActivity } from '@/components/dojo/group-bar'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import type { KanaCharacter, Script, Stage } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

type CharacterGroupProps = {
  script: Script
  scriptLabel: string
  stageOrder: readonly Stage[]
  stageLabels: Readonly<Record<Stage, string>>
  charactersByStage: Readonly<Record<Stage, readonly KanaCharacter[]>>
  scores: Readonly<Record<string, number>>
  lockedIds: ReadonlySet<string>
  scriptActivity: GroupActivity
  scriptOpen: boolean
  stageOpen: ReadonlySet<Stage>
  stageActivity: Readonly<Record<Stage, GroupActivity>>
  onToggleScript: () => void
  onToggleStage: (stage: Stage) => void
  onUnlockScript: () => void
  onUnlockStage: (stage: Stage) => void
  onResetScript: () => void
  onResetStage: (stage: Stage) => void
  onTileClick: (character: KanaCharacter) => void
}

type StageBlockProps = {
  stage: Stage
  stageLabel: string
  characters: readonly KanaCharacter[]
  scores: Readonly<Record<string, number>>
  lockedIds: ReadonlySet<string>
  activity: GroupActivity
  isOpen: boolean
  onToggle: () => void
  onUnlock: () => void
  onReset: () => void
  onTileClick: (character: KanaCharacter) => void
  controlsId: string
}

// ── Helpers ───────────────────────────────────

const YOON_ROW_SET = new Set([
  'kya',
  'sha',
  'cha',
  'nya',
  'hya',
  'mya',
  'rya',
  'gya',
  'ja',
  'bya',
  'pya',
])

const EXTENDED_DISPLAY_GROUPS = [
  { key: 'vu', ids: ['k-va', 'k-vi', 'k-vu', 'k-ve', 'k-vo'] },
  { key: 'fa', ids: ['k-fa', 'k-fi', 'k-fe', 'k-fo'] },
  { key: 'ti-di', ids: ['k-ti', 'k-dhi', 'k-twu', 'k-dwu', 'k-che'] },
  { key: 'wi-she', ids: ['k-wi', 'k-we', 'k-uxo', 'k-she', 'k-je'] },
]

const charById = new Map(KANA_CHARACTERS.map((c) => [c.id, c]))

function countLocked(characters: readonly KanaCharacter[], lockedIds: ReadonlySet<string>): number {
  return characters.reduce((n, c) => n + (lockedIds.has(c.id) ? 1 : 0), 0)
}

// ── Stage block (inline sub-component) ────────

function StageBlock({
  stage,
  stageLabel,
  characters,
  scores,
  lockedIds,
  activity,
  isOpen,
  onToggle,
  onUnlock,
  onReset,
  onTileClick,
  controlsId,
}: StageBlockProps): ReactNode {
  const locked = countLocked(characters, lockedIds)

  return (
    <section>
      {/* Stage heading uses the same left indent as the parent script
          so that bars, percentages, and unlock buttons line up across
          every row. Visual hierarchy between script and stage comes
          from the smaller heading text + smaller chevron, not extra
          indentation. */}
      <div className="pl-5">
        <GroupBar
          label={stageLabel}
          level="stage"
          activity={activity}
          isOpen={isOpen}
          onToggle={onToggle}
          characters={characters}
          scores={scores}
          lockedCount={locked}
          onUnlock={onUnlock}
          onReset={onReset}
          controlsId={controlsId}
        />
      </div>
      {/* The grid sits flush at the main's left edge so its 20px
          label gutter aligns with the script heading's indent. The
          surrounding white surface wrapper now lives at the
          CharacterGroup level (one card wrapping both scripts) so
          Hiragana and Katakana read as a single grouped surface
          split by a divider. */}
      {isOpen && (
        <div id={controlsId} className="mt-4">
          {stage === 'combination' ? (
            ((): ReactNode => {
              const yoonChars = characters.filter((c) => YOON_ROW_SET.has(c.row))
              const extChars = characters.filter((c) => !YOON_ROW_SET.has(c.row))
              return (
                <>
                  {yoonChars.length > 0 && (
                    <CharacterGrid
                      characters={yoonChars}
                      scores={scores}
                      lockedIds={lockedIds}
                      onTileClick={onTileClick}
                    />
                  )}
                  {extChars.length > 0 && (
                    <>
                      <p className="text-center text-[13px] font-medium text-[#a3acb3] mt-6 mb-2">
                        Extended
                      </p>
                      <div className="flex flex-col items-center gap-2">
                        {EXTENDED_DISPLAY_GROUPS.map(({ key, ids }) => (
                          <div key={key} className="flex justify-center gap-2">
                            {ids.map((id) => {
                              const char = charById.get(id)
                              if (!char) return null
                              return (
                                <div
                                  key={char.id}
                                  style={{ width: 'clamp(44px, calc(20vw - 20px), 76px)' }}
                                >
                                  <CharacterTile
                                    character={char}
                                    score={scores[char.id] ?? 0}
                                    isLocked={lockedIds.has(char.id)}
                                    onClick={onTileClick}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )
            })()
          ) : (
            <CharacterGrid
              characters={characters}
              scores={scores}
              lockedIds={lockedIds}
              onTileClick={onTileClick}
            />
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {stage} {isOpen ? 'expanded' : 'collapsed'}
      </span>
    </section>
  )
}

// ── Main exports ──────────────────────────────

export function CharacterGroup({
  script,
  scriptLabel,
  stageOrder,
  stageLabels,
  charactersByStage,
  scores,
  lockedIds,
  scriptActivity,
  scriptOpen,
  stageOpen,
  stageActivity,
  onToggleScript,
  onToggleStage,
  onUnlockScript,
  onUnlockStage,
  onResetScript,
  onResetStage,
  onTileClick,
}: CharacterGroupProps): ReactNode {
  const scriptCharacters = stageOrder.flatMap((stage) => [...(charactersByStage[stage] ?? [])])
  const scriptLocked = countLocked(scriptCharacters, lockedIds)
  const scriptControlsId = `script-${script}-content`

  return (
    <section className="space-y-2">
      {/* Script heading indented 20px from main's left edge. */}
      <div className="pl-5">
        <GroupBar
          label={scriptLabel}
          level="script"
          activity={scriptActivity}
          isOpen={scriptOpen}
          onToggle={onToggleScript}
          characters={scriptCharacters}
          scores={scores}
          lockedCount={scriptLocked}
          onUnlock={onUnlockScript}
          onReset={onResetScript}
          controlsId={scriptControlsId}
        />
      </div>

      {scriptOpen && (
        <div id={scriptControlsId} className="space-y-2">
          {stageOrder.map((stage) => {
            const stageChars = charactersByStage[stage] ?? []
            const controlsId = `stage-${script}-${stage}-content`
            return (
              <StageBlock
                key={stage}
                stage={stage}
                stageLabel={stageLabels[stage]}
                characters={stageChars}
                scores={scores}
                lockedIds={lockedIds}
                activity={stageActivity[stage] ?? 'normal'}
                isOpen={stageOpen.has(stage)}
                onToggle={(): void => onToggleStage(stage)}
                onUnlock={(): void => onUnlockStage(stage)}
                onReset={(): void => onResetStage(stage)}
                onTileClick={onTileClick}
                controlsId={controlsId}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
