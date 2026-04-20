// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/dojo/__tests__/kana-dojo-client.test.tsx
// Purpose: End-to-end tests for KanaDojoClient orchestration under the
//          script-first hierarchy.
//          Covers: initial render with variety fixture, empty-state help
//          card, tapping a locked tile opens the unlock prompt, confirming
//          unlock updates state, tapping an unlocked tile opens the
//          detail popover, tapping a stage or script unlock button opens
//          the scoped confirmation, reset flow clears score and keeps
//          the tile unlocked.
// Depends on: components/layout/kana-dojo-client.tsx
// ─────────────────────────────────────────────

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanaDojoClient } from '@/components/layout/kana-dojo-client'

beforeEach(() => {
  window.localStorage.clear()
})

describe('KanaDojoClient', () => {
  it('renders the page heading and both script groups', () => {
    render(<KanaDojoClient fixture="variety" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kana Dojo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hiragana' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Katakana' })).toBeInTheDocument()
  })

  it('opens Hiragana by default and shows stage headings inside it', () => {
    render(<KanaDojoClient fixture="variety" />)
    expect(screen.getByRole('heading', { name: 'Seion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dakuon' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yoon' })).toBeInTheDocument()
  })

  it('does not show the help card under the variety fixture', () => {
    render(<KanaDojoClient fixture="variety" />)
    expect(screen.queryByRole('complementary', { name: 'Getting started' })).not.toBeInTheDocument()
  })

  it('shows the help card under the empty fixture', () => {
    render(<KanaDojoClient fixture="empty" />)
    expect(screen.getByRole('complementary', { name: 'Getting started' })).toBeInTheDocument()
  })

  it('hides the help card after it is dismissed', async () => {
    const user = userEvent.setup()
    render(<KanaDojoClient fixture="empty" />)
    await user.click(screen.getByRole('button', { name: 'Dismiss getting-started card' }))
    expect(screen.queryByRole('complementary', { name: 'Getting started' })).not.toBeInTheDocument()
  })

  it('opens the unlock prompt when a locked tile is tapped', async () => {
    const user = userEvent.setup()
    render(<KanaDojoClient fixture="variety" />)
    // Under the variety fixture, け (h-ke) in Seion Group 1 is locked.
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
    render(<KanaDojoClient fixture="variety" />)
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
    render(<KanaDojoClient fixture="variety" />)
    const masteredTiles = screen.getAllByRole('button', {
      name: /Character か, romaji ka, mastered/,
    })
    await user.click(masteredTiles[0])
    const dialog = await screen.findByRole('dialog')
    // First step of the reset flow: "Reset progress on か?" with Yes/No buttons.
    expect(within(dialog).getByText(/Reset progress on か\?/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'No' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Reset progress' })).not.toBeInTheDocument()
  })

  it('runs the two-step reset flow to clear progress on a character', async () => {
    const user = userEvent.setup()
    render(<KanaDojoClient fixture="variety" />)
    const masteredTiles = screen.getAllByRole('button', {
      name: /Character か, romaji ka, mastered/,
    })
    await user.click(masteredTiles[0])
    const dialog = await screen.findByRole('dialog')
    // Step 1 → Yes
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }))
    // Step 2: "Are you sure? This can't be undone." → Yes
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
    render(<KanaDojoClient fixture="variety" />)
    expect(
      screen.getByLabelText(/Unlock all \d+ locked characters across the Dojo/),
    ).toBeInTheDocument()
  })

  it('opens a Kana Dojo-scoped bulk unlock confirmation when the master button is tapped', async () => {
    const user = userEvent.setup()
    render(<KanaDojoClient fixture="variety" />)
    await user.click(screen.getByLabelText(/Unlock all \d+ locked characters across the Dojo/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/Kana Dojo/).length).toBeGreaterThan(0)
  })

  it('opens the bulk unlock confirmation when a stage Unlock button is tapped', async () => {
    const user = userEvent.setup()
    render(<KanaDojoClient fixture="variety" />)
    // The Seion stage bar has locked chars under the variety fixture. The button
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
