// ─────────────────────────────────────────────
// File: components/layout/kana-dojo-client.tsx
// Purpose: Client island for /dojo/kana. Orchestrates the script-first
//          hierarchy: two top-level CharacterGroups (Hiragana, Katakana)
//          with three nested stage blocks each (Seion, Dakuon, Yoon).
//          Consumes a serialisable MasteryState fixture (string[] on the
//          wire) and rebuilds the locked set internally for O(1) reads.
//          Derived state per render:
//          - lockedIds: Set<string>
//          - Active script = earliest script with locked characters.
//          - Active stage (within each script) = earliest stage with
//            locked characters in that script.
//          - Script activity: completed / active / in-progress / future.
//          - Stage activity: same semantics, scoped within the parent
//            script.
//          Handlers:
//          - handleTileClick: opens TileDetailPopover (unlocked) or
//            UnlockPrompt (locked).
//          - handleIndividualUnlock: adds id to manuallyUnlocked.
//          - handleResetCharacter: clears the score and guarantees the
//            character remains in manuallyUnlocked (stays unlocked).
//          - handleBulkUnlockConfirm: merges the scope's ids into
//            manuallyUnlocked in one update.
//          Open-state:
//          - scriptOpen: Set<Script>. Active script defaults open.
//          - stageOpen: Record<Script, Set<Stage>>. Active stage in each
//            active/in-progress script defaults open.
// Depends on: components/layout/app-top-bar.tsx,
//             components/dojo/character-group.tsx,
//             components/dojo/tile-detail-popover.tsx,
//             components/dojo/unlock-prompt.tsx,
//             components/dojo/bulk-unlock-prompt.tsx,
//             components/dojo/help-card.tsx,
//             data/kana/characters.ts,
//             engine/constants.ts,
//             samples/mastery-fixtures.ts,
//             types/kana.types.ts
// ─────────────────────────────────────────────

'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AppTopBar } from '@/components/layout/app-top-bar'
import {
  KanaLoadingShell,
  KanaErrorShell,
  KanaEmptyShell,
} from '@/components/dojo/kana-dojo-shells'
import {
  buildLockedSet,
  hasLockedCharacter,
  hasAnyUnlock,
  CHARACTERS_BY_SCRIPT_STAGE,
  scriptCharacters,
  lockedInScope,
} from '@/components/dojo/kana-dojo-helpers'
import { CharacterGroup } from '@/components/dojo/character-group'
import { TileDetailPopover } from '@/components/dojo/tile-detail-popover'
import { UnlockPrompt } from '@/components/dojo/unlock-prompt'
import { BulkUnlockPrompt } from '@/components/dojo/bulk-unlock-prompt'
import type { BulkUnlockScope } from '@/components/dojo/bulk-unlock-prompt'
import { BulkResetPrompt } from '@/components/dojo/bulk-reset-prompt'
import type { BulkResetScope } from '@/components/dojo/bulk-reset-prompt'
import type { GroupActivity } from '@/components/dojo/group-bar'
import { UnlockButton } from '@/components/dojo/group-bar'
import { HelpCard, useHelpDismissed } from '@/components/dojo/help-card'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import { UNLOCK_THRESHOLD } from '@/engine/constants'
import { MASTERY_THRESHOLD } from '@/engine/mastery'
import { getFixture } from '@/samples/mastery-fixtures'
import type { FixtureKey, MasteryState } from '@/samples/mastery-fixtures'
import type { KanaCharacter, Script, Stage } from '@/types/kana.types'

// ── Types ─────────────────────────────────────

// `state` opts into the deterministic non-happy screens used by tests
// and design review. It mirrors the contract on KotobaDojoClient so the
// two clients expose the same prop surface. Default `'ready'` preserves
// the shipped behaviour exactly; passing any other value renders the
// matching shell without entering the main render path.
export type KanaDojoClientState = 'ready' | 'loading' | 'error' | 'empty'

type KanaDojoClientProps = {
  fixture?: FixtureKey
  state?: KanaDojoClientState
}

// ── Constants ─────────────────────────────────

const SCRIPT_ORDER: readonly Script[] = ['hiragana', 'katakana']
const SCRIPT_LABELS: Readonly<Record<Script, string>> = {
  hiragana: 'Hiragana',
  katakana: 'Katakana',
}

const STAGE_ORDER: readonly Stage[] = ['seion', 'dakuon', 'yoon']
const STAGE_LABELS: Readonly<Record<Stage, string>> = {
  seion: 'Seion',
  dakuon: 'Dakuon',
  yoon: 'Yoon',
}

