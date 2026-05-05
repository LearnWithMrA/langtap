// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/dojo/__tests__/kotoba-dojo-client.test.tsx
// Purpose: End-to-end tests for KotobaDojoClient orchestration.
//          Covers: initial render of the tab row and level groups, tab
//          keyboard navigation, multi-open level-group accordion,
//          word tile content for kanji-bearing and kana-only entries,
//          word popover flow (hero title, Mark as mastered, reset),
//          locked word tile rendering + tap-to-unlock, page / group
//          unlock buttons, deterministic loading / error / empty
//          state-prop screens.
//          Tests pre-seed the word mastery store to produce a mix of
//          locked and unlocked tiles for interaction testing.
// Depends on: components/layout/kotoba-dojo-client.tsx,
//             stores/word-mastery.store.ts,
//             data/words/kotoba-dojo-data.ts
// ─────────────────────────────────────────────

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KotobaDojoClient } from '@/components/layout/kotoba-dojo-client'
import { useWordMasteryStore } from '@/stores/word-mastery.store'
import { getN5DojoData } from '@/data/words/kotoba-dojo-data'

// ── Setup ────────────────────────────────────

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

import { KOTOBA_STEP_SIZE } from '@/engine/kotoba-progression'
import { KOTOBA_UNLOCK_THRESHOLD } from '@/engine/constants'

const n5Data = getN5DojoData()
const firstGroupWordIds = n5Data.groups[0].wordIds

const step0Ids = firstGroupWordIds.slice(0, KOTOBA_STEP_SIZE)
const step1Ids = firstGroupWordIds.slice(KOTOBA_STEP_SIZE, KOTOBA_STEP_SIZE * 2)
const step2Ids = firstGroupWordIds.slice(KOTOBA_STEP_SIZE * 2, KOTOBA_STEP_SIZE * 3)

const unlockedStepIds = [...step0Ids, ...step1Ids]

const UNLOCKED_KANJI_ID = unlockedStepIds.find((id) => n5Data.words[id]?.kanji !== null)!
const UNLOCKED_KANJI_WORD = n5Data.words[UNLOCKED_KANJI_ID]

const UNLOCKED_KANA_ID = unlockedStepIds.find((id) => n5Data.words[id]?.kanji === null)!
const UNLOCKED_KANA_WORD = n5Data.words[UNLOCKED_KANA_ID]

const LOCKED_KANJI_ID = step2Ids.find((id) => n5Data.words[id]?.kanji !== null)!
const LOCKED_KANJI_WORD = n5Data.words[LOCKED_KANJI_ID]

function seedStore(): void {
  const scores: Record<string, number> = {}

  for (const id of step0Ids) {
    scores[id] = KOTOBA_UNLOCK_THRESHOLD + 1
  }

  useWordMasteryStore.setState({ scores, manuallyUnlockedWords: [], hasHydrated: true })
}

function resetStore(): void {
  useWordMasteryStore.setState({ scores: {}, manuallyUnlockedWords: [], hasHydrated: false })
}

beforeEach(() => {
  seedStore()
})

afterEach(() => {
  resetStore()
})

// ── Tests ────────────────────────────────────

describe('KotobaDojoClient - ready shell', () => {
  it('renders the page heading and the JLPT tab row', () => {
    render(<KotobaDojoClient />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kotoba Dojo' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'JLPT level' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'N5' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'N4' })).toHaveAttribute('aria-selected', 'false')
  })

  it('moves selection and focus with ArrowRight on the tab row', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const n5 = screen.getByRole('tab', { name: 'N5' })
    n5.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'N4' })).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the last tab with End and the first with Home', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    screen.getByRole('tab', { name: 'N5' }).focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'N1' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'N5' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders Levels 1-2 and Levels 3-4 group rows for N5', () => {
    render(<KotobaDojoClient />)
    expect(screen.getByRole('button', { name: /^Levels 1-2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Levels 3-4/ })).toBeInTheDocument()
  })

  it('opens Levels 1-2 by default and shows word tiles', () => {
    render(<KotobaDojoClient />)
    expect(screen.getByRole('region', { name: 'Levels 1-2' })).toBeInTheDocument()
  })

  it('multi-open accordion: opening Levels 3-4 leaves Levels 1-2 open', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const levels34 = screen.getByRole('button', { name: /^Levels 3-4/ })
    await user.click(levels34)
    expect(screen.getByRole('region', { name: 'Levels 1-2' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Levels 3-4' })).toBeInTheDocument()
  })

  it('renders twenty-four word tiles for N5 Levels 1-2', () => {
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tiles = within(region).getAllByRole('button')
    expect(tiles.length).toBe(24)
  })

  it('renders kanji, kana, and english for words that have a kanji form', () => {
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = UNLOCKED_KANJI_WORD.kanji!
    const kana = UNLOCKED_KANJI_WORD.kana
    const tile = within(region).getByRole('button', {
      name: new RegExp(`Word ${kanji}.*reading ${kana}`),
    })
    expect(tile).toBeInTheDocument()
    expect(within(tile).getByText(kanji)).toBeInTheDocument()
    expect(within(tile).getByText(kana)).toBeInTheDocument()
  })

  it('kana-only words show the kana reading as the main glyph', () => {
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kana = UNLOCKED_KANA_WORD.kana
    const tile = within(region).getByRole('button', {
      name: new RegExp(`^Word ${kana}`),
    })
    expect(tile).toBeInTheDocument()
    expect(within(tile).getByText(kana)).toBeInTheDocument()
  })
})

