// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/toast.test.tsx
// Purpose: Tests for the Toast component.
//          Covers rendering, variants, aria-live, dismiss button
//          accessibility, and max-visible cap.
// Depends on: components/ui/toast.tsx
// ------------------------------------------------------------

import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from '@/components/ui/toast'
import type { ToastItem } from '@/components/ui/toast'

// -- Helpers -----------------------------------------------------

function makeToast(overrides: Partial<ToastItem> = {}): ToastItem {
  return {
    id: 'toast-1',
    message: 'Test message',
    variant: 'info',
    ...overrides,
  }
}

describe('Toast', () => {
  // -- Rendering -------------------------------------------------

  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<Toast toasts={[]} onDismiss={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a toast message', () => {
    render(<Toast toasts={[makeToast()]} onDismiss={() => {}} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders multiple toasts', () => {
    const toasts: ToastItem[] = [
      makeToast({ id: '1', message: 'First' }),
      makeToast({ id: '2', message: 'Second' }),
    ]
    render(<Toast toasts={toasts} onDismiss={() => {}} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  // -- Max visible cap -------------------------------------------

  it('renders at most 3 toasts when more than 3 are provided', () => {
    const toasts: ToastItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      message: `Toast ${i}`,
    }))
    render(<Toast toasts={toasts} onDismiss={() => {}} />)
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i })
    expect(dismissButtons).toHaveLength(3)
  })

  // -- ARIA roles and live regions -------------------------------

  it('uses aria-live="polite" for info variant', () => {
    const { container } = render(
      <Toast toasts={[makeToast({ variant: 'info' })]} onDismiss={() => {}} />,
    )
    const entry = container.querySelector('[aria-live="polite"]')
    expect(entry).toBeInTheDocument()
  })

  it('uses aria-live="polite" for success variant', () => {
    const { container } = render(
      <Toast toasts={[makeToast({ variant: 'success' })]} onDismiss={() => {}} />,
    )
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
  })

  it('uses role="alert" for error variant', () => {
    render(<Toast toasts={[makeToast({ variant: 'error' })]} onDismiss={() => {}} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not set role="alert" for non-error variants', () => {
    render(<Toast toasts={[makeToast({ variant: 'info' })]} onDismiss={() => {}} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // -- Dismiss button accessibility ------------------------------

  it('renders a dismiss button with accessible label', () => {
    render(<Toast toasts={[makeToast()]} onDismiss={() => {}} />)
    expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument()
  })

  it('calls onDismiss with the toast id when dismiss is clicked', async () => {
    const onDismiss = vi.fn()
    render(<Toast toasts={[makeToast({ id: 'abc' })]} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss notification/i }))
    expect(onDismiss).toHaveBeenCalledWith('abc')
  })

  it('dismiss button is reachable via Tab', async () => {
    render(<Toast toasts={[makeToast()]} onDismiss={() => {}} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /dismiss notification/i })).toHaveFocus()
  })

  // -- Auto-dismiss timing ---------------------------------------

  it('calls onDismiss after the specified duration', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast toasts={[makeToast({ id: 'timed', durationMs: 2000 })]} onDismiss={onDismiss} />)
    act(() => vi.advanceTimersByTime(2000))
    expect(onDismiss).toHaveBeenCalledWith('timed')
    vi.useRealTimers()
  })

  it('does not auto-dismiss when durationMs is 0', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(
      <Toast toasts={[makeToast({ id: 'persistent', durationMs: 0 })]} onDismiss={onDismiss} />,
    )
    act(() => vi.advanceTimersByTime(10000))
    expect(onDismiss).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  // -- Variant styling -------------------------------------------

  it('applies success variant classes', () => {
    const { container } = render(
      <Toast toasts={[makeToast({ variant: 'success' })]} onDismiss={() => {}} />,
    )
    const entry = container.querySelector('[aria-live]') as HTMLElement
    expect(entry.className).toContain('bg-mint-100')
  })

  it('applies warning variant classes', () => {
    const { container } = render(
      <Toast toasts={[makeToast({ variant: 'warning' })]} onDismiss={() => {}} />,
    )
    const entry = container.querySelector('[aria-live]') as HTMLElement
    expect(entry.className).toContain('bg-warm-100')
  })

  it('applies error variant classes', () => {
    render(<Toast toasts={[makeToast({ variant: 'error' })]} onDismiss={() => {}} />)
    expect(screen.getByRole('alert').className).toContain('bg-blush-100')
  })
})
