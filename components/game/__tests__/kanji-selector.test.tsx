// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/game/__tests__/kanji-selector.test.tsx
// Purpose: Tests for the KanjiSelector component (Stage 2 kanji
//          selection grid in Kotoba Tap mode).
// Depends on: components/game/kanji-selector.tsx
// ─────────────────────────────────────────────

import { render, screen, fireEvent } from '@testing-library/react'
import { KanjiSelector } from '@/components/game/kanji-selector'

vi.mock('@/hooks/useKeySound', () => ({
  useKeySound: (): { playSound: () => void } => ({
    playSound: vi.fn(),
  }),
}))

const OPTIONS = ['犬', '猫', '本', '水']
const CORRECT = '犬'

describe('KanjiSelector', () => {
  it('renders all 4 kanji options', () => {
    render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={vi.fn()}
        feedbackId={null}
        feedbackState="idle"
      />,
    )
    expect(screen.getByText('犬')).toBeTruthy()
    expect(screen.getByText('猫')).toBeTruthy()
    expect(screen.getByText('本')).toBeTruthy()
    expect(screen.getByText('水')).toBeTruthy()
  })

  it('renders Kanji stage label', () => {
    render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={vi.fn()}
        feedbackId={null}
        feedbackState="idle"
      />,
    )
    expect(screen.getByText('Kanji')).toBeTruthy()
  })

  it('calls onSelect with the tapped kanji', () => {
    const onSelect = vi.fn()
    render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={onSelect}
        feedbackId={null}
        feedbackState="idle"
      />,
    )
    fireEvent.click(screen.getByLabelText('Select 猫'))
    expect(onSelect).toHaveBeenCalledWith('猫')
  })

  it('has aria-labels on all buttons', () => {
    render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={vi.fn()}
        feedbackId={null}
        feedbackState="idle"
      />,
    )
    for (const kanji of OPTIONS) {
      expect(screen.getByLabelText(`Select ${kanji}`)).toBeTruthy()
    }
  })

  it('shows correct feedback on the target button', () => {
    const { container } = render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={vi.fn()}
        feedbackId="犬"
        feedbackState="correct"
      />,
    )
    const btn = container.querySelector('[aria-label="Select 犬"]')
    expect(btn?.getAttribute('class')).toContain('bg-sage-400')
  })

  it('shows wrong feedback on the target button', () => {
    const { container } = render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={vi.fn()}
        feedbackId="猫"
        feedbackState="wrong"
      />,
    )
    const btn = container.querySelector('[aria-label="Select 猫"]')
    expect(btn?.getAttribute('class')).toContain('bg-feedback-wrong')
  })

  it('renders a 2-column grid', () => {
    const { container } = render(
      <KanjiSelector
        options={OPTIONS}
        correctAnswer={CORRECT}
        onSelect={vi.fn()}
        feedbackId={null}
        feedbackState="idle"
      />,
    )
    const grid = container.querySelector('[role="group"]')
    expect(grid?.getAttribute('class')).toContain('grid-cols-2')
  })
})
