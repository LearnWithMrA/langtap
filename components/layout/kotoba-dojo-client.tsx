// ─────────────────────────────────────────────
// File: components/layout/kotoba-dojo-client.tsx
// Purpose: Client island for /dojo/kotoba. Orchestrates the JLPT-level
//          tab row, the unit-card grid for the active level, the
//          single-open unit accordion (opening one unit collapses the
//          previously open unit), the multi-open level-group rows
//          inside the open unit, and all four unlock flows:
//          - page scope: green-dark "Unlock All" next to the heading,
//            opens a bulk prompt for every locked word at the active
//            JLPT level.
//          - unit scope: green-medium lock button on each unlocked
//            unit card, opens a bulk prompt for that unit's words.
//          - group scope: green-light lock button on each level-group
//            row, opens a bulk prompt for that group's words.
//          - word scope: tapping a locked tile opens the single-step
//            unlock prompt; tapping an unlocked tile opens the word
//            detail popover.
//          Accepts a fixture key and a state prop so the shell can
//          render deterministic loading / error / empty screens for
//          tests and design review without waiting on real data.
//          Real mastery wiring, Supabase persistence, and URL
//          deep-linking land in Sprint 4.
// Depends on: components/layout/app-top-bar.tsx,
//             components/dojo/kotoba-level-tabs.tsx,
//             components/dojo/kotoba-unit-card.tsx,
//             components/dojo/kotoba-level-group.tsx,
//             components/dojo/kotoba-word-popover.tsx,
//             components/dojo/kotoba-unlock-prompt.tsx,
//             components/dojo/kotoba-bulk-unlock-prompt.tsx,
//             components/dojo/group-bar.tsx,
//             engine/constants.ts,
//             samples/kotoba-dojo-fixtures.ts,
//             types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { KotobaLevelTabs } from '@/components/dojo/kotoba-level-tabs'
import { KotobaUnitGrid } from '@/components/dojo/kotoba-unit-grid'
import { KotobaWordPopover } from '@/components/dojo/kotoba-word-popover'
import { KotobaUnlockPrompt } from '@/components/dojo/kotoba-unlock-prompt'
import { KotobaBulkUnlockPrompt } from '@/components/dojo/kotoba-bulk-unlock-prompt'
import type { KotobaBulkUnlockScope } from '@/components/dojo/kotoba-bulk-unlock-prompt'
import { KotobaBulkResetPrompt } from '@/components/dojo/kotoba-bulk-reset-prompt'
import type { KotobaBulkResetScope } from '@/components/dojo/kotoba-bulk-reset-prompt'
import { UnlockButton } from '@/components/dojo/group-bar'
import {
  KotobaLoadingShell,
  KotobaErrorShell,
  KotobaEmptyShell,
} from '@/components/dojo/kotoba-dojo-shells'
import {
  buildLockedWordSet,
  lockedIdsInUnit,
  lockedIdsInGroup,
  lockedIdsAtLevel,
} from '@/components/dojo/kotoba-dojo-helpers'
import { MASTERY_THRESHOLD } from '@/engine/mastery'
import { getKotobaFixture } from '@/samples/kotoba-dojo-fixtures'
import { JLPT_LABELS } from '@/types/kotoba.types'
import type {
  JlptLevel,
  KotobaClientState,
  KotobaFixtureKey,
  KotobaLevelGroup,
  KotobaMasteryState,
  KotobaUnit,
  KotobaWord,
} from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaDojoClientProps = {
  fixture?: KotobaFixtureKey
  state?: KotobaClientState
}

// ── Ready screen ──────────────────────────────

type ReadyShellProps = {
  fixtureKey: KotobaFixtureKey
}

