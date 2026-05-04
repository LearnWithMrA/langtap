// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useTutorialTrial.test.ts
// Purpose: Tests for the tutorial trial hook. Verifies
//          8-prompt sequence, no store mutations, completion flag.
// Depends on: hooks/useTutorialTrial.ts
// ─────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useTutorialTrial } from '../useTutorialTrial'
import { TRIAL_PROMPTS } from '@/data/tutorial/trial-prompts'

const PROMPT_COUNT = TRIAL_PROMPTS.length

describe('useTutorialTrial', () => {
  it('starts with the first trial prompt', () => {
    const { result } = renderHook(() => useTutorialTrial())
    expect(result.current.prompt).not.toBeNull()
    expect(result.current.prompt?.word.kana).toBe('あ')
    expect(result.current.isComplete).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isEmpty).toBe(false)
  })

  it('advances through all prompts in order', () => {
    const { result } = renderHook(() => useTutorialTrial())

    expect(result.current.prompt?.word.kana).toBe('あ')

    act(() => result.current.advanceToNext())
    expect(result.current.prompt?.word.kana).toBe('い')

    act(() => result.current.advanceToNext())
    expect(result.current.prompt?.word.kana).toBe('う')

    act(() => result.current.advanceToNext())
    expect(result.current.prompt?.word.kana).toBe('あう')

    act(() => result.current.advanceToNext())
    expect(result.current.prompt?.word.kana).toBe('いえ')

    act(() => result.current.advanceToNext())
    expect(result.current.prompt?.word.kana).toBe('うえ')
  })

  it('is complete after all prompts', () => {
    const { result } = renderHook(() => useTutorialTrial())

    for (let i = 0; i < PROMPT_COUNT; i++) {
      expect(result.current.isComplete).toBe(false)
      act(() => result.current.advanceToNext())
    }

    expect(result.current.isComplete).toBe(true)
    expect(result.current.prompt).toBeNull()
  })

  it('handleWordComplete is a no-op', () => {
    const { result } = renderHook(() => useTutorialTrial())
    expect(() => result.current.handleWordComplete([])).not.toThrow()
  })
})
