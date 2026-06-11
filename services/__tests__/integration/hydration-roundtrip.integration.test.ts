// ─────────────────────────────────────────────
// File: services/__tests__/integration/hydration-roundtrip.integration.test.ts
// Purpose: Integration tests for the full hydration round-trip.
//          Verifies that checkpoint -> load snapshot -> unlock derivation
//          produces consistent state, covering the bug where kana
//          manual unlocks were lost on refresh (server unlock IDs not
//          synced back to the onboarding store).
//          Tests both kana and kotoba domains.
// Depends on: setup.ts, engine/unlock.ts
// ─────────────────────────────────────────────

import { it, expect, beforeAll, afterAll } from 'vitest'
import {
  type TestContext,
  setupTestUser,
  teardownTestUser,
  skipIfNotRunning,
  integrationDescribe,
} from './setup'
import { getUnlockedCharacterIds } from '@/engine/unlock'

// ── Helpers ──────────────────────────────────

type SnapshotScoreRow = { character_id: string; score: number; learning_score: number }
type WordSnapshotRow = { word_id: string; score: number }

function parseMasterySnapshot(data: unknown): {
  epoch: number
  scores: SnapshotScoreRow[]
  unlocks: string[]
} {
  const d = data as Record<string, unknown>
  return {
    epoch: (d['epoch'] as number) ?? 0,
    scores: (d['scores'] as SnapshotScoreRow[]) ?? [],
    unlocks: (d['unlocks'] as string[]) ?? [],
  }
}

function parseWordSnapshot(data: unknown): {
  epoch: number
  scores: WordSnapshotRow[]
  unlocks: string[]
} {
  const d = data as Record<string, unknown>
  return {
    epoch: (d['epoch'] as number) ?? 0,
    scores: (d['scores'] as WordSnapshotRow[]) ?? [],
    unlocks: (d['unlocks'] as string[]) ?? [],
  }
}

// ── Kana hydration round-trip ────────────────