function ReadyShell({ fixtureKey }: ReadyShellProps): ReactNode {
  const initial = useMemo(() => getKotobaFixture(fixtureKey), [fixtureKey])
  const [mastery, setMastery] = useState<KotobaMasteryState>(() => initial.mastery)
  const [activeLevel, setActiveLevel] = useState<JlptLevel>('n5')

  // Every unit is expandable now. Default to the first unit of the
  // active level with its first group already open so the view lands
  // on content instead of a closed grid.
  const initialOpenUnitId = useMemo((): string | null => {
    const units = initial.levels[activeLevel]
    return units.length > 0 ? units[0].id : null
  }, [initial, activeLevel])
  const [openUnitId, setOpenUnitId] = useState<string | null>(initialOpenUnitId)

  const [openGroupIds, setOpenGroupIds] = useState<ReadonlySet<string>>(() => {
    if (!initialOpenUnitId) return new Set()
    const units = initial.levels[activeLevel]
    const openUnit = units.find((u) => u.id === initialOpenUnitId)
    if (!openUnit || openUnit.groups.length === 0) return new Set()
    return new Set([openUnit.groups[0].id])
  })

  const [selectedWord, setSelectedWord] = useState<KotobaWord | null>(null)
  const [pendingUnlockWord, setPendingUnlockWord] = useState<KotobaWord | null>(null)
  const [bulkScope, setBulkScope] = useState<KotobaBulkUnlockScope | null>(null)
  const [bulkResetScope, setBulkResetScope] = useState<KotobaBulkResetScope | null>(null)

  const lockedWordIds = useMemo(
    () => buildLockedWordSet(initial.words, mastery),
    [initial.words, mastery],
  )

  const unitsForLevel = initial.levels[activeLevel]
  const lockedAtLevel = useMemo(
    () => lockedIdsAtLevel(unitsForLevel, lockedWordIds),
    [unitsForLevel, lockedWordIds],
  )

  const handleLevelChange = useCallback(
    (level: JlptLevel): void => {
      setActiveLevel(level)
      const nextUnits = initial.levels[level]
      const firstUnit = nextUnits[0]
      setOpenUnitId(firstUnit ? firstUnit.id : null)
      if (firstUnit && firstUnit.groups.length > 0) {
        setOpenGroupIds(new Set([firstUnit.groups[0].id]))
      } else {
        setOpenGroupIds(new Set())
      }
    },
    [initial],
  )

  const handleToggleUnit = useCallback(
    (unitId: string): void => {
      setOpenUnitId((current) => {
        if (current === unitId) return null
        const units = initial.levels[activeLevel]
        const nextUnit = units.find((u) => u.id === unitId)
        if (nextUnit && nextUnit.groups.length > 0) {
          setOpenGroupIds((prev) => {
            const next = new Set(prev)
            next.add(nextUnit.groups[0].id)
            return next
          })
        }
        return unitId
      })
    },
    [initial, activeLevel],
  )

  const handleToggleGroup = useCallback((groupId: string): void => {
    setOpenGroupIds((current) => {
      const next = new Set(current)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  // Tile click: locked → unlock prompt; unlocked → detail popover.
  const handleWordClick = useCallback(
    (word: KotobaWord): void => {
      if (lockedWordIds.has(word.id)) {
        setPendingUnlockWord(word)
      } else {
        setSelectedWord(word)
      }
    },
    [lockedWordIds],
  )

  // Reset clears the score but keeps the word in the manual set so the
  // tile stays visible as unlocked-at-0 rather than flipping back to
  // the padlock state. Matches the Kana handleResetCharacter contract.
  const handleResetWord = useCallback((wordId: string): void => {
    setMastery((prev) => {
      const nextScores = { ...prev.scores }
      delete nextScores[wordId]
      const manual = new Set(prev.manuallyUnlockedWords)
      manual.add(wordId)
      return {
        ...prev,
        scores: nextScores,
        manuallyUnlockedWords: [...manual],
      }
    })
  }, [])

  const handleMarkMastered = useCallback((wordId: string): void => {
    setMastery((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [wordId]: MASTERY_THRESHOLD + 5,
      },
    }))
  }, [])

  const handleIndividualUnlock = useCallback((wordId: string): void => {
    setMastery((prev) => {
      if (prev.manuallyUnlockedWords.includes(wordId)) return prev
      return {
        ...prev,
        manuallyUnlockedWords: [...prev.manuallyUnlockedWords, wordId],
      }
    })
    setPendingUnlockWord(null)
  }, [])

  const handleBulkUnlockConfirm = useCallback((wordIds: readonly string[]): void => {
    setMastery((prev) => {
      const existing = new Set(prev.manuallyUnlockedWords)
      for (const id of wordIds) existing.add(id)
      return {
        ...prev,
        manuallyUnlockedWords: [...existing],
      }
    })
    setBulkScope(null)
  }, [])

  const handleUnlockUnit = useCallback(
    (unit: KotobaUnit): void => {
      const ids = lockedIdsInUnit(unit, lockedWordIds)
      if (ids.length === 0) return
      setBulkScope({ label: unit.label, wordIds: ids })
    },
    [lockedWordIds],
  )

  const handleUnlockGroup = useCallback(
    (group: KotobaLevelGroup): void => {
      const ids = lockedIdsInGroup(group, lockedWordIds)
      if (ids.length === 0) return
      setBulkScope({ label: group.label, wordIds: ids })
    },
    [lockedWordIds],
  )

  const handleUnlockLevel = useCallback((): void => {
    if (lockedAtLevel.length === 0) return
    setBulkScope({
      label: `${JLPT_LABELS[activeLevel]} Kotoba`,
      wordIds: lockedAtLevel,
    })
  }, [activeLevel, lockedAtLevel])

  const handleBulkResetConfirm = useCallback((wordIds: readonly string[]): void => {
    setMastery((prev) => {
      const nextScores = { ...prev.scores }
      const manual = new Set(prev.manuallyUnlockedWords)
      for (const id of wordIds) {
        delete nextScores[id]
        manual.add(id)
      }
      return {
        ...prev,
        scores: nextScores,
        manuallyUnlockedWords: [...manual],
      }
    })
    setBulkResetScope(null)
  }, [])

  const handleBulkMarkMastered = useCallback((wordIds: readonly string[]): void => {
    setMastery((prev) => {
      const nextScores = { ...prev.scores }
      for (const id of wordIds) {
        nextScores[id] = MASTERY_THRESHOLD + 5
      }
      return { ...prev, scores: nextScores }
    })
    setBulkResetScope(null)
  }, [])

  const handleResetLevel = useCallback((): void => {
    const allIds = unitsForLevel.flatMap((u) => u.groups.flatMap((g) => g.wordIds))
    if (allIds.length === 0) return
    setBulkResetScope({ label: `${JLPT_LABELS[activeLevel]} Kotoba`, wordIds: allIds })
  }, [activeLevel, unitsForLevel])

  const handleResetUnit = useCallback((unit: KotobaUnit): void => {
    const ids = unit.groups.flatMap((g) => g.wordIds)
    if (ids.length === 0) return
    setBulkResetScope({ label: unit.label, wordIds: ids })
  }, [])

  const handleResetGroup = useCallback((group: KotobaLevelGroup): void => {
    if (group.wordIds.length === 0) return
    setBulkResetScope({ label: group.label, wordIds: group.wordIds })
  }, [])

  const selectedScore = selectedWord ? (mastery.scores[selectedWord.id] ?? 0) : 0

  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />

      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div className="flex items-center gap-3 mb-5">
            <h1
              className="font-bold tracking-tight"
              style={{ fontSize: 'clamp(20px, calc(7.5vw - 4px), 32px)' }}
            >
              Kotoba Dojo
            </h1>
            {lockedAtLevel.length > 0 ? (
              <UnlockButton
                size="large"
                color="green-dark"
                icon="locked"
                onClick={handleUnlockLevel}
                ariaLabel={`Unlock all ${lockedAtLevel.length} locked word${lockedAtLevel.length === 1 ? '' : 's'} at ${JLPT_LABELS[activeLevel]}`}
              />
            ) : (
              <UnlockButton
                size="large"
                color="grey"
                icon="unlocked"
                onClick={handleResetLevel}
                ariaLabel={`Reset progress on all words at ${JLPT_LABELS[activeLevel]}`}
              />
            )}
          </div>

          <KotobaLevelTabs
            active={activeLevel}
            onChange={handleLevelChange}
            tabPanelId={`kotoba-panel-${activeLevel}`}
          />

          <div
            id={`kotoba-panel-${activeLevel}`}
            role="tabpanel"
            aria-label={`${activeLevel.toUpperCase()} units`}
            className="mt-5"
          >
            <KotobaUnitGrid
              units={unitsForLevel}
              words={initial.words}
              scores={mastery.scores}
              lockedWordIds={lockedWordIds}
              openUnitId={openUnitId}
              openGroupIds={openGroupIds}
              onToggleUnit={handleToggleUnit}
              onToggleGroup={handleToggleGroup}
              onUnlockUnit={handleUnlockUnit}
              onUnlockGroup={handleUnlockGroup}
              onResetUnit={handleResetUnit}
              onResetGroup={handleResetGroup}
              onWordClick={handleWordClick}
            />
          </div>
        </main>
      </div>

      <KotobaWordPopover
        word={selectedWord}
        score={selectedScore}
        onReset={handleResetWord}
        onMarkMastered={handleMarkMastered}
        onClose={(): void => setSelectedWord(null)}
      />

      <KotobaUnlockPrompt
        word={pendingUnlockWord}
        onConfirm={handleIndividualUnlock}
        onClose={(): void => setPendingUnlockWord(null)}
      />

      <KotobaBulkUnlockPrompt
        scope={bulkScope}
        onConfirm={handleBulkUnlockConfirm}
        onClose={(): void => setBulkScope(null)}
      />

      <KotobaBulkResetPrompt
        scope={bulkResetScope}
        onReset={handleBulkResetConfirm}
        onMarkMastered={handleBulkMarkMastered}
        onClose={(): void => setBulkResetScope(null)}
      />
    </div>
  )
}

// ── Root dispatcher ───────────────────────────

export function KotobaDojoClient({
  fixture = 'variety',
  state = 'ready',
}: KotobaDojoClientProps): ReactNode {
  if (state === 'loading') return <KotobaLoadingShell />
  if (state === 'error') return <KotobaErrorShell />
  if (state === 'empty') return <KotobaEmptyShell />
  return <ReadyShell fixtureKey={fixture} />
}
