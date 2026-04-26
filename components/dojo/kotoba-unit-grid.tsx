// ─────────────────────────────────────────────
// File: components/dojo/kotoba-unit-grid.tsx
// Purpose: Grid of Kotoba unit cards with the open-unit accordion
//          panel showing level group rows. Extracted from
//          kotoba-dojo-client.tsx.
// Depends on: components/dojo/kotoba-unit-card.tsx,
//             components/dojo/kotoba-level-group.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import { KotobaUnitCard } from '@/components/dojo/kotoba-unit-card'
import { KotobaLevelGroupRow } from '@/components/dojo/kotoba-level-group'
import type {
  KotobaLevelGroup,
  KotobaUnit,
  KotobaWord,
} from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaUnitGridProps = {
  units: readonly KotobaUnit[]
  words: Readonly<Record<string, KotobaWord>>
  scores: Readonly<Record<string, number>>
  lockedWordIds: ReadonlySet<string>
  openUnitId: string | null
  openGroupIds: ReadonlySet<string>
  onToggleUnit: (unitId: string) => void
  onToggleGroup: (groupId: string) => void
  onUnlockUnit: (unit: KotobaUnit) => void
  onUnlockGroup: (group: KotobaLevelGroup) => void
  onResetUnit: (unit: KotobaUnit) => void
  onResetGroup: (group: KotobaLevelGroup) => void
  onWordClick: (word: KotobaWord) => void
}

// ── Main export ──────────────────────────────

export function KotobaUnitGrid({
  units,
  words,
  scores,
  lockedWordIds,
  openUnitId,
  openGroupIds,
  onToggleUnit,
  onToggleGroup,
  onUnlockUnit,
  onUnlockGroup,
  onResetUnit,
  onResetGroup,
  onWordClick,
}: KotobaUnitGridProps): ReactNode {
  const openUnit = openUnitId ? units.find((u) => u.id === openUnitId) : null

  return (
    <>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
      >
        {units.map((unit) => {
          const controlsId = `kotoba-unit-panel-${unit.id}`
          return (
            <KotobaUnitCard
              key={unit.id}
              unit={unit}
              words={words}
              scores={scores}
              lockedWordIds={lockedWordIds}
              isOpen={openUnitId === unit.id}
              onToggle={onToggleUnit}
              onUnlockUnit={onUnlockUnit}
              onResetUnit={onResetUnit}
              controlsId={controlsId}
            />
          )
        })}
      </div>

      {openUnit && (
        <section
          id={`kotoba-unit-panel-${openUnit.id}`}
          aria-label={`${openUnit.label} level groups`}
          className="mt-6 rounded-xl border border-warm-200 bg-surface-raised"
        >
          {openUnit.groups.length === 0 ? (
            <p className="text-sm text-warm-500 text-center py-12">Coming soon</p>
          ) : (
            openUnit.groups.map((group) => (
              <KotobaLevelGroupRow
                key={group.id}
                group={group}
                words={words}
                scores={scores}
                lockedWordIds={lockedWordIds}
                isOpen={openGroupIds.has(group.id)}
                onToggle={onToggleGroup}
                onUnlockGroup={onUnlockGroup}
                onResetGroup={onResetGroup}
                onWordClick={onWordClick}
              />
            ))
          )}
        </section>
      )}
    </>
  )
}
