// ------------------------------------------------------------
// File: components/ui/sign-up-card.tsx
// Purpose: Two-step sign-up card. Step 1: method picker (Email,
//          Google, Apple). Step 2: email form with username,
//          email, password. Pure state-driven, no route navigation.
// Depends on: components/ui/input, components/ui/key-button,
//             components/ui/logo-full
// ------------------------------------------------------------

'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { LogoFull } from '@/components/ui/logo-full'
import { Input } from '@/components/ui/input'
import { KeyButton } from '@/components/ui/key-button'

// -- Types ----------------------------------------------------

type Step = 'pick' | 'email'

type SignUpCardProps = {
  onClose: () => void
  onSwitchToLogIn: () => void
}

// -- Constants ------------------------------------------------

const STRENGTH_SEGMENTS = 4

const STRENGTH_LABELS: Record<number, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
}

// -- Helpers --------------------------------------------------

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

function getStrengthColor(index: number, strength: number): string {
  if (index >= strength) return 'bg-warm-200'
  if (strength <= 1) return 'bg-feedback-wrong'
  if (strength <= 2) return 'bg-heat-3'
  return 'bg-mint-500'
}

// -- Component ------------------------------------------------

export function SignUpCard({ onClose, onSwitchToLogIn }: SignUpCardProps): ReactNode {
  const [step, setStep] = useState<Step>('pick')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const strength = getPasswordStrength(password)

  if (step === 'email') {
    return (
      <div className="relative bg-surface-raised rounded-2xl px-4 pt-4 pb-3 sm:px-8 sm:pt-8 sm:pb-5 shadow-xl w-full max-w-[440px]">
        <div className="absolute top-2 left-2">
          <button
            type="button"
            onClick={() => setStep('pick')}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-warm-100 transition-colors"
            aria-label="Back to sign-up options"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M10 4L6 8l4 4" />
            </svg>
          </button>
        </div>
        <div className="absolute top-2 right-2">
          <CloseButton onClick={onClose} />
        </div>
        <div className="h-5 sm:h-3" />

        <div className="flex flex-col gap-3">
          <div>
            <Input
              value={username}
              onChange={setUsername}
              label="Username"
              placeholder="Choose a username"
            />
          </div>

          <Input
            value={email}
            onChange={setEmail}
            type="email"
            label="Email"
            placeholder="you@example.com"
          />

          <div>
            <Input
              value={password}
              onChange={setPassword}
              type="password"
              label="Password"
              placeholder="At least 8 characters"
            />
            <div className="flex gap-1 mt-2">
              {Array.from({ length: STRENGTH_SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-150 ${getStrengthColor(i, strength)}`}
                />
              ))}
            </div>
            {strength > 0 && (
              <p className="text-xs text-text-muted mt-1">{STRENGTH_LABELS[strength]}</p>
            )}
          </div>

          <KeyButton
            className="w-full justify-center px-4 py-2.5 sm:py-3.5 text-base sm:text-lg font-medium mt-1 bg-mint-500 text-white shadow-[0_4px_0_0_#2a8a6a]"
            aria-label="Sign up"
          >
            Sign Up
          </KeyButton>
        </div>

        <p className="text-sm sm:text-base text-text-secondary text-center mt-3">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogIn}
            className="text-mint-500 font-medium hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="relative bg-surface-raised rounded-2xl p-6 sm:p-8 shadow-xl w-full max-w-[440px]">
      <div className="absolute top-2 right-2">
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex justify-center">
        <LogoFull className="h-8 sm:h-10 w-auto text-text-primary" />
      </div>

      <h1 className="text-xl font-bold text-text-primary text-center mt-3 mb-4">Sign Up</h1>

      <div className="flex justify-center gap-3 sm:gap-5 mb-4">
        <button
          type="button"
          onClick={() => setStep('email')}
          className="flex flex-col items-center gap-2 sm:gap-3 rounded-xl border border-border bg-white p-4 sm:p-6 hover:border-mint-500 hover:shadow-md transition-all cursor-pointer"
          aria-label="Sign up with Email"
        >
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-mint-500/10">
            <EmailIcon />
          </div>
          <span className="text-sm sm:text-base font-medium text-text-primary">Email</span>
        </button>

        <button
          type="button"
          disabled
          className="flex flex-col items-center gap-2 sm:gap-3 rounded-xl border border-border bg-white p-4 sm:p-6 opacity-50 cursor-not-allowed"
          aria-label="Sign up with Google (coming soon)"
        >
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-warm-100">
            <GoogleIcon />
          </div>
          <span className="text-sm sm:text-base font-medium text-text-muted">Google</span>
        </button>

        <button
          type="button"
          disabled
          className="flex flex-col items-center gap-2 sm:gap-3 rounded-xl border border-border bg-white p-4 sm:p-6 opacity-50 cursor-not-allowed"
          aria-label="Sign up with Apple (coming soon)"
        >
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-warm-100">
            <AppleIcon />
          </div>
          <span className="text-sm sm:text-base font-medium text-text-muted">Apple</span>
        </button>
      </div>

      <p className="text-sm text-text-muted text-center mb-2">
        Google and Apple sign-in coming soon.
      </p>

      <p className="text-base text-text-secondary text-center">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogIn}
          className="text-mint-500 font-medium hover:underline"
        >
          Log in
        </button>
      </p>
    </div>
  )
}

// -- Shared close button --------------------------------------

function CloseButton({ onClick }: { onClick: () => void }): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-warm-100 transition-colors"
      aria-label="Close"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  )
}

// -- Inline icons ---------------------------------------------

function EmailIcon(): ReactNode {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-mint-500"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4L12 13 2 4" />
    </svg>
  )
}

function GoogleIcon(): ReactNode {
  return (
    <svg width="28" height="28" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon(): ReactNode {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="text-warm-800"
    >
      <path d="M17.05 12.54c-.02-2.4 1.96-3.56 2.05-3.62-1.12-1.64-2.87-1.86-3.49-1.89-1.48-.15-2.9.88-3.65.88-.75 0-1.92-.86-3.16-.83-1.62.03-3.12.95-3.95 2.4-1.69 2.93-.43 7.26 1.21 9.64.81 1.17 1.77 2.48 3.03 2.43 1.22-.05 1.68-.79 3.15-.79 1.47 0 1.88.79 3.17.76 1.31-.02 2.14-1.19 2.93-2.36.93-1.36 1.31-2.67 1.33-2.73-.03-.01-2.55-.98-2.58-3.89zM14.63 5.26c.67-.82 1.12-1.95.99-3.08-.96.04-2.13.64-2.82 1.44-.62.72-1.16 1.86-1.01 2.96 1.07.08 2.16-.55 2.84-1.33z" />
    </svg>
  )
}
