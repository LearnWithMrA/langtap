// ─────────────────────────────────────────────
// File: samples/__tests__/leaderboard-fixtures.test.ts
// Purpose: Data integrity tests for leaderboard fixture data.
//          Validates all four boards have consistent entries,
//          correct ranking, and expected helper behaviour.
// Depends on: samples/leaderboard-fixtures.ts
// ─────────────────────────────────────────────

import {
  getLeaderboardFixture,
  getAvatarColor,
  formatLeaderboardScore,
} from '@/samples/leaderboard-fixtures'
import type { GameType, TimePeriod } from '@/samples/leaderboard-fixtures'

// ── getLeaderboardFixture ────────────────────

describe('getLeaderboardFixture', () => {
  const gameTypes: GameType[] = ['kana', 'kotoba']
  const timePeriods: TimePeriod[] = ['all-time', 'this-week']

  it.each(gameTypes)('returns 10 entries for %s all-time', (game) => {
    const board = getLeaderboardFixture(game, 'tap', 'all-time')
    expect(board.entries).toHaveLength(10)
  })

  it.each(gameTypes)('returns 10 entries for %s this-week', (game) => {
    const board = getLeaderboardFixture(game, 'tap', 'this-week')
    expect(board.entries).toHaveLength(10)
  })

  it.each(gameTypes)('returns a pinned user for %s all-time', (game) => {
    const board = getLeaderboardFixture(game, 'tap', 'all-time')
    expect(board.currentUserPinned).not.toBeNull()
    expect(board.currentUserPinned?.isCurrentUser).toBe(true)
  })

  it.each(gameTypes)('returns a pinned user for %s this-week', (game) => {
    const board = getLeaderboardFixture(game, 'tap', 'this-week')
    expect(board.currentUserPinned).not.toBeNull()
    expect(board.currentUserPinned?.isCurrentUser).toBe(true)
  })

  it('returns ranks in ascending order', () => {
    for (const game of gameTypes) {
      for (const period of timePeriods) {
        const board = getLeaderboardFixture(game, 'tap', period)
        for (let i = 1; i < board.entries.length; i++) {
          expect(board.entries[i].rank).toBeGreaterThan(board.entries[i - 1].rank)
        }
      }
    }
  })

  it('returns scores in descending order', () => {
    for (const game of gameTypes) {
      for (const period of timePeriods) {
        const board = getLeaderboardFixture(game, 'tap', period)
        for (let i = 1; i < board.entries.length; i++) {
          expect(board.entries[i].score).toBeLessThan(board.entries[i - 1].score)
        }
      }
    }
  })

  it('has unique usernames within each board', () => {
    for (const game of gameTypes) {
      for (const period of timePeriods) {
        const board = getLeaderboardFixture(game, 'tap', period)
        const names = board.entries.map((e) => e.username)
        expect(new Set(names).size).toBe(names.length)
      }
    }
  })

  it('returns the same data regardless of input mode', () => {
    for (const game of gameTypes) {
      for (const period of timePeriods) {
        const tap = getLeaderboardFixture(game, 'tap', period)
        const type = getLeaderboardFixture(game, 'type', period)
        const swipe = getLeaderboardFixture(game, 'swipe', period)
        expect(tap).toEqual(type)
        expect(tap).toEqual(swipe)
      }
    }
  })

  it('pinned user rank is outside the top 10', () => {
    for (const game of gameTypes) {
      for (const period of timePeriods) {
        const board = getLeaderboardFixture(game, 'tap', period)
        if (board.currentUserPinned) {
          expect(board.currentUserPinned.rank).toBeGreaterThan(10)
        }
      }
    }
  })
})

// ── getAvatarColor ───────────────────────────

describe('getAvatarColor', () => {
  it('returns a Tailwind bg class', () => {
    const color = getAvatarColor('testuser')
    expect(color).toMatch(/^bg-/)
  })

  it('returns the same colour for the same username', () => {
    expect(getAvatarColor('sakura_wind')).toBe(getAvatarColor('sakura_wind'))
  })

  it('returns different colours for different usernames', () => {
    const colors = new Set([
      getAvatarColor('a'),
      getAvatarColor('b'),
      getAvatarColor('c'),
      getAvatarColor('d'),
      getAvatarColor('e'),
      getAvatarColor('f'),
      getAvatarColor('g'),
      getAvatarColor('h'),
    ])
    expect(colors.size).toBeGreaterThan(1)
  })
})

// ── formatLeaderboardScore ───────────────────

describe('formatLeaderboardScore', () => {
  it('formats scores under 10,000 with locale string', () => {
    expect(formatLeaderboardScore(1247)).toBe('1,247')
  })

  it('formats scores of 10,000+ as Xk', () => {
    expect(formatLeaderboardScore(12450)).toBe('12.4k')
  })

  it('formats exactly 10,000 as 10.0k', () => {
    expect(formatLeaderboardScore(10000)).toBe('10.0k')
  })

  it('formats zero', () => {
    expect(formatLeaderboardScore(0)).toBe('0')
  })

  it('formats small numbers without comma', () => {
    expect(formatLeaderboardScore(42)).toBe('42')
  })
})
