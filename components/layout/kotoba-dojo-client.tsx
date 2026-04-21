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
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { KotobaLevelTabs } from '@/components/dojo/kotoba-level-tabs'
import { KotobaUnitCard } from '@/components/dojo/kotoba-unit-card'
import { KotobaLevelGroupRow } from '@/components/dojo/kotoba-level-group'
import { KotobaWordPopover } from '@/components/dojo/kotoba-word-popover'
import { KotobaUnlockPrompt } from '@/components/dojo/kotoba-unlock-prompt'
import { KotobaBulkUnlockPrompt } from '@/components/dojo/kotoba-bulk-unlock-prompt'
import type { KotobaBulkUnlockScope } from '@/components/dojo/kotoba-bulk-unlock-prompt'
import { KotobaBulkResetPrompt } from '@/components/dojo/kotoba-bulk-reset-prompt'
import type { KotobaBulkResetScope } from '@/components/dojo/kotoba-bulk-reset-prompt'
import { UnlockButton } from '@/components/dojo/group-bar'
import { UNLOCK_THRESHOLD } from '@/engine/constants'
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

// ── Helpers ───────────────────────────────────

// Builds the set of word ids currently considered locked. A word is
// unlocked when its score passes UNLOCK_THRESHOLD OR it has been added
// to manuallyUnlockedWords. Mirrors the Kana buildLockedSet helper.
function buildLockedWordSet(
  words: Readonly<Record<string, KotobaWord>>,
  mastery: KotobaMasteryState,
): Set<string> {
  const manual = new Set(mastery.manuallyUnlockedWords)
  const locked = new Set<string>()
  for (const id of Object.keys(words)) {
    if (manual.has(id)) continue
    if ((mastery.scores[id] ?? 0) >= UNLOCK_THRESHOLD) continue
    locked.add(id)
  }
  return locked
}

function lockedIdsInUnit(unit: KotobaUnit, lockedWordIds: ReadonlySet<string>): string[] {
  return unit.groups.flatMap((g) => g.wordIds.filter((id) => lockedWordIds.has(id)))
}

function lockedIdsInGroup(group: KotobaLevelGroup, lockedWordIds: ReadonlySet<string>): string[] {
  return group.wordIds.filter((id) => lockedWordIds.has(id))
}

function lockedIdsAtLevel(
  units: readonly KotobaUnit[],
  lockedWordIds: ReadonlySet<string>,
): string[] {
  return units.flatMap((u) => lockedIdsInUnit(u, lockedWordIds))
}

// ── Non-ready screens ─────────────────────────

function LoadingShell(): ReactNode {
  const skeletonTiles = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div className="h-8 w-40 rounded-lg bg-warm-100 animate-pulse mb-6" />
          <div className="h-11 w-full max-w-sm rounded-lg bg-warm-100 animate-pulse mb-6" />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {skeletonTiles.map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-warm-100 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

function ErrorShell(): ReactNode {
  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <div
            role="alert"
            className="rounded-xl bg-blush-100 text-warm-800 p-4 flex flex-col gap-3"
          >
            <p className="text-base font-medium">
              We could not load your Kotoba progress. Check your connection and try again.
            </p>
            <div>
              <button
                type="button"
                onClick={(): void => window.location.reload()}
                className="bg-sage-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-sage-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function EmptyShell(): ReactNode {
  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
      <AppTopBar />
      <div className="pt-20 pb-16 px-5">
        <main className="mx-auto max-w-[988px]">
          <h1 className="text-2xl font-bold mb-6">Kotoba Dojo</h1>
          <div className="rounded-xl bg-surface-raised border border-border p-6 text-center">
            <h2 className="text-lg font-semibold text-warm-800 mb-2">
              Start building your vocabulary
            </h2>
            <p className="text-sm text-warm-600 mb-4">
              Pick a unit to see the words inside, or jump straight into Kotoba practice.
            </p>
            <Link
              href="/practice?mode=kotoba"
              className="inline-block bg-sage-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-sage-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
            >
              Start practice
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
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
            <UnitGrid
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

// ── Unit grid with inline accordion ───────────

type UnitGridProps = {
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

function UnitGrid({
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
}: UnitGridProps): ReactNode {
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

// ── Root dispatcher ───────────────────────────

export function KotobaDojoClient({
  fixture = 'variety',
  state = 'ready',
}: KotobaDojoClientProps): ReactNode {
  if (state === 'loading') return <LoadingShell />
  if (state === 'error') return <ErrorShell />
  if (state === 'empty') return <EmptyShell />
  return <ReadyShell fixtureKey={fixture} />
}
