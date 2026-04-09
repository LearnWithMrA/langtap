// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/input.test.tsx
// Purpose: Tests for the Input primitive component.
//          Covers value/onChange, label association, disabled state,
//          error state, keyboard behaviour, and ARIA attributes.
// Depends on: components/ui/input.tsx
// ------------------------------------------------------------

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  // -- Rendering -------------------------------------------------

  it('renders with the provided value', () => {
    render(<Input value="hello" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('hello')
  })

  it('renders placeholder text', () => {
    render(<Input value="" onChange={() => {}} placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('renders a visible label when provided', () => {
    render(<Input value="" onChange={() => {}} label="Username" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('associates label with input via htmlFor', () => {
    render(<Input value="" onChange={() => {}} label="Username" />)
    const label = screen.getByText('Username')
    const input = screen.getByRole('textbox')
    expect(label).toHaveAttribute('for', input.id)
  })

  // -- onChange --------------------------------------------------

  it('calls onChange with the new value on input', () => {
    const onChange = vi.fn()
    render(<Input value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })
    expect(onChange).toHaveBeenCalledWith('a')
  })

  // -- Disabled state --------------------------------------------

  it('is disabled when disabled=true', () => {
    render(<Input value="" onChange={() => {}} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies disabled styling', () => {
    render(<Input value="" onChange={() => {}} disabled />)
    expect(screen.getByRole('textbox').className).toContain('disabled:opacity-50')
  })

  // -- Error state -----------------------------------------------

  it('renders error message when error is provided', () => {
    render(<Input value="" onChange={() => {}} error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('sets aria-invalid when error is present', () => {
    render(<Input value="" onChange={() => {}} error="Required" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-describedby pointing to the error element', () => {
    render(<Input value="" onChange={() => {}} error="Required" />)
    const input = screen.getByRole('textbox')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)).toHaveTextContent('Required')
  })

  it('does not set aria-invalid when no error', () => {
    render(<Input value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false')
  })

  it('applies error ring class when error is present', () => {
    render(<Input value="" onChange={() => {}} error="Required" />)
    expect(screen.getByRole('textbox').className).toContain('border-feedback-wrong')
  })

  it('applies normal ring class when no error', () => {
    render(<Input value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox').className).toContain('border-border')
  })

  // -- Keyboard navigation ---------------------------------------

  it('is reachable via Tab', async () => {
    render(<Input value="" onChange={() => {}} />)
    await userEvent.tab()
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('accepts keyboard input', async () => {
    const onChange = vi.fn()
    render(<Input value="" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'a')
    expect(onChange).toHaveBeenCalled()
  })
})
