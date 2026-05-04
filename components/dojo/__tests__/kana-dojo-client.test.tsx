// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/dojo/__tests__/kana-dojo-client.test.tsx
// Purpose: End-to-end tests for KanaDojoClient orchestration under the
//          script-first hierarchy.
//          Covers: initial render with store-backed mastery state,
//          empty-state help card, tapping a locked tile opens the unlock
//          prompt, confirming unlock updates state, tapping an unlocked
//          tile opens the detail popover, tapping a stage or script
//          unlock button opens the scoped confirmation, reset flow clears
//          score and keeps the tile unlocked.
// Depends on: components/layout/kana-dojo-client.tsx,
//             stores/mastery.store.ts, stores/onboarding.store.ts
// ─────────────────────────────────────────────

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanaDojoClient } from '@/components/layout/kana-dojo-client'
import { useMasteryStore } from '@/stores/mastery.store'
import { useOnboardingStore } from '@/stores/onboarding.store'

// ── Helpers ─────────────────────────────────

// Variety fixture data: seeds Hiragana Seion Group 1 with one character in each
// heat band so every visual state renders. Group 2 freshly unlocked with low
// scores. Groups 3+ stay locked. Katakana entirely locked.
const VARIETY_SCORES: Record<string, number> = {
  'h-a': 0,
  'h-i': 3,
  'h-u': 7,
  'h-e': 15,
  'h-o': 28,
  'h-ka': 44,
  'h-ki': 2,
  'h-ku': 0,
  'h-sa': 1,
  'h-shi': 0,
  'h-su': 2,
}

const VARIETY_UNLOCKED: string[] = [
  'h-a',
  'h-i',
  'h-u',
  'h-e',
  'h-o',
  'h-ka',
  'h-ki',
  'h-ku',
  'h-sokuon',
  'h-sa',
  'h-shi',
  'h-su',
  'h-se',
  'h-so',
  'h-ta',
  'h-chi',
  'h-tsu',
  'h-te',
  'h-to',
]

/** Set up stores with variety fixture data and mark as hydrated. */
function seedVarietyState(): void {
  useMasteryStore.setState({ scores: { ...VARIETY_SCORES }, hasHydrated: true })
  useOnboardingStore.setState({ selectedCharacterIds: [...VARIETY_UNLOCKED] })
}

/** Set up stores with empty state (nothing unlocked, nothing practised). */
function seedEmptyState(): void {
  useMasteryStore.setState({ scores: {}, hasHydrated: true })
  useOnboardingStore.setState({ selectedCharacterIds: [] })
}

// ── Setup ───────────────────────────────────

beforeEach(() => {
  window.localStorage.clear()
  // Reset stores to defaults
  useMasteryStore.setState({ scores: {}, hasHydrated: true })
  useOnboardingStore.setState({ selectedCharacterIds: [] })
})

// ── Tests ───────────────────────────────────

