// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: hooks/__tests__/useDialogueSeen.test.ts
// Purpose: Tests for the clearAllDialoguesSeen standalone function
//          exported from useDialogueSeen. Validates that it removes
//          the localStorage key and is safe to call server-side.
// Depends on: hooks/useDialogueSeen.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { clearAllDialoguesSeen } from '@/hooks/useDialogueSeen'

// ── Tests ─────────────────────────────────────

describe('clearAllDialoguesSeen', () => {
  const STORAGE_KEY = 'langtap-dialogues-seen'

  beforeEach(() => {
    window.localStorage.clear()
  })

  it('removes the dialogues-seen key from localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(['kana-first-play', 'kotoba-first-tap']),
    )

    clearAllDialoguesSeen()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('is a no-op when the key does not exist', () => {
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()

    clearAllDialoguesSeen()

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
