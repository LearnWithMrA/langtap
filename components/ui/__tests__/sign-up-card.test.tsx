// @vitest-environment jsdom
// ─────────────────────────────────────────────
// File: components/ui/__tests__/sign-up-card.test.tsx
// Purpose: Tests for the sign-up card consent gates - the sign-up
//          button stays disabled until BOTH the terms checkbox and
//          the 13+ age confirmation are checked.
// Depends on: components/ui/sign-up-card.tsx
// ─────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next/navigation', () => ({
  useRouter: (): Record<string, unknown> => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/services/auth.service', () => ({
  signUp: vi.fn().mockResolvedValue({ ok: true, userId: 'u1', profileWritten: true }),
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
}))

import { SignUpCard } from '../sign-up-card'

async function renderEmailStep(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup()
  render(<SignUpCard onClose={vi.fn()} onSwitchToLogIn={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: /email/i }))
  return user
}

describe('SignUpCard consent gates', () => {
  it('renders both the terms and age checkboxes on the email step', async () => {
    await renderEmailStep()
    expect(screen.getByLabelText('Accept terms and conditions')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm you are 13 years of age or older')).toBeInTheDocument()
  })

  it('disables sign-up until both checkboxes are checked', async () => {
    const user = await renderEmailStep()
    const signUpButton = screen.getByRole('button', { name: 'Sign up' })
    expect(signUpButton).toBeDisabled()

    await user.click(screen.getByLabelText('Accept terms and conditions'))
    expect(signUpButton).toBeDisabled()

    await user.click(screen.getByLabelText('Confirm you are 13 years of age or older'))
    expect(signUpButton).toBeEnabled()
  })

  it('disables sign-up with only the age checkbox checked', async () => {
    const user = await renderEmailStep()
    await user.click(screen.getByLabelText('Confirm you are 13 years of age or older'))
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled()
  })

  it('links to both the terms and privacy pages', async () => {
    await renderEmailStep()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })
})
