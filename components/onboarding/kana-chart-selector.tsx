// ------------------------------------------------------------
// File: components/onboarding/kana-chart-selector.tsx
// Purpose: Seion-only kana chart for onboarding Step 2 (early
//          character unlock). Tab switcher between Hiragana and
//          Katakana. Plain floating characters in gojuon grid.
//          Selected characters get a purple circle with checkmark.
//          Row labels on the left. Writes to onboarding store.
// Depends on: data/kana/characters.ts, stores/onboarding.store.ts
// ------------------------------------------------------------

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import type { KanaCharacter, Script, Stage } from '@/types/kana.types'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingStore } from '@/stores/onboarding.store'

// -- Constants ---------------------------------------------------

const SEION_ROWS = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'] as const
const DAKUON_ROWS = ['ga', 'za', 'da', 'ba', 'pa'] as const
const YOON_ROWS = [
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
] as const

const SEION_COLS = ['a', 'i', 'u', 'e', 'o'] as const
const YOON_COLS = ['a', 'u', 'o'] as const

const STAGE_ROW_MAP: Record<Stage, readonly string[]> = {
  seion: SEION_ROWS,
  dakuon: DAKUON_ROWS,
  yoon: YOON_ROWS,
}

// -- Helpers -----------------------------------------------------

function getCharsByStageAndScript(stage: Stage, script: Script): KanaCharacter[] {
  return KANA_CHARACTERS.filter((c) => c.stage === stage && c.script === script)
}

type GridRow = {
  rowKey: string
  cells: (KanaCharacter | null)[]
}

function buildGrid(characters: KanaCharacter[], stage: Stage): GridRow[] {
  const lookup = new Map<string, KanaCharacter>()
  for (const c of characters) {
    lookup.set(`${c.row}-${c.column}`, c)
  }

  const rows = STAGE_ROW_MAP[stage]
  const cols = stage === 'yoon' ? YOON_COLS : SEION_COLS

  return rows.map((row) => ({
    rowKey: row,
    cells: cols.map((col) => lookup.get(`${row}-${col}`) ?? null),
  }))
}

function getColumnsForStage(stage: Stage): readonly string[] {
  return stage === 'yoon' ? YOON_COLS : SEION_COLS
}

// -- Sub-components ----------------------------------------------

function CharacterCell({
  character,
  isSelected,
  onToggle,
  stage,
}: {
  character: KanaCharacter
  isSelected: boolean
  onToggle: () => void
  stage: Stage
}): ReactNode {
  const isYoon = stage === 'yoon'
  const shapeClass = isYoon ? 'rounded-lg' : 'rounded-full'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`${character.kana}, ${character.romaji}`}
      onClick={onToggle}
      className={`flex flex-col items-center justify-center focus:outline-none ${shapeClass}`}
      style={{
        width: isYoon
          ? 'clamp(40px, calc(16vw - 8px), 62px)'
          : 'clamp(32px, calc(13vw - 8px), 52px)',
      }}
    >
      <div
        className={[
          `relative flex items-center justify-center ${shapeClass} transition-colors duration-100`,
          isSelected ? 'bg-[#d8c8e2]' : '',
        ].join(' ')}
        style={{
          width: isYoon
            ? 'clamp(36px, calc(14vw - 6px), 54px)'
            : 'clamp(27px, calc(11vw - 6px), 44px)',
          height: isYoon
            ? 'clamp(22px, calc(8vw - 3px), 34px)'
            : 'clamp(27px, calc(11vw - 6px), 44px)',
        }}
      >
        {isSelected && (
          <svg
            aria-hidden="true"
            className="absolute text-[#9b7bb0]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: 'clamp(6px, 2vw, 9px)',
              height: 'clamp(6px, 2vw, 9px)',
              top: '0px',
              right: '0px',
            }}
          >
            <polyline points="3 8.5 6.5 12 13 4" />
          </svg>
        )}
        <span
          className={[
            'font-medium leading-none whitespace-nowrap',
            isSelected ? 'text-[#6b4d82]' : 'text-warm-400',
          ].join(' ')}
          style={{ fontSize: 'clamp(16px, calc(5vw - 2px), 24px)' }}
        >
          {character.kana}
        </span>
      </div>
    </button>
  )
}

