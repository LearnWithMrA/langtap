// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/dojo/__tests__/character-group.test.tsx
// Purpose: Tests for CharacterGroup (script-level wrapper) and its
//          inline StageBlock sub-sections.
//          Covers: script heading render, Current badge on active script,
//          stage-level bar appears only when script is open, unlock
//          button surfaced only when locked characters remain, toggle
//          wiring for script and stage.
// Depends on: components/dojo/character-group.tsx
// ─────────────────────────────────────────────

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CharacterGroup } from '@/components/dojo/character-group'
import { KANA_CHARACTERS } from '@/data/kana/characters'
import type { KanaCharacter, Stage } from '@/types/kana.types'

const STAGE_ORDER: readonly Stage[] = ['seion', 'dakuon', 'yoon']
const STAGE_LABELS = { seion: 'Seion', dakuon: 'Dakuon', yoon: 'Yoon' } as const

function charactersByStage(
  script: 'hiragana' | 'katakana',
): Record<Stage, readonly KanaCharacter[]> {
  return {
    seion: KANA_CHARACTERS.filter((c) => c.script === script && c.stage === 'seion'),
    dakuon: KANA_CHARACTERS.filter((c) => c.script === script && c.stage === 'dakuon'),
    yoon: KANA_CHARACTERS.filter((c) => c.script === script && c.stage === 'yoon'),
  }
}

// All hiragana locked. All katakana locked.
const ALL_LOCKED = new Set(KANA_CHARACTERS.map((c) => c.id))
const NOTHING_LOCKED: ReadonlySet<string> = new Set()

function renderGroup(
  overrides: Partial<React.ComponentProps<typeof CharacterGroup>> = {},
): ReturnType<typeof render> {
  const props: React.ComponentProps<typeof CharacterGroup> = {
    script: 'hiragana',
    scriptLabel: 'Hiragana',
    stageOrder: STAGE_ORDER,
    stageLabels: STAGE_LABELS,
    charactersByStage: charactersByStage('hiragana'),
    scores: {},
    lockedIds: ALL_LOCKED,
    scriptActivity: 'active',
    scriptOpen: true,
    stageOpen: new Set<Stage>(['seion']),
    stageActivity: { seion: 'active', dakuon: 'future', yoon: 'future' },
    onToggleScript: () => {},
    onToggleStage: () => {},
    onUnlockScript: () => {},
    onUnlockStage: () => {},
    onResetScript: () => {},
    onResetStage: () => {},
    onTileClick: () => {},
    ...overrides,
  }
  return render(<CharacterGroup {...props} />)
}

describe('CharacterGroup (script wrapper)', () => {
  it('renders the script heading', () => {
    renderGroup()
    expect(screen.getByRole('heading', { name: 'Hiragana' })).toBeInTheDocument()
  })

  it('does not render any "Current" badge (removed from the bar)', () => {
    renderGroup({ scriptActivity: 'active' })
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
  })

  it('hides the stage blocks when the script is collapsed', () => {
    renderGroup({ scriptOpen: false })
    expect(screen.queryByRole('heading', { name: 'Seion' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dakuon' })).not.toBeInTheDocument()
  })

  it('renders all three stage blocks when open', () => {
    renderGroup()
    expect(screen.getByRole('heading', { name: 'Seion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dakuon' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yoon' })).toBeInTheDocument()
  })

  it('calls onToggleScript when the script heading is tapped', async () => {
    const onToggleScript = vi.fn()
    const user = userEvent.setup()
    renderGroup({ onToggleScript })
    await user.click(screen.getByRole('button', { name: 'Hiragana' }))
    expect(onToggleScript).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleStage with the right stage when a stage heading is tapped', async () => {
    const onToggleStage = vi.fn()
    const user = userEvent.setup()
    renderGroup({ onToggleStage })
    await user.click(screen.getByRole('button', { name: 'Dakuon' }))
    expect(onToggleStage).toHaveBeenCalledWith('dakuon')
  })

  it('surfaces the Unlock button on the script bar when locked chars remain', () => {
    renderGroup()
    expect(screen.getByLabelText(/Unlock \d+ characters in Hiragana/)).toBeInTheDocument()
  })

  it('hides the Unlock button when the group is completed', () => {
    renderGroup({
      scriptActivity: 'completed',
      lockedIds: NOTHING_LOCKED,
      stageActivity: { seion: 'completed', dakuon: 'completed', yoon: 'completed' },
    })
    expect(screen.queryByLabelText(/Unlock \d+ characters in Hiragana/)).not.toBeInTheDocument()
  })

  it('calls onUnlockScript when the script-level Unlock button is tapped', async () => {
    const onUnlockScript = vi.fn()
    const user = userEvent.setup()
    renderGroup({ onUnlockScript })
    await user.click(screen.getByLabelText(/Unlock \d+ characters in Hiragana/))
    expect(onUnlockScript).toHaveBeenCalledTimes(1)
  })
})
