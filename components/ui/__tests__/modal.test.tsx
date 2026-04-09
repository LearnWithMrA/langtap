// @vitest-environment jsdom
// ------------------------------------------------------------
// File: components/ui/__tests__/modal.test.tsx
// Purpose: Tests for the Modal component.
//          Covers rendering, two-step flow, focus trap, Escape key,
//          scroll lock, backdrop click, ARIA roles, and keyboard nav.
// Depends on: components/ui/modal.tsx
// ------------------------------------------------------------

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/modal'
import type { ReactNode } from 'react'

// -- Helpers -----------------------------------------------------

const STEP_ONE = {
  title: 'Unlock character',
  body: 'This will unlock the character for practice.' as unknown as ReactNode,
  confirmLabel: 'Continue',
  cancelLabel: 'Cancel',
}

const STEP_TWO = {
  title: 'Are you sure?',
  body: 'This cannot be undone.' as unknown as ReactNode,
  confirmLabel: 'Unlock',
  cancelLabel: 'Go back',
}

type ModalWrapperProps = {
  steps?: [typeof STEP_ONE] | [typeof STEP_ONE, typeof STEP_TWO]
  isDanger?: boolean
  onClose?: () => void
  onConfirm?: () => void
}

function ModalWrapper({
  steps = [STEP_ONE],
  isDanger = false,
  onClose = (): void => {},
  onConfirm = (): void => {},
}: ModalWrapperProps): ReactNode {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      onConfirm={onConfirm}
      steps={steps}
      isDanger={isDanger}
    />
  )
}

describe('Modal', () => {
  // -- Rendering -------------------------------------------------

  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} onConfirm={() => {}} steps={[STEP_ONE]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the step title', () => {
    render(<ModalWrapper />)
    expect(screen.getByText('Unlock character')).toBeInTheDocument()
  })

  it('renders the step body', () => {
    render(<ModalWrapper />)
    expect(screen.getByText('This will unlock the character for practice.')).toBeInTheDocument()
  })

  it('renders the confirm button label', () => {
    render(<ModalWrapper />)
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('renders the cancel button label', () => {
    render(<ModalWrapper />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  // -- ARIA roles and labels -------------------------------------

  it('has role="dialog" on the panel', () => {
    render(<ModalWrapper />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal="true" on the panel', () => {
    render(<ModalWrapper />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-labelledby pointing to the title', () => {
    render(<ModalWrapper />)
    const dialog = screen.getByRole('dialog')
    const labelId = dialog.getAttribute('aria-labelledby')
    expect(document.getElementById(labelId!)).toHaveTextContent('Unlock character')
  })

  // -- Cancel / close --------------------------------------------

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<ModalWrapper onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<ModalWrapper onClose={onClose} />)
    // Click the presentation wrapper (backdrop area)
    const backdrop = document.querySelector('[role="presentation"]') as HTMLElement
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the panel itself is clicked', async () => {
    const onClose = vi.fn()
    render(<ModalWrapper onClose={onClose} />)
    await userEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  // -- Escape key ------------------------------------------------

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<ModalWrapper onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // -- Focus trap ------------------------------------------------

  it('traps Tab focus within the modal', async () => {
    render(<ModalWrapper />)
    const buttons = screen.getAllByRole('button')
    // Tab through all buttons - should wrap back to first
    buttons[buttons.length - 1].focus()
    await userEvent.tab()
    expect(buttons[0]).toHaveFocus()
  })

  it('traps Shift+Tab focus within the modal', async () => {
    render(<ModalWrapper />)
    const buttons = screen.getAllByRole('button')
    buttons[0].focus()
    await userEvent.tab({ shift: true })
    expect(buttons[buttons.length - 1]).toHaveFocus()
  })

  // -- Scroll lock -----------------------------------------------

  it('sets body overflow to hidden when open', () => {
    render(<ModalWrapper />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow when closed', () => {
    document.body.style.overflow = ''
    const { unmount } = render(<ModalWrapper />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  // -- Two-step flow ---------------------------------------------

  it('advances to step 2 when confirm is clicked on step 1', async () => {
    let step = 0
    const { rerender } = render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        steps={[STEP_ONE, STEP_TWO]}
        currentStep={step}
        onNextStep={() => {
          step = 1
        }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    rerender(
      <Modal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        steps={[STEP_ONE, STEP_TWO]}
        currentStep={1}
        onNextStep={() => {}}
      />,
    )
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('calls onConfirm on the final step', async () => {
    const onConfirm = vi.fn()
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        steps={[STEP_ONE, STEP_TWO]}
        currentStep={1}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Unlock' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm directly for single-step modal', async () => {
    const onConfirm = vi.fn()
    render(<ModalWrapper onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  // -- Danger variant --------------------------------------------

  it('applies danger variant to confirm button on final step when isDanger=true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        steps={[STEP_ONE, STEP_TWO]}
        currentStep={1}
        isDanger={true}
      />,
    )
    const confirmBtn = screen.getByRole('button', { name: 'Unlock' })
    expect(confirmBtn.className).toContain('bg-blush-100')
  })

  it('does not apply danger variant on step 1 of a two-step flow', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        steps={[STEP_ONE, STEP_TWO]}
        currentStep={0}
        isDanger={true}
      />,
    )
    const confirmBtn = screen.getByRole('button', { name: 'Continue' })
    expect(confirmBtn.className).not.toContain('bg-blush-100')
  })
})