integrationDescribe('Kana hydration round-trip', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('learning_score survives checkpoint -> snapshot round-trip', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    const { error } = await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: epoch,
      p_rows: [
        { character_id: 'h-a', score: 0, learning_score: 5 },
        { character_id: 'h-i', score: 0, learning_score: 3 },
      ],
    })
    expect(error).toBeNull()

    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const snapshot = parseMasterySnapshot(reloaded)

    const ha = snapshot.scores.find((s) => s.character_id === 'h-a')
    const hi = snapshot.scores.find((s) => s.character_id === 'h-i')

    expect(ha).toBeTruthy()
    expect(ha!.learning_score).toBe(5)
    expect(hi).toBeTruthy()
    expect(hi!.learning_score).toBe(3)
  })

  it('mastery score and learning_score both survive', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: epoch,
      p_rows: [{ character_id: 'h-u', score: 42, learning_score: 5 }],
    })

    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const snapshot = parseMasterySnapshot(reloaded)
    const hu = snapshot.scores.find((s) => s.character_id === 'h-u')

    expect(hu).toBeTruthy()
    expect(hu!.score).toBe(42)
    expect(hu!.learning_score).toBe(5)
  })

  it('manual unlocks survive checkpoint -> snapshot round-trip', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    const { error } = await ctx.userClient!.rpc('checkpoint_manual_unlocks', {
      p_epoch: epoch,
      p_ids: ['h-e', 'h-o', 'h-ka'],
    })
    expect(error).toBeNull()

    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const snapshot = parseMasterySnapshot(reloaded)

    expect(snapshot.unlocks).toContain('h-e')
    expect(snapshot.unlocks).toContain('h-o')
    expect(snapshot.unlocks).toContain('h-ka')
  })

  it('getUnlockedCharacterIds derives correct unlock set from snapshot data', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const snapshot = parseMasterySnapshot(reloaded)

    const learningScores: Record<string, number> = {}
    for (const row of snapshot.scores) {
      learningScores[row.character_id] = row.learning_score
    }

    const manualUnlocks = new Set(snapshot.unlocks)
    // Include both score IDs and manual unlock IDs (manual unlocks may
    // not have a mastery row, so they won't be in snapshot.scores)
    const allIds = [
      ...new Set([...snapshot.scores.map((s) => s.character_id), ...snapshot.unlocks]),
    ]

    const unlocked = getUnlockedCharacterIds(allIds, learningScores, manualUnlocks)

    // h-a has learning_score=5, should be unlocked via learning
    expect(unlocked.has('h-a')).toBe(true)
    // h-i has learning_score=3, not manually unlocked, should be locked
    expect(unlocked.has('h-i')).toBe(false)
    // h-e was manually unlocked
    expect(unlocked.has('h-e')).toBe(true)
    // h-u has learning_score=5, should be unlocked via learning
    expect(unlocked.has('h-u')).toBe(true)
  })

  it('greatest-merge preserves higher server score on re-checkpoint', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    // First checkpoint: high score
    await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: epoch,
      p_rows: [{ character_id: 'h-ki', score: 50, learning_score: 5 }],
    })

    // Second checkpoint: lower score (should not decrease)
    await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: epoch,
      p_rows: [{ character_id: 'h-ki', score: 10, learning_score: 2 }],
    })

    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const snapshot = parseMasterySnapshot(reloaded)
    const hki = snapshot.scores.find((s) => s.character_id === 'h-ki')

    expect(hki).toBeTruthy()
    expect(hki!.score).toBe(50)
    expect(hki!.learning_score).toBe(5)
  })

  it('cross-device scenario: manual unlock persists without localStorage', async () => {
    if (skipIfNotRunning(ctx)) return

    // Simulate: user unlocked h-sa in the dojo on device A
    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    await ctx.userClient!.rpc('checkpoint_manual_unlocks', {
      p_epoch: epoch,
      p_ids: ['h-sa'],
    })

    // Simulate device B: fresh load with no localStorage
    // (just load_mastery_snapshot, no local merge)
    const { data: freshSnap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const fresh = parseMasterySnapshot(freshSnap)

    // h-sa should be in the unlocks list from server
    expect(fresh.unlocks).toContain('h-sa')

    // Derive unlock state from server data only (no onboarding store)
    const learningScores: Record<string, number> = {}
    for (const row of fresh.scores) {
      learningScores[row.character_id] = row.learning_score
    }
    const serverManualUnlocks = new Set(fresh.unlocks)
    // Include unlock IDs in the character list (they may lack mastery rows)
    const allIds = [...new Set([...fresh.scores.map((s) => s.character_id), ...fresh.unlocks])]
    // h-sa has learning_score=0 but is manually unlocked
    const unlocked = getUnlockedCharacterIds(allIds, learningScores, serverManualUnlocks)

    expect(unlocked.has('h-sa')).toBe(true)
  })
})

// ── Kana reset round-trips ───────────────────

integrationDescribe('Kana reset round-trip', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('reset_all_mastery clears scores and unlocks on reload', async () => {
    if (skipIfNotRunning(ctx)) return

    // Write data first
    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: epoch,
      p_rows: [{ character_id: 'h-a', score: 20, learning_score: 5 }],
    })
    await ctx.userClient!.rpc('checkpoint_manual_unlocks', {
      p_epoch: epoch,
      p_ids: ['h-ka'],
    })

    // Reset
    const { data: resetData } = await ctx.userClient!.rpc('reset_all_mastery')
    const newEpoch = (resetData as Record<string, unknown>)['new_epoch'] as number
    expect(newEpoch).toBeGreaterThan(epoch)

    // Reload snapshot - scores should be zeroed, unlocks cleared
    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const after = parseMasterySnapshot(reloaded)

    expect(after.epoch).toBe(newEpoch)
    // All scores and learning scores should be 0 after reset
    for (const row of after.scores) {
      expect(row.score).toBe(0)
      expect(row.learning_score).toBe(0)
    }
    expect(after.unlocks).toHaveLength(0)
  })

  it('checkpoint after reset uses new epoch', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: snap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const epoch = parseMasterySnapshot(snap).epoch

    // Checkpoint with current epoch should work
    const { data: result } = await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: epoch,
      p_rows: [{ character_id: 'h-a', score: 10, learning_score: 3 }],
    })
    const applied = (result as Record<string, unknown>)['applied_count'] as number
    expect(applied).toBe(1)

    // Reload and verify
    const { data: reloaded } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const after = parseMasterySnapshot(reloaded)
    const ha = after.scores.find((s) => s.character_id === 'h-a')
    expect(ha).toBeTruthy()
    expect(ha!.score).toBe(10)
  })
})