function RowCheckbox({
  allSelected,
  someSelected,
  onToggle,
  label,
}: {
  allSelected: boolean
  someSelected: boolean
  onToggle: () => void
  label: string
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Select all ${label} characters`}
      className="focus:outline-none flex items-center justify-center"
    >
      <div
        className={[
          'h-4 w-4 rounded border-[1.5px] transition-colors duration-100 flex items-center justify-center',
          allSelected
            ? 'bg-[#c4b0d0] border-[#c4b0d0]'
            : someSelected
              ? 'bg-[#e4d8ec] border-[#c4b0d0]'
              : 'border-warm-400 bg-transparent',
        ].join(' ')}
      >
        {(allSelected || someSelected) && (
          <svg
            aria-hidden="true"
            className="h-2.5 w-2.5 text-white"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {allSelected ? (
              <polyline points="3 8.5 6.5 12 13 4" />
            ) : (
              <line x1="4" y1="8" x2="12" y2="8" />
            )}
          </svg>
        )}
      </div>
    </button>
  )
}

// -- Main component ----------------------------------------------

const STAGES: { key: Stage; label: string }[] = [
  { key: 'seion', label: 'Seion' },
  { key: 'dakuon', label: 'Dakuon' },
  { key: 'yoon', label: 'Yoon' },
]

type KanaChartSelectorProps = {
  onActiveGroupChange?: (groupIds: string[]) => void
}

export function KanaChartSelector({ onActiveGroupChange }: KanaChartSelectorProps = {}): ReactNode {
  const selectedIds = useOnboardingStore((s: OnboardingStore) => s.selectedCharacterIds)
  const toggleCharacter = useOnboardingStore((s: OnboardingStore) => s.toggleCharacter)
  const toggleGroup = useOnboardingStore((s: OnboardingStore) => s.toggleGroup)
  const [activeScript, setActiveScript] = useState<Script>('hiragana')
  const [activeStage, setActiveStage] = useState<Stage>('seion')

  const activeGrid = useMemo(
    () => buildGrid(getCharsByStageAndScript(activeStage, activeScript), activeStage),
    [activeStage, activeScript],
  )
  const activeCols = getColumnsForStage(activeStage)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const activeGroupIds = useMemo(
    () => getCharsByStageAndScript(activeStage, activeScript).map((c) => c.id),
    [activeStage, activeScript],
  )

  useEffect(() => {
    onActiveGroupChange?.(activeGroupIds)
  }, [activeGroupIds, onActiveGroupChange])

  return (
    <div>
      {/* Script tabs */}
      <div className="flex justify-center gap-2 mt-0 mb-0.5">
        {(['hiragana', 'katakana'] as const).map((script) => (
          <button
            key={script}
            type="button"
            onClick={(): void => setActiveScript(script)}
            className={[
              'px-4 py-1 font-bold rounded-full transition-colors duration-150 flex items-center justify-center',
              'focus:outline-none',
              activeScript === script
                ? 'bg-[#c4b0d0] text-white'
                : 'text-warm-400 hover:text-warm-600',
            ].join(' ')}
          >
            <span style={{ fontSize: 'clamp(16px, calc(4vw - 1px), 20px)' }}>
              {script === 'hiragana' ? 'Hiragana' : 'Katakana'}
            </span>
          </button>
        ))}
      </div>

      {/* Stage sub-tabs */}
      <div className="flex justify-center gap-2 mt-0 mb-2">
        {STAGES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={(): void => setActiveStage(key)}
            className={[
              'px-3 py-0.5 font-medium rounded-full transition-colors duration-150 flex items-center justify-center',
              'focus:outline-none',
              activeStage === key
                ? 'bg-[#d8c8e2] text-[#6b4d82]'
                : 'text-warm-400 hover:text-warm-600',
            ].join(' ')}
          >
            <span style={{ fontSize: 'clamp(12px, calc(3vw - 1px), 16px)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Grid: vertical on mobile, horizontal on desktop */}
      <div
        role="group"
        aria-label={`${activeScript === 'hiragana' ? 'Hiragana' : 'Katakana'} ${activeStage} characters`}
      >
        {/* Mobile: checkbox on left of each consonant row */}
        <div className="md:hidden">
          <div
            className="grid justify-items-center mx-auto w-fit items-center"
            style={{ gridTemplateColumns: `auto repeat(${activeCols.length}, auto)`, gap: '6px' }}
          >
            {activeGrid.flatMap(({ rowKey, cells }) => {
              const rowIds = cells.filter((c): c is KanaCharacter => c !== null).map((c) => c.id)
              const allSel = rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id))
              const someSel = !allSel && rowIds.some((id) => selectedSet.has(id))
              return [
                <RowCheckbox
                  key={`cb-${rowKey}`}
                  allSelected={allSel}
                  someSelected={someSel}
                  onToggle={(): void => toggleGroup(rowIds)}
                  label={rowKey}
                />,
                ...cells.map((char, colIdx) =>
                  char ? (
                    <CharacterCell
                      key={char.id}
                      character={char}
                      isSelected={selectedSet.has(char.id)}
                      onToggle={(): void => toggleCharacter(char.id)}
                      stage={activeStage}
                    />
                  ) : (
                    <div key={`empty-${rowKey}-${colIdx}`} />
                  ),
                ),
              ]
            })}
          </div>
          {activeStage === 'seion' && renderStandaloneN()}
        </div>

        {/* Desktop: flat grid with checkbox row above */}
        <div className="hidden md:block">
          <div
            className="grid justify-items-center mx-auto w-fit"
            style={{ gridTemplateColumns: `repeat(${activeGrid.length}, auto)`, gap: '6px' }}
          >
            {/* Checkbox row: one per column (consonant group) */}
            {activeGrid.map(({ rowKey, cells }) => {
              const rowIds = cells.filter((c): c is KanaCharacter => c !== null).map((c) => c.id)
              const allSel = rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id))
              const someSel = !allSel && rowIds.some((id) => selectedSet.has(id))
              return (
                <RowCheckbox
                  key={`cb-${rowKey}`}
                  allSelected={allSel}
                  someSelected={someSel}
                  onToggle={(): void => toggleGroup(rowIds)}
                  label={rowKey}
                />
              )
            })}
            {/* Characters */}
            {activeCols.flatMap((vowel) =>
              activeGrid.map(({ rowKey, cells }) => {
                const colIdx = activeCols.indexOf(vowel)
                const char = cells[colIdx]
                return char ? (
                  <CharacterCell
                    key={char.id}
                    character={char}
                    isSelected={selectedSet.has(char.id)}
                    onToggle={(): void => toggleCharacter(char.id)}
                    stage={activeStage}
                  />
                ) : (
                  <div key={`empty-${rowKey}-${vowel}`} />
                )
              }),
            )}
          </div>
          {activeStage === 'seion' && renderStandaloneN()}
        </div>
      </div>
    </div>
  )

  function renderStandaloneN(): ReactNode {
    const nChar = getCharsByStageAndScript('seion', activeScript).find(
      (c) => c.romaji === 'n' && c.row === 'wa',
    )
    if (!nChar) return null
    return (
      <div className="flex justify-center mt-0">
        <CharacterCell
          character={nChar}
          isSelected={selectedSet.has(nChar.id)}
          onToggle={(): void => toggleCharacter(nChar.id)}
          stage="seion"
        />
      </div>
    )
  }
}