describe('KotobaDojoClient - word popover', () => {
  it('opens the detail popover for an unlocked kanji word', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = UNLOCKED_KANJI_WORD.kanji!
    const kana = UNLOCKED_KANJI_WORD.kana
    const tile = within(region).getByRole('button', {
      name: new RegExp(`Word ${kanji}.*reading ${kana}`),
    })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: kanji })).toBeInTheDocument()
    expect(within(dialog).getByText(kana)).toBeInTheDocument()
  })

  it('uses the kana as the hero title when the word has no kanji', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kana = UNLOCKED_KANA_WORD.kana
    const tile = within(region).getByRole('button', {
      name: new RegExp(`^Word ${kana}`),
    })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: kana })).toBeInTheDocument()
  })

  it('exposes Close, Mark as mastered, and Reset progress actions', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = UNLOCKED_KANJI_WORD.kanji!
    const kana = UNLOCKED_KANJI_WORD.kana
    await user.click(
      within(region).getByRole('button', {
        name: new RegExp(`Word ${kanji}.*reading ${kana}`),
      }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Mark as mastered' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Reset progress' })).toBeInTheDocument()
  })

  it('Mark as mastered flips the tile into the mastered band', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = UNLOCKED_KANJI_WORD.kanji!
    const kana = UNLOCKED_KANJI_WORD.kana
    await user.click(
      within(region).getByRole('button', {
        name: new RegExp(`Word ${kanji}.*reading ${kana}`),
      }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Mark as mastered' }))
    expect(
      within(region).getByRole('button', {
        name: new RegExp(`Word ${kanji}.*reading ${kana}.*mastered`),
      }),
    ).toBeInTheDocument()
  })

  it('runs the two-step reset flow and clears the word score', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = UNLOCKED_KANJI_WORD.kanji!
    const kana = UNLOCKED_KANJI_WORD.kana
    await user.click(
      within(region).getByRole('button', {
        name: new RegExp(`Word ${kanji}.*reading ${kana}`),
      }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset progress' }))
    expect(within(dialog).getByText(new RegExp(`Reset progress on ${kana}`))).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }))
    expect(within(dialog).getByText(/Are you sure\?/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }))
    expect(
      within(region).getByRole('button', {
        name: new RegExp(`Word ${kanji}.*reading ${kana}.*mastery 0`),
      }),
    ).toBeInTheDocument()
  })
})

describe('KotobaDojoClient - locked words', () => {
  it('renders the locked word with a tap-to-unlock label', () => {
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = LOCKED_KANJI_WORD.kanji!
    const tile = within(region).getByRole('button', {
      name: new RegExp(`Word ${kanji}.*locked.*Tap to unlock`),
    })
    expect(tile).toBeInTheDocument()
  })

  it('tapping a locked tile opens the single-step unlock prompt', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = LOCKED_KANJI_WORD.kanji!
    const tile = within(region).getByRole('button', { name: new RegExp(`Word ${kanji}.*locked`) })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    const kana = LOCKED_KANJI_WORD.kana
    expect(
      within(dialog).getByText(new RegExp(`Unlock ${kanji} \\(${kana}\\)`)),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Unlock' })).toBeInTheDocument()
  })

  it('confirming the unlock prompt flips the tile out of its locked state', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const kanji = LOCKED_KANJI_WORD.kanji!
    const tile = within(region).getByRole('button', { name: new RegExp(`Word ${kanji}.*locked`) })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Unlock' }))
    expect(
      within(region).queryByRole('button', { name: new RegExp(`Word ${kanji}.*locked`) }),
    ).not.toBeInTheDocument()
    expect(
      within(region).getByRole('button', {
        name: new RegExp(`Word ${kanji}.*reading ${LOCKED_KANJI_WORD.kana}`),
      }),
    ).toBeInTheDocument()
  })
})

describe('KotobaDojoClient - scoped unlock buttons', () => {
  it('exposes a page-level "Unlock all" button next to the heading', () => {
    render(<KotobaDojoClient />)
    expect(screen.getByLabelText(/Unlock all \d+ locked word.*at N5/)).toBeInTheDocument()
  })

  it('tapping the page-level unlock opens an N5 Kotoba scoped prompt', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    await user.click(screen.getByLabelText(/Unlock all \d+ locked word.*at N5/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/N5 Kotoba/).length).toBeGreaterThan(0)
  })

  it('exposes a group-level unlock button on Levels 1-2 while words remain locked', () => {
    render(<KotobaDojoClient />)
    expect(screen.getByLabelText(/Unlock \d+ word.*in Levels 1-2$/)).toBeInTheDocument()
  })

  it('confirming a group bulk unlock clears every locked tile in Levels 1-2', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient />)
    await user.click(screen.getByLabelText(/Unlock \d+ word.*in Levels 1-2$/))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: /^Unlock \d+$/ })
    await user.click(confirm)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    expect(within(region).queryAllByRole('button', { name: /locked\. Tap to unlock/ }).length).toBe(
      0,
    )
  })
})

describe('KotobaDojoClient - state prop', () => {
  it('renders the loading shell deterministically', () => {
    const { container } = render(<KotobaDojoClient state="loading" />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { level: 1, name: 'Kotoba Dojo' })).not.toBeInTheDocument()
  })

  it('renders the error shell with a retry affordance', () => {
    render(<KotobaDojoClient state="error" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/could not load your Kotoba progress/i)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders the empty shell with a Start practice CTA', () => {
    render(<KotobaDojoClient state="empty" />)
    expect(
      screen.getByRole('heading', { name: 'Start building your vocabulary' }),
    ).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: 'Start practice' })
    expect(cta).toHaveAttribute('href', '/practice/kotoba')
  })
})
