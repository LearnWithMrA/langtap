// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/progress-bar.test.tsx
// Purpose: Tests for the ProgressBar component.
//          Covers score-to-width mapping, heatClass validation,
//          locked state, invalid inputs, and ARIA attributes.
// Depends on: components/ui/progress-bar.tsx
// ------------------------------------------------------------

import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/ui/progress-bar'

describe('ProgressBar', () => {
  // -- ARIA roles and attributes ---------------------------------

  it('has role="progressbar"', () => {
    render(<ProgressBar score={10} heatClass="bg-heat-3" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('sets aria-valuenow to the score', () => {
    render(<ProgressBar score={15} heatClass="bg-heat-3" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '15')
  })

  it('sets aria-valuemin to 0', () => {
    render(<ProgressBar score={10} heatClass="bg-heat-3" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
  })

  it('sets aria-valuemax to 40', () => {
    render(<ProgressBar score={10} heatClass="bg-heat-3" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '40')
  })

  it('uses default aria-label when none provided', () => {
    render(<ProgressBar score={10} heatClass="bg-heat-3" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Mastery score: 10')
  })

  it('uses custom aria-label when provided', () => {
    render(<ProgressBar score={10} heatClass="bg-heat-3" label="Character あ progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Character あ progress')
  })

  // -- Score to fill width ---------------------------------------

  it('renders fill at 0% for score 0', () => {
    const { container } = render(<ProgressBar score={0} heatClass="bg-heat-0" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('renders fill at 50% for score 20', () => {
    const { container } = render(<ProgressBar score={20} heatClass="bg-heat-4" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('50%')
  })

  it('renders fill at 100% for score 40', () => {
    const { container } = render(<ProgressBar score={40} heatClass="bg-heat-5" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  it('renders fill at 100% for score above 40', () => {
    const { container } = render(<ProgressBar score={99} heatClass="bg-heat-5" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  // -- heatClass applied to fill ---------------------------------

  it('applies the heatClass to the fill element', () => {
    const { container } = render(<ProgressBar score={10} heatClass="bg-heat-3" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.className).toContain('bg-heat-3')
  })

  // -- Invalid input handling ------------------------------------

  it('clamps negative score to 0', () => {
    render(<ProgressBar score={-5} heatClass="bg-heat-0" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    const { container } = render(<ProgressBar score={-5} heatClass="bg-heat-0" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('clamps NaN score to 0', () => {
    render(<ProgressBar score={NaN} heatClass="bg-heat-0" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('falls back to bg-heat-0 for invalid heatClass', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<ProgressBar score={10} heatClass="bg-invalid-class" />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.className).toContain('bg-heat-0')
    warnSpy.mockRestore()
  })

  it('logs a console.warn in dev for invalid heatClass', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ProgressBar score={10} heatClass="not-valid" />)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid heatClass'))
    warnSpy.mockRestore()
  })

  // -- Locked state ----------------------------------------------

  it('renders with opacity-50 when locked', () => {
    const { container } = render(<ProgressBar score={20} heatClass="bg-heat-4" isLocked />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.className).toContain('opacity-50')
  })

  it('renders fill at 0% when locked regardless of score', () => {
    const { container } = render(<ProgressBar score={30} heatClass="bg-heat-4" isLocked />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('uses bg-heat-0 fill when locked regardless of heatClass', () => {
    const { container } = render(<ProgressBar score={30} heatClass="bg-heat-5" isLocked />)
    const fill = container.querySelector('[style]') as HTMLElement
    expect(fill.className).toContain('bg-heat-0')
    expect(fill.className).not.toContain('bg-heat-5')
  })
})
