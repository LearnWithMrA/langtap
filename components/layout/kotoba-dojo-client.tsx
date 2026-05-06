// ─────────────────────────────────────────────
// File: components/layout/kotoba-dojo-client.tsx
// Purpose: Client island for /dojo/kotoba. Orchestrates the JLPT-level
//          tab row and the level-group accordion rows. Reads mastery
//          scores and manual unlocks from useWordMasteryStore. Level
//          data comes from the real word bank and kotoba-levels.
//          N5 loads eagerly (default tab). N4-N1 lazy-load on tab
//          switch with race-safe async handling.
//          Unlock flows (page, group, word scope) write to the store.
//          Keeps a `state` prop for deterministic loading/error/empty
//          shells in tests.
// Depends on: components/dojo/kotoba-level-tabs.tsx,
//             components/dojo/kotoba-level-group.tsx,
//             components/dojo/kotoba-word-popover.tsx,
//             components/dojo/kotoba-unlock-prompt.tsx,
//             components/dojo/kotoba-bulk-unlock-prompt.tsx,
//             components/dojo/kotoba-bulk-reset-prompt.tsx,
//             components/dojo/group-bar.tsx,
//             data/words/kotoba-dojo-data.ts,
//             stores/word-mastery.store.ts,
//             engine/constants.ts,
//             types/kotoba.types.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { KotobaLevelTabs } from '@/components/dojo/kotoba-level-tabs'
import { KotobaLevelGroupRow } from '@/components/dojo/kotoba-level-group'
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
import { buildLockedWordSet, lockedIdsInGroup } from '@/components/dojo/kotoba-dojo-helpers'
import { HelpCard, useKotobaTips } from '@/components/dojo/help-card'
import { KOTOBA_MASTERY_THRESHOLD } from '@/engine/constants'
import { getUnlockedKotobaWordIds } from '@/engine/kotoba-progression'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { getN5DojoData, loadKotobaDojoData } from '@/data/words/kotoba-dojo-data'
import type { KotobaDojoLevelData } from '@/data/words/kotoba-dojo-data'
import { JLPT_LABELS } from '@/types/kotoba.types'
import type {
  JlptLevel,
  KotobaClientState,
  KotobaLevelGroup,
  KotobaWord,
} from '@/types/kotoba.types'

// ── Types ─────────────────────────────────────

type KotobaDojoClientProps = {
  state?: KotobaClientState
}

// ── Ready screen ──────────────────────────────

