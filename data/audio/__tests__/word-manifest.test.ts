// ─────────────────────────────────────────────
// File: data/audio/__tests__/word-manifest.test.ts
// Purpose: Tests for getWordAudioPath helper. Validates correct
//          level-based path generation and null for missing IDs.
// Depends on: data/audio/word-manifest.ts
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { getWordAudioPath } from '../word-manifest'

describe('getWordAudioPath', () => {
  it('returns null for a word ID not in the manifest', () => {
    expect(getWordAudioPath('nonexistent-id')).toBeNull()
  })

  it('returns null for a random invalid ID', () => {
    expect(getWordAudioPath('zzz-does-not-exist-999')).toBeNull()
  })
})