// ── Ready shell (hooks live here) ─────────────
// Kept as its own component so the dispatcher below can early-return
// shells without violating the rules of hooks. Parity with the
// Kotoba client.

function KanaDojoReadyShell({ fixture = 'variety' }: { fixture?: FixtureKey }): ReactNode {
  const [mastery, setMastery] = useState<MasteryState>(() => getFixture(fixture))
  const [selected, setSelected] = useState<KanaCharacter | null>(null)
  const [pendingIndividual, setPendingIndividual] = useState<KanaCharacter | null>(null)
  const [bulkScope, setBulkScope] = useState<BulkUnlockScope | null>(null)
  const [bulkResetScope, setBulkResetScope] = useState<BulkResetScope | null>(null)

  const { dismissed: helpDismissed, dismiss: dismissHelp } = useHelpDismissed()

  const lockedIds = useMemo(() => buildLockedSet(mastery), [mastery])
  const manualUnlocks = useMemo(() => new Set(mastery.manuallyUnlocked), [mastery.manuallyUnlocked])

  // ── Derived activity per script and per stage ──

  const scriptActivity = useMemo<Readonly<Record<Script, GroupActivity>>>(() => {
    let activeAssigned = false
    const out: Record<Script, GroupActivity> = {
      hiragana: 'normal',
      katakana: 'normal',
    }
    for (const script of SCRIPT_ORDER) {
      const chars = scriptCharacters(script)
      const locked = hasLockedCharacter(chars, lockedIds)
      if (!locked) {
        out[script] = 'completed'
        continue
      }
      if (!activeAssigned) {
        out[script] = 'active'
        activeAssigned = true
        continue
      }
      out[script] = hasAnyUnlock(chars, mastery.scores, manualUnlocks) ? 'in-progress' : 'future'
    }
    return out
  }, [lockedIds, mastery.scores, manualUnlocks])

  const stageActivity = useMemo<
    Readonly<Record<Script, Readonly<Record<Stage, GroupActivity>>>>
  >(() => {
    const out: Record<Script, Record<Stage, GroupActivity>> = {
      hiragana: { seion: 'normal', dakuon: 'normal', yoon: 'normal' },
      katakana: { seion: 'normal', dakuon: 'normal', yoon: 'normal' },
    }
    for (const script of SCRIPT_ORDER) {
      let activeAssigned = false
      for (const stage of STAGE_ORDER) {
        const chars = CHARACTERS_BY_SCRIPT_STAGE[script][stage]
        const locked = hasLockedCharacter(chars, lockedIds)
        if (!locked) {
          out[script][stage] = 'completed'
          continue
        }
        if (!activeAssigned) {
          out[script][stage] = 'active'
          activeAssigned = true
          continue
        }
        out[script][stage] = hasAnyUnlock(chars, mastery.scores, manualUnlocks)
          ? 'in-progress'
          : 'future'
      }
    }
    return out
  }, [lockedIds, mastery.scores, manualUnlocks])

  // ── Open-state defaults derived once from initial fixture ──

  const [scriptOpen, setScriptOpen] = useState<Set<Script>>(() => {
    const initialLocked = buildLockedSet(getFixture(fixture))
    const open = new Set<Script>()
    for (const script of SCRIPT_ORDER) {
      if (hasLockedCharacter(scriptCharacters(script), initialLocked)) {
        open.add(script)
        break
      }
    }
    // If all scripts are already completed (complete fixture), open hiragana by default
    if (open.size === 0) open.add('hiragana')
    return open
  })

  const [stageOpen, setStageOpen] = useState<Record<Script, Set<Stage>>>(() => {
    const initialLocked = buildLockedSet(getFixture(fixture))
    const out: Record<Script, Set<Stage>> = {
      hiragana: new Set(),
      katakana: new Set(),
    }
    for (const script of SCRIPT_ORDER) {
      for (const stage of STAGE_ORDER) {
        const chars = CHARACTERS_BY_SCRIPT_STAGE[script][stage]
        if (hasLockedCharacter(chars, initialLocked)) {
          out[script].add(stage)
          break
        }
      }
    }
    return out
  })

  const toggleScript = useCallback((script: Script): void => {
    setScriptOpen((prev) => {
      const next = new Set(prev)
      if (next.has(script)) next.delete(script)
      else next.add(script)
      return next
    })
  }, [])

  const toggleStage = useCallback((script: Script, stage: Stage): void => {
    setStageOpen((prev) => {
      const nextSet = new Set(prev[script])
      if (nextSet.has(stage)) nextSet.delete(stage)
      else nextSet.add(stage)
      return { ...prev, [script]: nextSet }
    })
  }, [])

  // ── Tile and unlock flows ──

  const handleTileClick = useCallback(
    (character: KanaCharacter): void => {
      if (lockedIds.has(character.id)) {
        setPendingIndividual(character)
      } else {
        setSelected(character)
      }
    },
    [lockedIds],
  )

  const handleIndividualUnlock = useCallback((characterId: string): void => {
    setMastery((prev) => {
      if (prev.manuallyUnlocked.includes(characterId)) return prev
      return {
        ...prev,
        manuallyUnlocked: [...prev.manuallyUnlocked, characterId],
      }
    })
    setPendingIndividual(null)
  }, [])

  const handleBulkUnlockConfirm = useCallback((characterIds: readonly string[]): void => {
    setMastery((prev) => {
      const existing = new Set(prev.manuallyUnlocked)
      for (const id of characterIds) existing.add(id)
      return {
        ...prev,
        manuallyUnlocked: [...existing],
      }
    })
    setBulkScope(null)
  }, [])

  // Reset: clear the score for one character, ensure it stays in the manually
  // unlocked set so the tile remains visible as unlocked-at-0.
  const handleResetCharacter = useCallback((characterId: string): void => {
    setMastery((prev) => {
      const nextScores = { ...prev.scores }
      delete nextScores[characterId]
      const manualSet = new Set(prev.manuallyUnlocked)
      manualSet.add(characterId)
      return {
        scores: nextScores,
        manuallyUnlocked: [...manualSet],
      }
    })
  }, [])

  const handleMarkCharacterMastered = useCallback((characterId: string): void => {
    setMastery((prev) => ({
      ...prev,
      scores: { ...prev.scores, [characterId]: MASTERY_THRESHOLD + 5 },
    }))
  }, [])

  const handleUnlockScript = useCallback(
    (script: Script): void => {
      const ids = lockedInScope(scriptCharacters(script), lockedIds)
      if (ids.length === 0) return
      setBulkScope({ label: SCRIPT_LABELS[script], characterIds: ids })
    },
    [lockedIds],
  )

  const handleUnlockStage = useCallback(
    (script: Script, stage: Stage): void => {
      const ids = lockedInScope(CHARACTERS_BY_SCRIPT_STAGE[script][stage], lockedIds)
      if (ids.length === 0) return
      setBulkScope({
        label: `${SCRIPT_LABELS[script]} ${STAGE_LABELS[stage]}`,
        characterIds: ids,
      })
    },
    [lockedIds],
  )

  const handleUnlockAll = useCallback((): void => {
    if (lockedIds.size === 0) return
    setBulkScope({
      label: 'Kana Dojo',
      characterIds: Array.from(lockedIds),
    })
  }, [lockedIds])

  // Reset variants: clear mastery scores for every character in the scope,
  // keep every one of them in manuallyUnlocked so tiles stay visible as
  // unlocked-at-0.
  const handleBulkResetConfirm = useCallback((characterIds: readonly string[]): void => {
    setMastery((prev) => {
      const nextScores = { ...prev.scores }
      const manualSet = new Set(prev.manuallyUnlocked)
      for (const id of characterIds) {
        delete nextScores[id]
        manualSet.add(id)
      }
      return {
        scores: nextScores,
        manuallyUnlocked: [...manualSet],
      }
    })
    setBulkResetScope(null)
  }, [])

  const handleBulkMarkMastered = useCallback((characterIds: readonly string[]): void => {
    setMastery((prev) => {
      const nextScores = { ...prev.scores }
      for (const id of characterIds) {
        nextScores[id] = MASTERY_THRESHOLD + 5
      }
      return { ...prev, scores: nextScores }
    })
    setBulkResetScope(null)
  }, [])

  const handleResetScript = useCallback((script: Script): void => {
    const ids = scriptCharacters(script).map((c) => c.id)
    if (ids.length === 0) return
    setBulkResetScope({ label: SCRIPT_LABELS[script], characterIds: ids })
  }, [])

  const handleResetStage = useCallback((script: Script, stage: Stage): void => {
    const ids = CHARACTERS_BY_SCRIPT_STAGE[script][stage].map((c) => c.id)
    if (ids.length === 0) return
    setBulkResetScope({
      label: `${SCRIPT_LABELS[script]} ${STAGE_LABELS[stage]}`,
      characterIds: ids,
    })
  }, [])

  const handleResetAll = useCallback((): void => {
    setBulkResetScope({
      label: 'Kana Dojo',
      characterIds: KANA_CHARACTERS.map((c) => c.id),
    })
  }, [])

  const showHelp = !helpDismissed && lockedIds.size === KANA_CHARACTERS.length
  const selectedScore = selected ? (mastery.scores[selected.id] ?? 0) : 0

  return (
    <div className="min-h-svh text-[#3e312e]" style={{ backgroundColor: 'var(--color-dojo-bg)' }}>
      <AppTopBar />

      <div className="pt-20 pb-16 px-2 md:px-5">
        <main className="mx-auto max-w-[1080px]">
          <div className="flex items-center gap-3 mb-6 pl-5">
            <h1
              className="font-bold text-[#3e312e] tracking-tight"
              style={{ fontSize: 'clamp(20px, calc(7.5vw - 4px), 32px)' }}
            >
              Kana Dojo
            </h1>
            {lockedIds.size > 0 ? (
              <UnlockButton
                size="large"
                color="dark"
                icon="locked"
                onClick={handleUnlockAll}
                ariaLabel={`Unlock all ${lockedIds.size} locked characters across the Dojo`}
              />
            ) : (
              <UnlockButton
                size="large"
                color="grey"
                icon="unlocked"
                onClick={handleResetAll}
                ariaLabel={`Reset progress on all ${KANA_CHARACTERS.length} characters across the Dojo`}
              />
            )}
          </div>

          {showHelp && (
            <div className="mb-6 pl-5">
              <HelpCard onDismiss={dismissHelp} />
            </div>
          )}

          <section className="rounded-xl border border-warm-200 bg-surface-raised p-2 min-[1028px]:p-4 space-y-3 min-[1028px]:space-y-4">
            {SCRIPT_ORDER.map((script, index) => (
              <div
                key={script}
                className={index > 0 ? 'border-t border-warm-200 pt-3 min-[1028px]:pt-4' : ''}
              >
                <CharacterGroup
                  script={script}
                  scriptLabel={SCRIPT_LABELS[script]}
                  stageOrder={STAGE_ORDER}
                  stageLabels={STAGE_LABELS}
                  charactersByStage={CHARACTERS_BY_SCRIPT_STAGE[script]}
                  scores={mastery.scores}
                  lockedIds={lockedIds}
                  scriptActivity={scriptActivity[script]}
                  scriptOpen={scriptOpen.has(script)}
                  stageOpen={stageOpen[script]}
                  stageActivity={stageActivity[script]}
                  onToggleScript={(): void => toggleScript(script)}
                  onToggleStage={(stage): void => toggleStage(script, stage)}
                  onUnlockScript={(): void => handleUnlockScript(script)}
                  onUnlockStage={(stage): void => handleUnlockStage(script, stage)}
                  onResetScript={(): void => handleResetScript(script)}
                  onResetStage={(stage): void => handleResetStage(script, stage)}
                  onTileClick={handleTileClick}
                />
              </div>
            ))}
          </section>
        </main>
      </div>

      <TileDetailPopover
        character={selected}
        score={selectedScore}
        onReset={handleResetCharacter}
        onMarkMastered={handleMarkCharacterMastered}
        onClose={(): void => setSelected(null)}
      />

      <UnlockPrompt
        character={pendingIndividual}
        onConfirm={handleIndividualUnlock}
        onClose={(): void => setPendingIndividual(null)}
      />

      <BulkUnlockPrompt
        scope={bulkScope}
        onConfirm={handleBulkUnlockConfirm}
        onClose={(): void => setBulkScope(null)}
      />

      <BulkResetPrompt
        scope={bulkResetScope}
        onConfirm={handleBulkResetConfirm}
        onMarkMastered={handleBulkMarkMastered}
        onClose={(): void => setBulkResetScope(null)}
      />
    </div>
  )
}

// ── Dispatcher ────────────────────────────────
// Public entry point. Default `state='ready'` renders the shipped ready
// shell so the existing route file calling <KanaDojoClient fixture="variety" />
// behaves identically to before. Non-ready values render the matching
// deterministic shell.

export function KanaDojoClient({
  fixture = 'variety',
  state = 'ready',
}: KanaDojoClientProps): ReactNode {
  if (state === 'loading') return <KanaLoadingShell />
  if (state === 'error') return <KanaErrorShell />
  if (state === 'empty') return <KanaEmptyShell />
  return <KanaDojoReadyShell fixture={fixture} />
}
