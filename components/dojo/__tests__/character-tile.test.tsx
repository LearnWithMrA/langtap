// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/dojo/__tests__/character-tile.test.tsx
// Purpose: Tests for CharacterTile.
//          Covers locked, unpractised, mid-score, mastered states;
//          aria-label contents; padlock icon presence; touch target
//          meets minimum; onClick wiring; mastered shimmer class.
// Depends on: components/dojo/character-tile.tsx
// ─────────────────────────────────────────────

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CharacterTile } from '@/components/dojo/character-tile'
import type { KanaCharacter } from '@/types/kana.types'

const A_CHAR: KanaCharacter = {
  id: 'h-a',
  kana: 'あ',
  romaji: 'a',
  script: 'hiragana',
  stage: 'seion',
  row: 'a',
  column: 'a',
}

describe('CharacterTile', () => {
  it('renders the kana glyph and romaji when unlocked', () => {
    render(<CharacterTile character={A_CHAR} score={3} isLocked={false} onClick={() => {}} />)
    expect(screen.getByText('あ')).toBeInTheDocument()
    expect(screen.getByText('a')).toBeInTheDocument()
  })

  it('keeps both kana and romaji visible when locked and shows a padlock badge', () => {
    render(<CharacterTile character={A_CHAR} score={0} isLocked={true} onClick={() => {}} />)
    // Glyph and romaji both render so the character is legible through the lock state.
    expect(screen.getByText('あ')).toBeInTheDocument()
    expect(screen.getByText('a')).toBeInTheDocument()
    // Lock badge is present in the top-right corner. The padlock svg is a
    // presentational element inside an absolutely positioned bubble.
    const button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
    expect(button.className).toMatch(/opacity-70/)
  })

  it('announces locked state in the aria-label with an unlock hint', () => {
    render(<CharacterTile character={A_CHAR} score={0} isLocked={true} onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/Character あ, romaji a, locked\. Tap to unlock\./),
    )
  })

  it('announces mastery score for unlocked characters', () => {
    render(<CharacterTile character={A_CHAR} score={12} isLocked={false} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('mastery 12'),
    )
  })

  it('announces mastered state when score crosses the threshold (40)', () => {
    render(<CharacterTile character={A_CHAR} score={42} isLocked={false} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('mastered'),
    )
  })

  it('applies the gold fill and gold border only on mastered unlocked tiles', () => {
    const { rerender } = render(
      <CharacterTile character={A_CHAR} score={39} isLocked={false} onClick={() => {}} />,
    )
    expect(screen.getByRole('button').className).not.toContain('heat-gold-fill')
    expect(screen.getByRole('button').className).not.toContain(
      'border-[color:var(--color-heat-gold)]',
    )

    rerender(<CharacterTile character={A_CHAR} score={40} isLocked={false} onClick={() => {}} />)
    expect(screen.getByRole('button').className).toContain('heat-gold-fill')
    expect(screen.getByRole('button').className).toContain('border-[color:var(--color-heat-gold)]')
  })

  it('does not apply the mastered styling when the tile is locked', () => {
    render(<CharacterTile character={A_CHAR} score={99} isLocked={true} onClick={() => {}} />)
    expect(screen.getByRole('button').className).not.toContain('heat-gold-fill')
  })

  it('invokes onClick with the character when tapped', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CharacterTile character={A_CHAR} score={0} isLocked={false} onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(A_CHAR)
  })

  it('uses viewport-clamped width and height so the touch target stays above the 44x44 minimum', () => {
    // Tile is now fluid: fills its grid column width (w-full) up to a 76px
    // cap, with height on a separate clamp(64px, calc(13.75vw + 20px), 86px)
    // so content doesn't overlap at the 44px-wide floor. Column widths
    // never go below 44px via the grid's clamp setup, so the tile always
    // exceeds the 44x44 Apple HIG minimum.
    render(<CharacterTile character={A_CHAR} score={0} isLocked={true} onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button.style.maxWidth).toBe('76px')
    expect(button.style.width).toBe('100%')
    expect(button.style.height).toMatch(/clamp/)
    expect(button.style.height).toContain('86px')
  })
})
