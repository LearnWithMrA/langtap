// ─────────────────────────────────────────────
// File: stores/__tests__/settings.store.test.ts
// Purpose: Tests for the settings store. Verifies inputDirection,
//          kotobaInput, and other settings persist correctly.
// Depends on: stores/settings.store.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '@/stores/settings.store'

beforeEach(() => {
  useSettingsStore.setState({
    inputDirection: 'alternate',
    kotobaInput: 'readings',
    hints: true,
    inputMode: 'tap',
  })
})

describe('settings.store - inputDirection', () => {
  it('defaults to alternate', () => {
    expect(useSettingsStore.getState().inputDirection).toBe('alternate')
  })

  it('can be set to kana-to-romaji', () => {
    useSettingsStore.getState().setInputDirection('kana-to-romaji')
    expect(useSettingsStore.getState().inputDirection).toBe('kana-to-romaji')
  })

  it('can be set to romaji-to-kana', () => {
    useSettingsStore.getState().setInputDirection('romaji-to-kana')
    expect(useSettingsStore.getState().inputDirection).toBe('romaji-to-kana')
  })

  it('can be set back to alternate', () => {
    useSettingsStore.getState().setInputDirection('kana-to-romaji')
    useSettingsStore.getState().setInputDirection('alternate')
    expect(useSettingsStore.getState().inputDirection).toBe('alternate')
  })
})

describe('settings.store - kotobaInput', () => {
  it('defaults to readings', () => {
    expect(useSettingsStore.getState().kotobaInput).toBe('readings')
  })

  it('can be set to kanji', () => {
    useSettingsStore.getState().setKotobaInput('kanji')
    expect(useSettingsStore.getState().kotobaInput).toBe('kanji')
  })
})

describe('settings.store - hints', () => {
  it('defaults to true', () => {
    expect(useSettingsStore.getState().hints).toBe(true)
  })

  it('can be toggled off', () => {
    useSettingsStore.getState().setHints(false)
    expect(useSettingsStore.getState().hints).toBe(false)
  })
})