// ── Factory reset round-trip ─────────────────

integrationDescribe('Factory reset round-trip', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('factory_reset clears all progress and preserves settings', async () => {
    if (skipIfNotRunning(ctx)) return

    // Seed mastery data
    const { data: kanaSnap } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const kanaEpoch = parseMasterySnapshot(kanaSnap).epoch
    await ctx.userClient!.rpc('checkpoint_mastery', {
      p_epoch: kanaEpoch,
      p_rows: [{ character_id: 'h-a', score: 30, learning_score: 5 }],
    })
    await ctx.userClient!.rpc('checkpoint_manual_unlocks', {
      p_epoch: kanaEpoch,
      p_ids: ['h-ka'],
    })

    // Seed word mastery data
    const { data: wordSnap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const wordEpoch = parseWordSnapshot(wordSnap).epoch
    const { data: words } = await ctx
      .userClient!.from('leaderboard_word_catalog')
      .select('word_id')
      .limit(1)
    const wordId = (words?.[0] as Record<string, unknown>)?.word_id as string
    if (wordId) {
      await ctx.userClient!.rpc('checkpoint_word_mastery', {
        p_epoch: wordEpoch,
        p_rows: [{ word_id: wordId, score: 10 }],
      })
    }

    // Seed practice activity
    await ctx.userClient!.rpc('record_practice_activity', {
      p_completion_id: crypto.randomUUID(),
      p_characters_count: 20,
    })

    // Set a profile setting
    await ctx
      .userClient!.from('profiles')
      .update({ input_mode: 'swipe', distance_unit: 'imperial' })
      .eq('id', ctx.testUserId!)

    // Factory reset
    const { data: resetData, error: resetErr } = await ctx.userClient!.rpc('factory_reset')
    expect(resetErr).toBeNull()
    const rd = resetData as Record<string, unknown>
    const newMasteryEpoch = rd['new_mastery_epoch'] as number
    const newWordEpoch = rd['new_word_mastery_epoch'] as number

    // Verify kana mastery is cleared
    const { data: kanaReload } = await ctx.userClient!.rpc('load_mastery_snapshot')
    const kanaAfter = parseMasterySnapshot(kanaReload)
    expect(kanaAfter.epoch).toBe(newMasteryEpoch)
    expect(kanaAfter.scores).toHaveLength(0)
    expect(kanaAfter.unlocks).toHaveLength(0)

    // Verify word mastery is cleared
    const { data: wordReload } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const wordAfter = parseWordSnapshot(wordReload)
    expect(wordAfter.epoch).toBe(newWordEpoch)
    expect(wordAfter.scores).toHaveLength(0)
    expect(wordAfter.unlocks).toHaveLength(0)

    // Verify practice sessions are cleared
    const { data: sessions } = await ctx
      .userClient!.from('practice_sessions')
      .select('id')
      .eq('user_id', ctx.testUserId!)
    expect(sessions).toHaveLength(0)

    // Verify profile settings are preserved
    const { data: profile } = await ctx
      .userClient!.from('profiles')
      .select('input_mode, distance_unit')
      .eq('id', ctx.testUserId!)
      .single()
    expect(profile.input_mode).toBe('swipe')
    expect(profile.distance_unit).toBe('imperial')
  })
})

// ── Kotoba hydration round-trip ──────────────

