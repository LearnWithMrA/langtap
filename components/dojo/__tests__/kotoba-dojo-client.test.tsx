// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/dojo/__tests__/kotoba-dojo-client.test.tsx
// Purpose: End-to-end tests for KotobaDojoClient orchestration.
//          Covers: initial render of the tab row and unit grid, tab
//          keyboard navigation, single-open unit accordion (every
//          unit is expandable now - there is no "locked unit"
//          variant), multi-open level-group accordion, word tile
//          content for kanji-bearing and kana-only entries,
//          long-gloss truncation, word popover flow (hero title,
//          Mark as mastered action, reset two-step), locked word tile
//          rendering + tap-to-unlock, page / unit / group unlock
//          buttons, deterministic loading / error / empty state-prop
//          screens.
// Depends on: components/layout/kotoba-dojo-client.tsx
// ─────────────────────────────────────────────

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KotobaDojoClient } from '@/components/layout/kotoba-dojo-client'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

describe('KotobaDojoClient - ready shell', () => {
  it('renders the page heading and the JLPT tab row', () => {
    render(<KotobaDojoClient fixture="variety" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kotoba Dojo' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'JLPT level' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'N5' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'N4' })).toHaveAttribute('aria-selected', 'false')
  })

  it('moves selection and focus with ArrowRight on the tab row', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const n5 = screen.getByRole('tab', { name: 'N5' })
    n5.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'N4' })).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the last tab with End and the first with Home', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    screen.getByRole('tab', { name: 'N5' }).focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'N1' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'N5' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders three expandable N5 unit cards, every one interactive', () => {
    render(<KotobaDojoClient fixture="variety" />)
    expect(screen.getByRole('button', { name: /Unit 1,.*Levels 1-4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unit 2,.*Levels 5-8/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unit 3,.*Levels 9-12/ })).toBeInTheDocument()
  })

  it('opens Unit 1 by default and shows the Levels 1-2 group open', () => {
    render(<KotobaDojoClient fixture="variety" />)
    expect(screen.getByRole('button', { name: /^Levels 1-2/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Levels 1-2' })).toBeInTheDocument()
  })

  it('single-open unit accordion: opening Unit 2 closes Unit 1', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const unit2 = screen.getByRole('button', { name: /Unit 2,.*closed/ })
    await user.click(unit2)
    expect(screen.getByRole('button', { name: /Unit 2,.*open/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unit 1,.*closed/ })).toBeInTheDocument()
  })

  it('multi-open inner level-group accordion: opening Levels 3-4 leaves Levels 1-2 open', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const levels34 = screen.getByRole('button', { name: /^Levels 3-4/ })
    await user.click(levels34)
    expect(screen.getByRole('region', { name: 'Levels 1-2' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Levels 3-4' })).toBeInTheDocument()
  })

  it('renders twelve word tiles for N5 Unit 1 Levels 1-2', () => {
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tiles = within(region).getAllByRole('button')
    expect(tiles.length).toBe(12)
  })

  it('renders kanji, kana, and english for words that have a kanji form', () => {
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', {
      name: /Word 日本, reading にほん, meaning Japan, mastered/,
    })
    expect(tile).toBeInTheDocument()
    expect(within(tile).getByText('日本')).toBeInTheDocument()
    expect(within(tile).getByText('にほん')).toBeInTheDocument()
    expect(within(tile).getByText('Japan')).toBeInTheDocument()
  })

  it('kana-only words promote the kana reading into the glyph slot and drop the third row', () => {
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', {
      name: /^Word さようなら, meaning goodbye.*, mastery \d+/,
    })
    expect(tile).toBeInTheDocument()
    expect(within(tile).getByText('さようなら')).toBeInTheDocument()
    // Exactly two visible text rows (kana + english). Progress pill is
    // aria-hidden and doesn't count.
    const visibleSpans = within(tile)
      .getAllByText(/./, { selector: 'span' })
      .filter((el) => el.getAttribute('aria-hidden') !== 'true')
    expect(visibleSpans.length).toBe(2)
  })

  it('long english gloss is attached to the tile for hover-to-view', () => {
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', {
      name: /Word さようなら.*parting greeting/,
    })
    const titled = tile.querySelector('[title]')
    expect(titled?.getAttribute('title')).toContain('parting greeting')
  })

  it('renders the two hiragana-only and two katakana-only sample entries', () => {
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    expect(
      within(region).getByRole('button', { name: /Word さようなら, meaning goodbye/ }),
    ).toBeInTheDocument()
    expect(
      within(region).getByRole('button', { name: /Word おはよう, meaning good morning/ }),
    ).toBeInTheDocument()
    expect(
      within(region).getByRole('button', { name: /Word テレビ, meaning television/ }),
    ).toBeInTheDocument()
    expect(
      within(region).getByRole('button', { name: /Word コーヒー, meaning coffee.*locked/ }),
    ).toBeInTheDocument()
  })
})

