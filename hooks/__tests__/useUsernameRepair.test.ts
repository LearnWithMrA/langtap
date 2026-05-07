// ─────────────────────────────────────────────
// File: hooks/__tests__/useUsernameRepair.test.ts
// Purpose: Tests for the username repair hook. Covers default
//          username detection, dismissal counting, session-level
//          suppression, and blocking threshold.
// Depends on: hooks/useUsernameRepair.ts, stores/user.store.ts
// ─────────────────────────────────────────────

// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserStore } from '@/stores/user.store'
import { useUsernameRepair } from '../useUsernameRepair'

// ── Helpers ──────────────────────────────────

const USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const DEFAULT_USERNAME = `user_${USER_ID.slice(0, 8)}`
const CUSTOM_USERNAME = 'myname'

function setAuth(username: string, migrationComplete = true): void {
  useUserStore.setState({
    user: { id: USER_ID, email: 'test@example.com', isAnonymous: false },
    profile: {
      id: USER_ID,
      username,
      jlptLevel: 'N5',
      inputMode: 'tap',
      onboardingComplete: true,
      notificationsEnabled: false,
      distanceUnit: 'metric',
      leaderboardVisibility: 'public',
      userTz: 'UTC',
      usernameChangedAt: null,
      guestImportedAt: null,
      guestImportSkippedAt: null,
      legacyImportedAt: null,
      legacyImportSkippedAt: null,
      createdAt: '2026-01-01',
    },
    isLoading: false,
    migrationPhaseComplete: migrationComplete,
  })
}

// ── Tests ────────────────────────────────────

describe('useUsernameRepair', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, profile: null, isLoading: true })
    localStorage.clear()
  })

  it('shouldShow is false when no user is authenticated', () => {
    useUserStore.setState({ user: null, profile: null, isLoading: false })
    const { result } = renderHook(() => useUsernameRepair())
    expect(result.current.shouldShow).toBe(false)
  })

  it('shouldShow is false when username is custom', () => {
    setAuth(CUSTOM_USERNAME)
    const { result } = renderHook(() => useUsernameRepair())
    expect(result.current.shouldShow).toBe(false)
  })

  it('shouldShow is true when username is default', () => {
    setAuth(DEFAULT_USERNAME)
    const { result } = renderHook(() => useUsernameRepair())
    expect(result.current.shouldShow).toBe(true)
    expect(result.current.isBlocking).toBe(false)
  })

  it('shouldShow is false when migration is not complete', () => {
    setAuth(DEFAULT_USERNAME, false)
    const { result } = renderHook(() => useUsernameRepair())
    expect(result.current.shouldShow).toBe(false)
  })

  it('dismiss hides modal for current mount', () => {
    setAuth(DEFAULT_USERNAME)
    const { result } = renderHook(() => useUsernameRepair())
    expect(result.current.shouldShow).toBe(true)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.shouldShow).toBe(false)
  })

  it('becomes blocking after 3 dismissals', () => {
    setAuth(DEFAULT_USERNAME)
    const key = `langtap-username-repair-dismissed:${USER_ID}`
    localStorage.setItem(key, '3')

    const { result } = renderHook(() => useUsernameRepair())
    expect(result.current.shouldShow).toBe(true)
    expect(result.current.isBlocking).toBe(true)
  })

  it('dismiss does nothing when blocking', () => {
    setAuth(DEFAULT_USERNAME)
    const key = `langtap-username-repair-dismissed:${USER_ID}`
    localStorage.setItem(key, '3')

    const { result } = renderHook(() => useUsernameRepair())
    act(() => {
      result.current.dismiss()
    })

    expect(result.current.shouldShow).toBe(true)
    expect(localStorage.getItem(key)).toBe('3')
  })
})
