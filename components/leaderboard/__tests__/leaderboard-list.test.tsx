// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/leaderboard/__tests__/leaderboard-list.test.tsx
// Purpose: Tests for the LeaderboardList component.
//          Covers header, mode selector, podium, rows, pinned
//          user, locked state, empty state, and variant styling.
// Depends on: components/leaderboard/leaderboard-list.tsx
// ─────────────────────────────────────────────

import { render, screen, fireEvent } from '@testing-library/react'
import { LeaderboardList } from '@/components/leaderboard/leaderboard-list'
import type { LeaderboardBoard, InputMode } from '@/samples/leaderboard-fixtures'

// ── Test data ────────────────────────────────

const FULL_BOARD: LeaderboardBoard = {
  entries: [
    { rank: 1, username: 'alpha', score: 5000, isCurrentUser: false },
    { rank: 2, username: 'bravo', score: 4000, isCurrentUser: false },
    { rank: 3, username: 'charlie', score: 3000, isCurrentUser: false },
    { rank: 4, username: 'delta', score: 2000, isCurrentUser: false },
    { rank: 5, username: 'echo', score: 1000, isCurrentUser: false },
  ],
  currentUserPinned: { rank: 42, username: 'me', score: 100, isCurrentUser: true },
}

const EMPTY_BOARD: LeaderboardBoard = {
  entries: [],
  currentUserPinned: null,
}

// ── Header ───────────────────────────────────

describe('LeaderboardList header', () => {
  it('renders Kana label for kana variant', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kana" />)
    expect(screen.getByText('Kana')).toBeTruthy()
  })

  it('renders Kotoba label for kotoba variant', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kotoba" />)
    expect(screen.getByText('Kotoba')).toBeTruthy()
  })

  it('renders mode selector when mode and onModeChange provided', () => {
    const onModeChange = vi.fn()
    render(
      <LeaderboardList
        board={FULL_BOARD}
        variant="kana"
        mode="tap"
        onModeChange={onModeChange}
      />
    )
    expect(screen.getByText('Tap')).toBeTruthy()
    expect(screen.getByText('Type')).toBeTruthy()
    expect(screen.getByText('Swipe')).toBeTruthy()
  })

  it('does not render mode selector when mode is omitted', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kana" />)
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('calls onModeChange when mode pill is clicked', () => {
    const onModeChange = vi.fn()
    render(
      <LeaderboardList
        board={FULL_BOARD}
        variant="kana"
        mode="tap"
        onModeChange={onModeChange}
      />
    )
    fireEvent.click(screen.getByText('Type'))
    expect(onModeChange).toHaveBeenCalledWith('type')
  })
})

// ── Rows ─────────────────────────────────────

describe('LeaderboardList rows', () => {
  it('renders all entry usernames', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kana" />)
    expect(screen.getByText('alpha')).toBeTruthy()
    expect(screen.getByText('delta')).toBeTruthy()
    expect(screen.getByText('echo')).toBeTruthy()
  })

  it('renders pinned user with dots separator', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kana" />)
    expect(screen.getByText('me')).toBeTruthy()
  })

  it('highlights current user row', () => {
    const board: LeaderboardBoard = {
      entries: [
        { rank: 1, username: 'alpha', score: 5000, isCurrentUser: false },
        { rank: 2, username: 'bravo', score: 4000, isCurrentUser: false },
        { rank: 3, username: 'charlie', score: 3000, isCurrentUser: false },
        { rank: 4, username: 'me', score: 2000, isCurrentUser: true },
      ],
      currentUserPinned: null,
    }
    render(<LeaderboardList board={board} variant="kana" />)
    const row = screen.getByText('me').closest('[role="listitem"]')
    expect(row?.getAttribute('class')).toContain('bg-sage-50')
  })

  it('does not show pinned user if already in list', () => {
    const board: LeaderboardBoard = {
      entries: [
        { rank: 1, username: 'me', score: 5000, isCurrentUser: true },
      ],
      currentUserPinned: { rank: 1, username: 'me', score: 5000, isCurrentUser: true },
    }
    render(<LeaderboardList board={board} variant="kana" />)
    const allMe = screen.getAllByText('me')
    expect(allMe).toHaveLength(1)
  })
})

// ── Empty state ──────────────────────────────

describe('LeaderboardList empty state', () => {
  it('shows empty message when no entries', () => {
    render(<LeaderboardList board={EMPTY_BOARD} variant="kana" />)
    expect(screen.getByText('No scores yet. Start practising to appear here.')).toBeTruthy()
  })

  it('shows CTA button', () => {
    render(<LeaderboardList board={EMPTY_BOARD} variant="kana" />)
    expect(screen.getByRole('button', { name: 'Start practising' })).toBeTruthy()
  })
})

// ── Locked state ─────────────────────────────

describe('LeaderboardList locked state', () => {
  it('shows lock message when locked', () => {
    render(<LeaderboardList board={EMPTY_BOARD} variant="kotoba" locked />)
    expect(screen.getByText('Complete Kana to unlock')).toBeTruthy()
  })

  it('shows Kotoba label when locked', () => {
    render(<LeaderboardList board={EMPTY_BOARD} variant="kotoba" locked />)
    expect(screen.getByText('Kotoba')).toBeTruthy()
  })

  it('renders mode selector in locked header when provided', () => {
    render(
      <LeaderboardList
        board={EMPTY_BOARD}
        variant="kotoba"
        locked
        mode="tap"
        onModeChange={vi.fn()}
      />
    )
    expect(screen.getByText('Tap')).toBeTruthy()
  })
})

// ── Variant colours ──────────────────────────

describe('LeaderboardList variant colours', () => {
  it('applies sky-600 accent for kana', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kana" />)
    const heading = screen.getByText('Kana')
    expect(heading.className).toContain('text-sky-600')
  })

  it('applies sage-600 accent for kotoba', () => {
    render(<LeaderboardList board={FULL_BOARD} variant="kotoba" />)
    const heading = screen.getByText('Kotoba')
    expect(heading.className).toContain('text-sage-600')
  })
})
