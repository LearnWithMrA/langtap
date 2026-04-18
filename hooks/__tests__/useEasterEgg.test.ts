// ------------------------------------------------------------
// File: hooks/__tests__/useEasterEgg.test.ts
// Purpose: Tests for the useEasterEgg hook. Validates trigger
//          sequence detection, input field exclusion, and buffer
//          management.
// Depends on: hooks/useEasterEgg.ts
// ------------------------------------------------------------

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEasterEgg } from '../useEasterEgg'

// -- Helpers ------------------------------------------------

function pressKey(key: string, target?: Partial<HTMLElement>): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true })
  if (target) {
    Object.defineProperty(event, 'target', { value: target })
  }
  window.dispatchEvent(event)
}

function typeTrigger(): void {
  for (const char of 'langtap') {
    pressKey(char)
  }
}

// -- Tests --------------------------------------------------

describe('useEasterEgg', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock Audio to avoid file-not-found errors
    vi.stubGlobal(
      'Audio',
      class MockAudio {
        volume = 1
        play(): Promise<void> {
          return Promise.resolve()
        }
      },
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('starts inactive', () => {
    const { result } = renderHook(() => useEasterEgg())
    expect(result.current.isActive).toBe(false)
  })

  it('activates when "langtap" is typed in sequence', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => typeTrigger())

    expect(result.current.isActive).toBe(true)
  })

  it('deactivates after 4 seconds', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => typeTrigger())
    expect(result.current.isActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current.isActive).toBe(false)
  })

  it('does not activate on partial match', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => {
      for (const char of 'langta') {
        pressKey(char)
      }
    })

    expect(result.current.isActive).toBe(false)
  })

  it('does not activate when wrong sequence is typed', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => {
      for (const char of 'langtop') {
        pressKey(char)
      }
    })

    expect(result.current.isActive).toBe(false)
  })

  it('ignores keydown events inside input elements', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => {
      for (const char of 'langtap') {
        pressKey(char, { tagName: 'INPUT' })
      }
    })

    expect(result.current.isActive).toBe(false)
  })

  it('ignores keydown events inside textarea elements', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => {
      for (const char of 'langtap') {
        pressKey(char, { tagName: 'TEXTAREA' })
      }
    })

    expect(result.current.isActive).toBe(false)
  })

  it('ignores keydown events inside contenteditable elements', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => {
      for (const char of 'langtap') {
        pressKey(char, { tagName: 'DIV', isContentEditable: true })
      }
    })

    expect(result.current.isActive).toBe(false)
  })

  it('ignores non-printable keys like Shift', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => {
      pressKey('Shift')
      for (const char of 'langtap') {
        pressKey(char)
      }
    })

    // The Shift key has length > 1 so it is skipped, but the buffer
    // should still trigger because only printable chars are tracked
    expect(result.current.isActive).toBe(true)
  })

  it('resets buffer after activation', () => {
    const { result } = renderHook(() => useEasterEgg())

    act(() => typeTrigger())
    expect(result.current.isActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current.isActive).toBe(false)

    // Type it again: should activate again
    act(() => typeTrigger())
    expect(result.current.isActive).toBe(true)
  })

  it('handles interleaved characters and still triggers', () => {
    const { result } = renderHook(() => useEasterEgg())

    // Type some junk then the trigger word immediately after
    act(() => {
      for (const char of 'xyzlangtap') {
        pressKey(char)
      }
    })

    expect(result.current.isActive).toBe(true)
  })
})
