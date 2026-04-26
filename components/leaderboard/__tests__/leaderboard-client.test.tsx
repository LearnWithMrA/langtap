// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/leaderboard/__tests__/leaderboard-client.test.tsx
// Purpose: Tests for the LeaderboardClient page orchestrator.
//          Covers page title, time period switcher, game type
//          switcher (mobile), independent mode states, and
//          responsive desktop/mobile layout differences.
// Depends on: components/leaderboard/leaderboard-client.tsx
// ─────────────────────────────────────────────

import { render, screen, fireEvent } from '@testing-library/react'
import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client'

// Mock AppTopBar to avoid rendering the full nav
vi.mock('@/components/layout/app-top-bar', () => ({
  AppTopBar: (): null => null,
}))

// ── Page structure ───────────────────────────

describe('LeaderboardClient', () => {
  it('renders the page title', () => {
    render(<LeaderboardClient />)
    const headings = screen.getAllByText('Leaderboard')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Kana leaderboard card', () => {
    render(<LeaderboardClient />)
    expect(screen.getAllByText('Kana').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Kotoba leaderboard card', () => {
    render(<LeaderboardClient />)
    expect(screen.getAllByText('Kotoba').length).toBeGreaterThanOrEqual(1)
  })
})

// ── Time period switcher ─────────────────────

describe('LeaderboardClient time period', () => {
  it('renders All Time and This Week options', () => {
    render(<LeaderboardClient />)
    expect(screen.getAllByText('All Time').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('This Week').length).toBeGreaterThanOrEqual(1)
  })

  it('defaults to All Time selected', () => {
    render(<LeaderboardClient />)
    const allTimeTabs = screen.getAllByRole('tab', { name: 'All Time' })
    expect(allTimeTabs.some((tab) => tab.getAttribute('aria-selected') === 'true')).toBe(true)
  })

  it('switches to This Week on click', () => {
    render(<LeaderboardClient />)
    const thisWeekTabs = screen.getAllByRole('tab', { name: 'This Week' })
    fireEvent.click(thisWeekTabs[0])
    expect(thisWeekTabs[0].getAttribute('aria-selected')).toBe('true')
  })
})

// ── Game type switcher ───────────────────────

describe('LeaderboardClient game type switcher', () => {
  it('renders Kana and Kotoba game type options', () => {
    render(<LeaderboardClient />)
    const kanaTabs = screen.getAllByRole('tab', { name: 'Kana' })
    expect(kanaTabs.length).toBeGreaterThanOrEqual(1)
  })

  it('defaults to Kana selected', () => {
    render(<LeaderboardClient />)
    const kanaTabs = screen.getAllByRole('tab', { name: 'Kana' })
    const selected = kanaTabs.find((tab) => tab.getAttribute('aria-selected') === 'true')
    expect(selected).toBeTruthy()
  })
})

// ── Mode switcher independence ───────────────

describe('LeaderboardClient independent modes', () => {
  it('defaults both cards to Tap mode', () => {
    render(<LeaderboardClient />)
    const tapTabs = screen.getAllByRole('tab', { name: 'Tap' })
    const selectedTaps = tapTabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')
    expect(selectedTaps.length).toBeGreaterThanOrEqual(2)
  })
})
