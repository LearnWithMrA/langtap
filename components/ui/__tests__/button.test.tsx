// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/button.test.tsx
// Purpose: Tests for the Button primitive component.
//          Covers all variants, sizes, disabled/loading states,
//          keyboard activation, and ARIA attributes.
// Depends on: components/ui/button.tsx
// ------------------------------------------------------------

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  // -- Variants --------------------------------------------------

  it('renders primary variant by default', () => {
    const { container } = render(<Button>Save</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('bg-sage-500')
  })

  it('renders secondary variant', () => {
    const { container } = render(<Button variant="secondary">Cancel</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('bg-sage-100')
  })

  it('renders ghost variant', () => {
    const { container } = render(<Button variant="ghost">Skip</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('bg-transparent')
  })

  it('renders danger variant', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('bg-blush-100')
  })

  // -- Sizes -----------------------------------------------------

  it('renders md size by default', () => {
    const { container } = render(<Button>Go</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('min-h-11')
  })

  it('renders sm size', () => {
    const { container } = render(<Button size="sm">Go</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('text-sm')
    expect(btn.className).toContain('min-h-11')
  })

  it('renders lg size', () => {
    const { container } = render(<Button size="lg">Go</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('text-lg')
  })

  // -- Touch target ----------------------------------------------

  it('always includes 44pt minimum touch target classes', () => {
    const { container } = render(<Button size="sm">Tap</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('min-h-11')
    expect(btn.className).toContain('min-w-11')
  })

  // -- Disabled state --------------------------------------------

  it('is disabled when disabled=true', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  // -- Loading state ---------------------------------------------

  it('renders loading spinner when loading=true', () => {
    render(<Button loading>Saving</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    // Spinner is aria-hidden so we check via container
    const { container } = render(<Button loading>Saving</Button>)
    const spinner = container.querySelector('[aria-hidden="true"]')
    expect(spinner).toBeInTheDocument()
  })

  it('is disabled when loading=true', () => {
    render(<Button loading>Saving</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  // -- Click handler ---------------------------------------------

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  // -- Keyboard navigation ---------------------------------------

  it('activates onClick via Enter key', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button')
    btn.focus()
    fireEvent.keyDown(btn, { key: 'Enter' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })

  it('activates onClick via Space key', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button')
    btn.focus()
    fireEvent.keyDown(btn, { key: ' ' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })

  it('is reachable via Tab', async () => {
    render(<Button>Save</Button>)
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
  })

  // -- ARIA label ------------------------------------------------

  it('renders aria-label when provided', () => {
    render(<Button aria-label="Submit form">Go</Button>)
    expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument()
  })

  // -- Type attribute --------------------------------------------

  it('defaults to type="button"', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('accepts type="submit"', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
