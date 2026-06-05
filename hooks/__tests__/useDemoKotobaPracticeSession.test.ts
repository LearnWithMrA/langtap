// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useDemoKotobaPracticeSession.test.ts
// Purpose: Tests for the demo kotoba practice hook. Verifies prompt
//          sequence, completion, no store writes, and readings/kanji
//          mode field contracts.
// Depends on: hooks/useDemoKotobaPracticeSession.ts, stores/demo.store.ts,
//             stores/word-mastery.store.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDemoKotobaPracticeSession } from '../useDemoKotobaPracticeSession'
import { useDemoStore } from '@/stores/demo.store'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { DEMO_KOTOBA_PROMPTS, DEMO_KOTOBA_PROMPT_COUNT } from '@/data/demo/demo-prompts'

describe('useDemoKotobaPracticeSession', () => {
  beforeEach(() => {
    useDemoStore.getState().reset()
    useDemoStore.setState({ isActive: false, kotobaIndex: 0, isKotobaComplete: false })
  })

  it('returns the first demo prompt at index 0', () => {
    const { result } = renderHook(() => useDemoKotobaPracticeSession())
    expect(result.current.prompt).toEqual(DEMO_KOTOBA_PROMPTS[0])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isEmpty).toBe(false)
  })

  it('advances to the next prompt on advanceToNext', () => {
    const { result } = renderHook(() => useDemoKotobaPracticeSession())
    act(() => {
      result.current.advanceToNext()
    })
    expect(result.current.prompt).toEqual(DEMO_KOTOBA_PROMPTS[1])
  })

  it('returns null prompt when all prompts are exhausted', () => {
    useDemoStore.setState({ kotobaIndex: DEMO_KOTOBA_PROMPT_COUNT, isKotobaComplete: true })
    const { result } = renderHook(() => useDemoKotobaPracticeSession())
    expect(result.current.prompt).toBeNull()
  })

  it('does not write to word mastery store on recordWordComplete', () => {
    useWordMasteryStore.setState({ scores: { 'test-word': 10 } })
    const scoresBefore = { ...useWordMasteryStore.getState().scores }

    const { result } = renderHook(() => useDemoKotobaPracticeSession())
    act(() => {
      result.current.recordWordComplete()
    })

    expect(useWordMasteryStore.getState().scores).toEqual(scoresBefore)
  })

  it('returns empty kanjiDistractors array', () => {
    const { result } = renderHook(() => useDemoKotobaPracticeSession())
    expect(result.current.kanjiDistractors).toEqual([])
  })

  it('all prompts have required fields for readings and kanji modes', () => {
    for (const prompt of DEMO_KOTOBA_PROMPTS) {
      expect(prompt.kana).toBeTruthy()
      expect(prompt.english).toBeTruthy()
      expect(prompt.characters.length).toBeGreaterThan(0)
    }
  })
})
