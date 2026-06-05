// ─────────────────────────────────────────────
// File: stores/__tests__/demo.store.test.ts
// Purpose: Tests for the demo store. Covers index advancement,
//          completion detection, reset, and boundary behaviour.
// Depends on: stores/demo.store.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { useDemoStore } from '../demo.store'
import { DEMO_KANA_PROMPT_COUNT, DEMO_KOTOBA_PROMPT_COUNT } from '@/data/demo/demo-prompts'

describe('useDemoStore', () => {
  beforeEach(() => {
    useDemoStore.getState().reset()
    useDemoStore.setState({ isActive: false })
  })

  it('starts with indices at 0 and both incomplete', () => {
    const state = useDemoStore.getState()
    expect(state.kanaIndex).toBe(0)
    expect(state.kotobaIndex).toBe(0)
    expect(state.isKanaComplete).toBe(false)
    expect(state.isKotobaComplete).toBe(false)
  })

  it('activate sets isActive to true', () => {
    useDemoStore.getState().activate()
    expect(useDemoStore.getState().isActive).toBe(true)
  })

  it('advanceKana increments kanaIndex', () => {
    useDemoStore.getState().advanceKana()
    expect(useDemoStore.getState().kanaIndex).toBe(1)
    expect(useDemoStore.getState().isKanaComplete).toBe(false)
  })

  it('advanceKana marks complete at prompt count', () => {
    for (let i = 0; i < DEMO_KANA_PROMPT_COUNT; i++) {
      useDemoStore.getState().advanceKana()
    }
    expect(useDemoStore.getState().isKanaComplete).toBe(true)
    expect(useDemoStore.getState().kanaIndex).toBe(DEMO_KANA_PROMPT_COUNT)
  })

  it('advanceKotoba increments kotobaIndex', () => {
    useDemoStore.getState().advanceKotoba()
    expect(useDemoStore.getState().kotobaIndex).toBe(1)
    expect(useDemoStore.getState().isKotobaComplete).toBe(false)
  })

  it('advanceKotoba marks complete at prompt count', () => {
    for (let i = 0; i < DEMO_KOTOBA_PROMPT_COUNT; i++) {
      useDemoStore.getState().advanceKotoba()
    }
    expect(useDemoStore.getState().isKotobaComplete).toBe(true)
    expect(useDemoStore.getState().kotobaIndex).toBe(DEMO_KOTOBA_PROMPT_COUNT)
  })

  it('reset clears both indices and completion flags', () => {
    for (let i = 0; i < DEMO_KANA_PROMPT_COUNT; i++) {
      useDemoStore.getState().advanceKana()
    }
    useDemoStore.getState().advanceKotoba()
    useDemoStore.getState().reset()

    const state = useDemoStore.getState()
    expect(state.kanaIndex).toBe(0)
    expect(state.kotobaIndex).toBe(0)
    expect(state.isKanaComplete).toBe(false)
    expect(state.isKotobaComplete).toBe(false)
    expect(state.isActive).toBe(true)
  })
})
