// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useDemoKanaPracticeSession.test.ts
// Purpose: Tests for the demo kana practice hook. Verifies prompt
//          sequence, completion, no store writes, and interface
//          contract with GameWindow.
// Depends on: hooks/useDemoKanaPracticeSession.ts, stores/demo.store.ts,
//             stores/mastery.store.ts, stores/counter.store.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDemoKanaPracticeSession } from '../useDemoKanaPracticeSession'
import { useDemoStore } from '@/stores/demo.store'
import { useMasteryStore } from '@/stores/mastery.store'
import { useCounterStore } from '@/stores/counter.store'
import { DEMO_KANA_PROMPTS, DEMO_KANA_PROMPT_COUNT } from '@/data/demo/demo-prompts'

describe('useDemoKanaPracticeSession', () => {
  beforeEach(() => {
    useDemoStore.getState().reset()
    useDemoStore.setState({ isActive: false, kanaIndex: 0, isKanaComplete: false })
  })

  it('returns the first demo prompt at index 0', () => {
    const { result } = renderHook(() => useDemoKanaPracticeSession())
    expect(result.current.prompt).toEqual(DEMO_KANA_PROMPTS[0])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isEmpty).toBe(false)
  })

  it('advances to the next prompt on advanceToNext', () => {
    const { result } = renderHook(() => useDemoKanaPracticeSession())
    act(() => {
      result.current.advanceToNext()
    })
    expect(result.current.prompt).toEqual(DEMO_KANA_PROMPTS[1])
  })

  it('returns null prompt when all prompts are exhausted', () => {
    useDemoStore.setState({ kanaIndex: DEMO_KANA_PROMPT_COUNT, isKanaComplete: true })
    const { result } = renderHook(() => useDemoKanaPracticeSession())
    expect(result.current.prompt).toBeNull()
  })

  it('does not write to mastery store on handleWordComplete', () => {
    useMasteryStore.setState({ scores: { 'h-a': 5 }, learningScores: { 'h-a': 3 } })
    const scoresBefore = { ...useMasteryStore.getState().scores }
    const learningBefore = { ...useMasteryStore.getState().learningScores }

    const { result } = renderHook(() => useDemoKanaPracticeSession())
    act(() => {
      result.current.handleWordComplete()
    })

    expect(useMasteryStore.getState().scores).toEqual(scoresBefore)
    expect(useMasteryStore.getState().learningScores).toEqual(learningBefore)
  })

  it('does not write to counter store on handleWordComplete', () => {
    const countersBefore = { ...useCounterStore.getState().counters }
    const { result } = renderHook(() => useDemoKanaPracticeSession())
    act(() => {
      result.current.handleWordComplete()
    })
    expect(useCounterStore.getState().counters).toEqual(countersBefore)
  })

  it('practiceIds contains all demo character IDs', () => {
    const { result } = renderHook(() => useDemoKanaPracticeSession())
    const allCharIds = DEMO_KANA_PROMPTS.flatMap((p) => p.characters.map((c) => c.id))
    for (const id of allCharIds) {
      expect(result.current.practiceIds.has(id)).toBe(true)
    }
  })
})