function ReadyShell(): ReactNode {
  const scores = useWordMasteryStore((s) => s.scores)
  const manuallyUnlockedWords = useWordMasteryStore((s) => s.manuallyUnlockedWords)
  const { currentTip: kotobaTip, advance: advanceTip } = useKotobaTips()

  const n5Data = useMemo(() => getN5DojoData(), [])
  const [levelDataCache, setLevelDataCache] = useState<
    Readonly<Record<string, KotobaDojoLevelData>>
  >(() => ({ n5: n5Data }))

  const [activeLevel, setActiveLevel] = useState<JlptLevel>('n5')
  const [levelLoading, setLevelLoading] = useState(false)
  const requestedLevelRef = useRef<JlptLevel>('n5')

  const currentData = levelDataCache[activeLevel]
  const currentGroups = useMemo(() => currentData?.groups ?? [], [currentData])
  const currentWords = useMemo(() => currentData?.words ?? {}, [currentData])

  const [openGroupIds, setOpenGroupIds] = useState<ReadonlySet<string>>(() => {
    const firstGroup = n5Data.groups[0]
    return firstGroup ? new Set([firstGroup.id]) : new Set()
  })

  const [selectedWord, setSelectedWord] = useState<KotobaWord | null>(null)
  const [pendingUnlockWord, setPendingUnlockWord] = useState<KotobaWord | null>(null)
  const [bulkScope, setBulkScope] = useState<KotobaBulkUnlockScope | null>(null)
  const [bulkResetScope, setBulkResetScope] = useState<KotobaBulkResetScope | null>(null)

  const allWordIds = useMemo(() => currentGroups.flatMap((g) => [...g.wordIds]), [currentGroups])

  const manualUnlockSet = useMemo(() => new Set(manuallyUnlockedWords), [manuallyUnlockedWords])

  const progressionUnlockedIds = useMemo(
    () => getUnlockedKotobaWordIds(allWordIds, scores, manualUnlockSet),
    [allWordIds, scores, manualUnlockSet],
  )

  const lockedWordIds = useMemo(
    () => buildLockedWordSet(currentWords, progressionUnlockedIds, manualUnlockSet),
    [currentWords, progressionUnlockedIds, manualUnlockSet],
  )

  const lockedAtLevel = useMemo(
    () => currentGroups.flatMap((g) => lockedIdsInGroup(g, lockedWordIds)),
    [currentGroups, lockedWordIds],
  )

  const handleLevelChange = useCallback(
    (level: JlptLevel): void => {
      requestedLevelRef.current = level
      setActiveLevel(level)

      const existing = levelDataCache[level]
      if (existing) {
        const firstGroup = existing.groups[0]
        setOpenGroupIds(firstGroup ? new Set([firstGroup.id]) : new Set())
        return
      }

      setLevelLoading(true)
      loadKotobaDojoData(level).then((data) => {
        if (requestedLevelRef.current !== level) return
        setLevelDataCache((prev) => ({ ...prev, [level]: data }))
        const firstGroup = data.groups[0]
        setOpenGroupIds(firstGroup ? new Set([firstGroup.id]) : new Set())
        setLevelLoading(false)
      })
    },
    [levelDataCache],
  )

  const handleToggleGroup = useCallback((groupId: string): void => {
    setOpenGroupIds((current) => {
      const next = new Set(current)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

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

  const handleResetWord = useCallback((wordId: string): void => {
    useWordMasteryStore.getState().reset(wordId)
  }, [])

  const handleMarkMastered = useCallback((wordId: string): void => {
    useWordMasteryStore.getState().setScore(wordId, KOTOBA_MASTERY_THRESHOLD + 5)
  }, [])

  const handleIndividualUnlock = useCallback((wordId: string): void => {
    useWordMasteryStore.getState().addManualUnlock(wordId)
    setPendingUnlockWord(null)
  }, [])

  const handleBulkUnlockConfirm = useCallback((wordIds: readonly string[]): void => {
    useWordMasteryStore.getState().addManualUnlocks(wordIds)
    setBulkScope(null)
  }, [])

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
    const store = useWordMasteryStore.getState()
    for (const id of wordIds) {
      store.reset(id)
    }
    setBulkResetScope(null)
  }, [])

  const handleBulkMarkMastered = useCallback((wordIds: readonly string[]): void => {
    const store = useWordMasteryStore.getState()
    for (const id of wordIds) {
      store.setScore(id, KOTOBA_MASTERY_THRESHOLD + 5)
    }
    setBulkResetScope(null)
  }, [])

  const handleResetLevel = useCallback((): void => {
    const allIds = currentGroups.flatMap((g) => [...g.wordIds])
    if (allIds.length === 0) return
    setBulkResetScope({ label: `${JLPT_LABELS[activeLevel]} Kotoba`, wordIds: allIds })
  }, [activeLevel, currentGroups])

  const handleResetGroup = useCallback((group: KotobaLevelGroup): void => {
    if (group.wordIds.length === 0) return
    setBulkResetScope({ label: group.label, wordIds: group.wordIds })
  }, [])

  const selectedScore = selectedWord ? (scores[selectedWord.id] ?? 0) : 0

  return (
    <div
      className="min-h-svh text-warm-800"
      style={{ backgroundColor: 'var(--color-kotoba-dojo-bg)' }}
    >
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
            <Link
              href="/practice/kotoba"
              className="inline-flex items-center justify-center px-3 font-bold text-white bg-sage-600/85 hover:bg-sage-700/85 active:translate-y-[2px] active:border-b-[2px] transition-colors border-b-[clamp(2px,calc(1.25vw-2px),4px)] border-b-[color:var(--color-sage-600)]"
              style={{
                height: 'clamp(30px, calc(6.25vw + 10px), 40px)',
                borderRadius: 'clamp(6px, 2vw, 8px)',
                fontSize: 'clamp(11px, calc(2.5vw), 14px)',
              }}
            >
              Practice
            </Link>
          </div>

          {kotobaTip && (
            <div className="mb-4">
              <HelpCard
                title={kotobaTip.title}
                body={kotobaTip.body}
                icon="言"
                iconBg="bg-sage-100"
                buttonClass="bg-sage-500 hover:bg-sage-600 border-b-sage-600"
                onDismiss={advanceTip}
              />
            </div>
          )}

          <KotobaLevelTabs
            active={activeLevel}
            onChange={handleLevelChange}
            tabPanelId={`kotoba-panel-${activeLevel}`}
          />

          <div
            id={`kotoba-panel-${activeLevel}`}
            role="tabpanel"
            aria-label={`${activeLevel.toUpperCase()} levels`}
            className="mt-5"
          >
            {levelLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-warm-100 animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : (
              <section className="rounded-xl border border-warm-200 bg-surface-raised">
                {currentGroups.length === 0 ? (
                  <p className="text-sm text-warm-500 text-center py-12">Coming soon</p>
                ) : (
                  currentGroups.map((group) => (
                    <KotobaLevelGroupRow
                      key={group.id}
                      group={group}
                      words={currentWords}
                      scores={scores}
                      lockedWordIds={lockedWordIds}
                      isOpen={openGroupIds.has(group.id)}
                      onToggle={handleToggleGroup}
                      onUnlockGroup={handleUnlockGroup}
                      onResetGroup={handleResetGroup}
                      onWordClick={handleWordClick}
                    />
                  ))
                )}
              </section>
            )}
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

export function KotobaDojoClient({ state = 'ready' }: KotobaDojoClientProps): ReactNode {
  if (state === 'loading') return <KotobaLoadingShell />
  if (state === 'error') return <KotobaErrorShell />
  if (state === 'empty') return <KotobaEmptyShell />
  return <ReadyShell />
}