integrationDescribe('Kotoba hydration round-trip', () => {
  let ctx: TestContext

  beforeAll(async () => {
    ctx = await setupTestUser()
  }, 15000)

  afterAll(async () => {
    await teardownTestUser(ctx)
  })

  it('word mastery score survives checkpoint -> snapshot round-trip', async () => {
    if (skipIfNotRunning(ctx)) return

    // Get a valid word ID from the catalog
    const { data: words } = await ctx
      .userClient!.from('leaderboard_word_catalog')
      .select('word_id')
      .limit(3)
    const wordIds = words?.map((w: Record<string, unknown>) => w.word_id as string) ?? []
    if (wordIds.length < 2) return

    const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const epoch = parseWordSnapshot(snap).epoch

    const { error } = await ctx.userClient!.rpc('checkpoint_word_mastery', {
      p_epoch: epoch,
      p_rows: [
        { word_id: wordIds[0], score: 15 },
        { word_id: wordIds[1], score: 3 },
      ],
    })
    expect(error).toBeNull()

    const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const snapshot = parseWordSnapshot(reloaded)

    const w0 = snapshot.scores.find((s) => s.word_id === wordIds[0])
    const w1 = snapshot.scores.find((s) => s.word_id === wordIds[1])

    expect(w0).toBeTruthy()
    expect(w0!.score).toBe(15)
    expect(w1).toBeTruthy()
    expect(w1!.score).toBe(3)
  })

  it('word manual unlocks survive checkpoint -> snapshot round-trip', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: words } = await ctx
      .userClient!.from('leaderboard_word_catalog')
      .select('word_id')
      .limit(2)
    const wordIds = words?.map((w: Record<string, unknown>) => w.word_id as string) ?? []
    if (wordIds.length < 2) return

    const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const epoch = parseWordSnapshot(snap).epoch

    const { error } = await ctx.userClient!.rpc('checkpoint_word_manual_unlocks', {
      p_epoch: epoch,
      p_ids: wordIds,
    })
    expect(error).toBeNull()

    const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const snapshot = parseWordSnapshot(reloaded)

    for (const id of wordIds) {
      expect(snapshot.unlocks).toContain(id)
    }
  })

  it('greatest-merge preserves higher word score on re-checkpoint', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: words } = await ctx
      .userClient!.from('leaderboard_word_catalog')
      .select('word_id')
      .limit(1)
    const wordId = (words?.[0] as Record<string, unknown>)?.word_id as string
    if (!wordId) return

    const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const epoch = parseWordSnapshot(snap).epoch

    await ctx.userClient!.rpc('checkpoint_word_mastery', {
      p_epoch: epoch,
      p_rows: [{ word_id: wordId, score: 30 }],
    })

    await ctx.userClient!.rpc('checkpoint_word_mastery', {
      p_epoch: epoch,
      p_rows: [{ word_id: wordId, score: 5 }],
    })

    const { data: reloaded } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const snapshot = parseWordSnapshot(reloaded)
    const found = snapshot.scores.find((s) => s.word_id === wordId)

    expect(found).toBeTruthy()
    expect(found!.score).toBe(30)
  })

  it('cross-device scenario: word unlock persists without localStorage', async () => {
    if (skipIfNotRunning(ctx)) return

    const { data: words } = await ctx
      .userClient!.from('leaderboard_word_catalog')
      .select('word_id')
      .limit(1)
    const wordId = (words?.[0] as Record<string, unknown>)?.word_id as string
    if (!wordId) return

    const { data: snap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const epoch = parseWordSnapshot(snap).epoch

    await ctx.userClient!.rpc('checkpoint_word_manual_unlocks', {
      p_epoch: epoch,
      p_ids: [wordId],
    })

    // Fresh load (simulating new device)
    const { data: freshSnap } = await ctx.userClient!.rpc('load_word_mastery_snapshot')
    const fresh = parseWordSnapshot(freshSnap)

    expect(fresh.unlocks).toContain(wordId)
  })
})