describe('KotobaDojoClient - word popover', () => {
  it('opens the detail popover with the kanji as the hero title', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', { name: /Word 水, reading みず/ })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '水' })).toBeInTheDocument()
    expect(within(dialog).getByText('みず')).toBeInTheDocument()
    expect(within(dialog).getByText('water')).toBeInTheDocument()
  })

  it('uses the kana as the hero title when the word has no kanji', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', { name: /^Word おはよう/ })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'おはよう' })).toBeInTheDocument()
    // Kana does not repeat inside the body when there is no separate kanji.
    expect(within(dialog).queryAllByText('おはよう').length).toBe(1)
  })

  it('exposes Close, Mark as mastered, and Reset progress as equal-weight actions', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    await user.click(within(region).getByRole('button', { name: /Word 水, reading みず/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Mark as mastered' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Reset progress' })).toBeInTheDocument()
  })

  it('Mark as mastered flips the tile straight into the mastered band', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    await user.click(within(region).getByRole('button', { name: /Word 水, reading みず/ }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Mark as mastered' }))
    expect(
      within(region).getByRole('button', { name: /Word 水, reading みず.*mastered/ }),
    ).toBeInTheDocument()
  })

  it('runs the two-step reset flow and clears the word score', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    await user.click(within(region).getByRole('button', { name: /Word 水, reading みず/ }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset progress' }))
    expect(within(dialog).getByText(/Reset progress on みず\?/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }))
    expect(within(dialog).getByText(/Are you sure\?/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }))
    expect(
      within(region).getByRole('button', { name: /Word 水, reading みず.*mastery 0/ }),
    ).toBeInTheDocument()
  })
})

describe('KotobaDojoClient - locked words', () => {
  it('renders 学校 as a locked tile advertising tap-to-unlock', () => {
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', {
      name: /Word 学校, reading がっこう, meaning school, locked. Tap to unlock/,
    })
    expect(tile).toBeInTheDocument()
  })

  it('tapping a locked tile opens the single-step unlock prompt', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', { name: /Word 学校.*locked/ })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Unlock 学校 \(がっこう\)\?/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Unlock' })).toBeInTheDocument()
  })

  it('confirming the unlock prompt flips the tile out of its locked state', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    const region = screen.getByRole('region', { name: 'Levels 1-2' })
    const tile = within(region).getByRole('button', { name: /Word 学校.*locked/ })
    await user.click(tile)
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Unlock' }))
    expect(
      within(region).queryByRole('button', { name: /Word 学校.*locked/ }),
    ).not.toBeInTheDocument()
    expect(
      within(region).getByRole('button', { name: /Word 学校, reading がっこう/ }),
    ).toBeInTheDocument()
  })
})

describe('KotobaDojoClient - scoped unlock buttons', () => {
  it('exposes a page-level "Unlock all" button next to the heading', () => {
    render(<KotobaDojoClient fixture="variety" />)
    expect(screen.getByLabelText(/Unlock all \d+ locked word.*at N5/)).toBeInTheDocument()
  })

  it('tapping the page-level unlock opens an N5 Kotoba scoped prompt', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    await user.click(screen.getByLabelText(/Unlock all \d+ locked word.*at N5/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/N5 Kotoba/).length).toBeGreaterThan(0)
  })

  it('exposes a unit-level unlock button on Unit 1 while words remain locked', () => {
    render(<KotobaDojoClient fixture="variety" />)
    expect(screen.getByLabelText(/Unlock \d+ word.*in Unit 1$/)).toBeInTheDocument()
  })

  it('tapping the unit-level unlock opens a Unit 1 scoped prompt', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
    await user.click(screen.getByLabelText(/Unlock \d+ word.*in Unit 1$/))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/Unit 1/).length).toBeGreaterThan(0)
  })

  it('exposes a group-level unlock button on Levels 1-2 while words remain locked', () => {
    render(<KotobaDojoClient fixture="variety" />)
    expect(screen.getByLabelText(/Unlock \d+ word.*in Levels 1-2$/)).toBeInTheDocument()
  })

  it('confirming a group bulk unlock clears every locked tile in Levels 1-2', async () => {
    const user = userEvent.setup()
    render(<KotobaDojoClient fixture="variety" />)
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
    expect(cta).toHaveAttribute('href', '/practice?mode=kotoba')
  })
})
