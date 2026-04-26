// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/leaderboard/__tests__/leaderboard-podium.test.tsx
// Purpose: Tests for the Podium and RankBadge components.
//          Covers rendering, rank badges, sparkles for rank 1,
//          and correct avatar/score display.
// Depends on: components/leaderboard/leaderboard-podium.tsx
// ─────────────────────────────────────────────

import { render, screen } from '@testing-library/react'
import { Podium, RankBadge } from '@/components/leaderboard/leaderboard-podium'
import type { LeaderboardEntry } from '@/samples/leaderboard-fixtures'

// ── Test data ────────────────────────────────

const ENTRIES: readonly LeaderboardEntry[] = [
  { rank: 1, username: 'sakura_wind', score: 12450, isCurrentUser: false },
  { rank: 2, username: 'tokyodrift', score: 11200, isCurrentUser: false },
  { rank: 3, username: 'kana_queen', score: 9870, isCurrentUser: false },
]

// ── RankBadge ────────────────────────────────

describe('RankBadge', () => {
  it('renders rank 1 with aria-label', () => {
    const { container } = render(<RankBadge rank={1} />)
    const badge = container.querySelector('[aria-label="Rank 1"]')
    expect(badge).toBeTruthy()
  })

  it('renders rank 2 with aria-label', () => {
    const { container } = render(<RankBadge rank={2} />)
    const badge = container.querySelector('[aria-label="Rank 2"]')
    expect(badge).toBeTruthy()
  })

  it('renders rank 3 with aria-label', () => {
    const { container } = render(<RankBadge rank={3} />)
    const badge = container.querySelector('[aria-label="Rank 3"]')
    expect(badge).toBeTruthy()
  })

  it('renders rank 4+ as plain number', () => {
    render(<RankBadge rank={7} />)
    expect(screen.getByText('7')).toBeTruthy()
  })

  it('renders medal-gold background for rank 1', () => {
    const { container } = render(<RankBadge rank={1} />)
    const badge = container.querySelector('[aria-label="Rank 1"]')
    expect(badge?.className).toContain('bg-medal-gold')
  })

  it('renders medal-silver background for rank 2', () => {
    const { container } = render(<RankBadge rank={2} />)
    const badge = container.querySelector('[aria-label="Rank 2"]')
    expect(badge?.className).toContain('bg-medal-silver')
  })

  it('renders medal-bronze background for rank 3', () => {
    const { container } = render(<RankBadge rank={3} />)
    const badge = container.querySelector('[aria-label="Rank 3"]')
    expect(badge?.className).toContain('bg-medal-bronze')
  })
})

// ── Podium ───────────────────────────────────

describe('Podium', () => {
  it('renders all three usernames', () => {
    render(<Podium entries={ENTRIES} variant="kana" />)
    expect(screen.getByText('sakura_wind')).toBeTruthy()
    expect(screen.getByText('tokyodrift')).toBeTruthy()
    expect(screen.getByText('kana_queen')).toBeTruthy()
  })

  it('renders formatted scores', () => {
    render(<Podium entries={ENTRIES} variant="kana" />)
    expect(screen.getByText('12.4k')).toBeTruthy()
    expect(screen.getByText('11.2k')).toBeTruthy()
    expect(screen.getByText('9,870')).toBeTruthy()
  })

  it('renders avatar initials', () => {
    render(<Podium entries={ENTRIES} variant="kana" />)
    expect(screen.getAllByText('S')).toHaveLength(1)
    expect(screen.getAllByText('T')).toHaveLength(1)
    expect(screen.getAllByText('K')).toHaveLength(1)
  })

  it('renders sparkles for rank 1 only', () => {
    const { container } = render(<Podium entries={ENTRIES} variant="kana" />)
    const sparkles = container.querySelectorAll('[class*="sparkle"]')
    expect(sparkles.length).toBe(4)
  })

  it('renders rank number badges', () => {
    const { container } = render(<Podium entries={ENTRIES} variant="kana" />)
    expect(container.querySelector('[aria-label="Rank 1"]')).toBeTruthy()
    expect(container.querySelector('[aria-label="Rank 2"]')).toBeTruthy()
    expect(container.querySelector('[aria-label="Rank 3"]')).toBeTruthy()
  })

  it('returns null when no entries', () => {
    const { container } = render(<Podium entries={[]} variant="kana" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders with only rank 1', () => {
    render(<Podium entries={[ENTRIES[0]]} variant="kana" />)
    expect(screen.getByText('sakura_wind')).toBeTruthy()
  })

  it('applies sky-600 score colour for kana variant', () => {
    const { container } = render(<Podium entries={ENTRIES} variant="kana" />)
    const scores = container.querySelectorAll('[class*="text-sky-600"]')
    expect(scores.length).toBe(3)
  })

  it('applies sage-600 score colour for kotoba variant', () => {
    const { container } = render(<Podium entries={ENTRIES} variant="kotoba" />)
    const scores = container.querySelectorAll('[class*="text-sage-600"]')
    expect(scores.length).toBe(3)
  })

  it('applies float animation to rank 1 avatar', () => {
    const { container } = render(<Podium entries={ENTRIES} variant="kana" />)
    const animated = container.querySelector('[class*="trophy-float"]')
    expect(animated).toBeTruthy()
  })
})
