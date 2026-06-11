// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: stores/__tests__/scoped-storage-sweep.test.ts
// Purpose: Tests for the one-time obsolete localStorage sweep.
//          Obsolete keys from retired features are removed, current
//          keys are preserved, and the sweep runs once per version.
// Depends on: stores/scoped-storage.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'
import { sweepObsoleteStorage, STORAGE_SCHEMA_VERSION } from '../scoped-storage'

const VERSION_KEY = 'langtap-storage-version'

describe('sweepObsoleteStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes obsolete exact keys from retired features', () => {
    localStorage.setItem('langtap-guest-session-id', 'abc')
    localStorage.setItem('langtap-guest-snapshot-marker', '1')
    localStorage.setItem('langtap-mastery', '{"legacy":true}')
    localStorage.setItem('langtap-settings', '{"legacy":true}')

    sweepObsoleteStorage()

    expect(localStorage.getItem('langtap-guest-session-id')).toBeNull()
    expect(localStorage.getItem('langtap-guest-snapshot-marker')).toBeNull()
    expect(localStorage.getItem('langtap-mastery')).toBeNull()
    expect(localStorage.getItem('langtap-settings')).toBeNull()
  })

  it('removes obsolete prefixed keys regardless of user suffix', () => {
    localStorage.setItem('langtap-guest-distance-guest', '{"d":30}')
    localStorage.setItem('langtap-guest-distance-user-123', '{"d":10}')
    localStorage.setItem('langtap-pending-import-user-123', 'true')

    sweepObsoleteStorage()

    expect(localStorage.getItem('langtap-guest-distance-guest')).toBeNull()
    expect(localStorage.getItem('langtap-guest-distance-user-123')).toBeNull()
    expect(localStorage.getItem('langtap-pending-import-user-123')).toBeNull()
  })

  it('preserves current scoped store keys and other live keys', () => {
    localStorage.setItem('langtap-mastery-guest', '{"scores":{}}')
    localStorage.setItem('langtap-mastery-user-123', '{"scores":{}}')
    localStorage.setItem('langtap-word-mastery-user-123', '{"scores":{}}')
    localStorage.setItem('langtap-dialogues-seen', '["kana-first-play"]')
    localStorage.setItem('langtap-demo-completed', '1')
    localStorage.setItem('unrelated-app-key', 'leave-me')

    sweepObsoleteStorage()

    expect(localStorage.getItem('langtap-mastery-guest')).toBe('{"scores":{}}')
    expect(localStorage.getItem('langtap-mastery-user-123')).toBe('{"scores":{}}')
    expect(localStorage.getItem('langtap-word-mastery-user-123')).toBe('{"scores":{}}')
    expect(localStorage.getItem('langtap-dialogues-seen')).toBe('["kana-first-play"]')
    expect(localStorage.getItem('langtap-demo-completed')).toBe('1')
    expect(localStorage.getItem('unrelated-app-key')).toBe('leave-me')
  })

  it('records the schema version after sweeping', () => {
    sweepObsoleteStorage()
    expect(localStorage.getItem(VERSION_KEY)).toBe(String(STORAGE_SCHEMA_VERSION))
  })

  it('does not sweep again when the version is current', () => {
    sweepObsoleteStorage()
    // A key re-appearing after the sweep (e.g. written by an old tab)
    // stays until the next version bump - the sweep is once per version.
    localStorage.setItem('langtap-guest-session-id', 'late-write')
    sweepObsoleteStorage()
    expect(localStorage.getItem('langtap-guest-session-id')).toBe('late-write')
  })

  it('re-sweeps when the stored version is older than current', () => {
    localStorage.setItem(VERSION_KEY, '0')
    localStorage.setItem('langtap-guest-session-id', 'old')
    sweepObsoleteStorage()
    expect(localStorage.getItem('langtap-guest-session-id')).toBeNull()
    expect(localStorage.getItem(VERSION_KEY)).toBe(String(STORAGE_SCHEMA_VERSION))
  })
})