describe('KanaDojoClient', () => {
  it('renders the page heading and both script groups', () => {
    seedVarietyState()
    render(<KanaDojoClient />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kana Dojo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hiragana' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Katakana' })).toBeInTheDocument()
  })

  it('opens Hiragana by default and shows stage headings inside it', () => {
    seedVarietyState()
    render(<KanaDojoClient />)
    expect(screen.getByRole('heading', { name: 'Seion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dakuon' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Combination' })).toBeInTheDocument()
  })

  it('shows the welcome card on first visit regardless of unlock state', () => {
    seedVarietyState()
    render(<KanaDojoClient />)
    expect(screen.getByRole('complementary', { name: 'Dojo tip' })).toBeInTheDocument()
  })

  it('shows the welcome card when all characters are locked', () => {
    seedEmptyState()
    render(<KanaDojoClient />)
    expect(screen.getByRole('complementary', { name: 'Dojo tip' })).toBeInTheDocument()
  })

  it('hides all tips after dismissing both', async () => {
    const user = userEvent.setup()
    seedEmptyState()
    render(<KanaDojoClient />)
    await user.click(screen.getByRole('button', { name: 'Dismiss tip' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss tip' }))
    expect(screen.queryByRole('complementary', { name: 'Dojo tip' })).not.toBeInTheDocument()
  })

  it('opens the unlock prompt when a locked tile is tapped', async () => {
    const user = userEvent.setup()
    seedVarietyState()
    render(<KanaDojoClient />)
    // Under the variety state, け (h-ke) in Seion Group 1 is locked.
    // Mobile renders first in RTL (jsdom), so we just take the first match.
    const lockedTiles = screen.getAllByRole('button', {
      name: /Character け, romaji ke, locked/,
    })
    await user.click(lockedTiles[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Unlock け?')).toBeInTheDocument()
  })

  it('unlocks a character after confirming the unlock prompt', async () => {
    const user = userEvent.setup()
    seedVarietyState()
    render(<KanaDojoClient />)
    const lockedTiles = screen.getAllByRole('button', {
      name: /Character け, romaji ke, locked/,
    })
    await user.click(lockedTiles[0])
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Unlock' }))
    // Tile now advertises mastery instead of locked. There is at least one
    // matching tile across mobile + desktop renders.
    expect(
      screen.queryAllByRole('button', { name: /Character け, romaji ke, locked/ }).length,
    ).toBe(0)
    expect(
      screen.getAllByRole('button', { name: /Character け, romaji ke, mastery/ }).length,
    ).toBeGreaterThan(0)
  })

  it('opens the reset-progress confirmation directly when an unlocked tile is tapped', async () => {
    const user = userEvent.setup()
    seedVarietyState()
    render(<KanaDojoClient />)
    const masteredTiles = screen.getAllByRole('button', {
      name: /Character か, romaji ka, mastered/,
    })
    await user.click(masteredTiles[0])
    const dialog = await screen.findByRole('dialog')
    // Choice step: title is the character, with Cancel / Mark as mastered / Reset progress buttons.
    expect(within(dialog).getByText(/か \(ka\)/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Mark as mastered' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Reset progress' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('runs the two-step reset flow to clear progress on a character', async () => {
    const user = userEvent.setup()
    seedVarietyState()
    render(<KanaDojoClient />)
    const masteredTiles = screen.getAllByRole('button', {
      name: /Character か, romaji ka, mastered/,
    })
    await user.click(masteredTiles[0])
    const dialog = await screen.findByRole('dialog')
    // Choice step -> Reset progress
    await user.click(within(dialog).getByRole('button', { name: 'Reset progress' }))
    // Confirmation: "Are you sure? This can't be undone." -> Yes
    expect(within(dialog).getByText(/Are you sure\?/)).toBeInTheDocument()
    expect(within(dialog).getByText(/can't be undone/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }))
    // After reset, the tile should no longer be mastered but still unlocked.
    expect(
      screen.queryAllByRole('button', { name: /Character か, romaji ka, mastered/ }).length,
    ).toBe(0)
    expect(
      screen.queryAllByRole('button', { name: /Character か, romaji ka, locked/ }).length,
    ).toBe(0)
  })

  it('exposes an "Unlock All" master button when any characters are locked', () => {
    seedVarietyState()
    render(<KanaDojoClient />)
    expect(
      screen.getByLabelText(/Unlock all \d+ locked characters across the Dojo/),
    ).toBeInTheDocument()
  })

  it('opens a Kana Dojo-scoped bulk unlock confirmation when the master button is tapped', async () => {
    const user = userEvent.setup()
    seedVarietyState()
    render(<KanaDojoClient />)
    await user.click(screen.getByLabelText(/Unlock all \d+ locked characters across the Dojo/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/Kana Dojo/).length).toBeGreaterThan(0)
  })

  it('opens the bulk unlock confirmation when a stage Unlock button is tapped', async () => {
    const user = userEvent.setup()
    seedVarietyState()
    render(<KanaDojoClient />)
    // The Seion stage bar has locked chars under the variety state. The button
    // label is scoped to just the stage name ("Seion") since the script is the
    // visible parent collapsible.
    const unlockButtons = screen.getAllByLabelText(/^Unlock \d+ characters? in Seion$/)
    await user.click(unlockButtons[0])
    const dialog = await screen.findByRole('dialog')
    // The scoped confirmation modal composes the full scope label: "Hiragana Seion".
    // The phrase appears in both the title and the body, so we assert >= 1 match.
    expect(within(dialog).getAllByText(/Hiragana Seion/).length).toBeGreaterThan(0)
  })
})

describe('KanaDojoClient - parity state prop', () => {
  it('default render is unchanged when no state prop is passed', () => {
    seedVarietyState()
    render(<KanaDojoClient />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kana Dojo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hiragana' })).toBeInTheDocument()
  })

  it('renders the loading shell when state="loading" is passed', () => {
    const { container } = render(<KanaDojoClient state="loading" />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: 'Hiragana' })).not.toBeInTheDocument()
  })

  it('renders the error shell when state="error" is passed', () => {
    render(<KanaDojoClient state="error" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load your progress/i)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders the empty shell when state="empty" is passed', () => {
    render(<KanaDojoClient state="empty" />)
    expect(screen.getByRole('heading', { name: 'Start your journey' })).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: 'Start practice' })
    expect(cta).toHaveAttribute('href', '/practice?mode=kana')
  })
})
