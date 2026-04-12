// ─────────────────────────────────────────────
// File: services/auth.service.ts
// Purpose: All authentication operations: sign up, sign in, get current user,
//          and send password reset email.
//          Maps raw Supabase errors to plain English strings before returning.
//          Never called directly from components or stores - go through hooks.
//          Two-phase sign-up: (1) auth.signUp, (2) profile username write.
//          If phase 2 fails the user IS authenticated. Caller must handle
//          the profileWritten: false case by enqueueing a repair path.
// Depends on: services/supabase-browser.ts, types/user.types.ts
// ─────────────────────────────────────────────

import type { AuthError } from '@supabase/supabase-js'

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Result types ──────────────────────────────

export type AuthResult = { ok: true; userId: string } | { ok: false; error: string }

/**
 * Extends AuthResult for the two-phase sign-up flow.
 *
 * When ok is true and profileWritten is false:
 *   - The user IS authenticated and has a valid session.
 *   - The username update failed after all retries.
 *   - The caller MUST still proceed with the auth flow (redirect to onboarding).
 *   - On the first profile visit, the caller should prompt the user to set their
 *     username again (repair path). Do not block the user from the app.
 */
export type SignUpResult =
  | { ok: true; userId: string; profileWritten: boolean }
  | { ok: false; error: string }

// ── Constants ─────────────────────────────────

const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 20
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

const PASSWORD_MIN_LENGTH = 8

// Postgres error codes that indicate the profile row will never be writable
// with a retry. These are structural problems, not transient failures.
const NON_RETRYABLE_PG_CODES = new Set(['42501', '42703', '42P01'])

const PROFILE_UPDATE_MAX_ATTEMPTS = 3
const PROFILE_UPDATE_RETRY_DELAY_MS = 200

// ── Validation ────────────────────────────────

type ValidationResult = { valid: true } | { valid: false; error: string }

function validateSignUpInputs(email: string, password: string, username: string): ValidationResult {
  if (!username || username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: 'Username must be between 3 and 20 characters.' }
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores.',
    }
  }
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Please enter a valid email address.' }
  }
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: 'Password must be at least 8 characters.' }
  }
  return { valid: true }
}

function validateEmail(email: string): ValidationResult {
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Please enter a valid email address.' }
  }
  return { valid: true }
}

// ── Error mapping ─────────────────────────────

// Maps a Supabase AuthError to a plain English string.
// Priority: error.code (stable enum) -> error.status (HTTP) -> error.message (fragile fallback).
function mapAuthError(error: AuthError, context: 'signUp' | 'signIn' | 'passwordReset'): string {
  // code-based mapping (most stable - these are Supabase's documented error codes)
  if (error.code === 'user_already_exists' || error.code === 'email_exists') {
    return 'An account with this email already exists.'
  }
  if (error.code === 'weak_password') {
    return 'Please choose a longer password.'
  }
  if (error.code === 'invalid_credentials') {
    return 'Incorrect email or password.'
  }
  if (error.code === 'email_not_confirmed') {
    return 'Please verify your email before logging in.'
  }
  if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
    return 'Too many requests. Please wait a moment and try again.'
  }

  // status-based fallback
  if (error.status === 400) {
    if (context === 'signIn') return 'Incorrect email or password.'
    if (context === 'signUp') return 'An account with this email already exists.'
  }
  if (error.status === 422) {
    return 'Please check your email and password and try again.'
  }
  if (error.status !== undefined && error.status >= 500) {
    return 'Something went wrong on our end. Please try again.'
  }

  // message-based fallback (fragile - Supabase can change these without notice)
  const msg = error.message?.toLowerCase() ?? ''
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists.'
  }
  if (msg.includes('password should be at least') || msg.includes('password is too short')) {
    return 'Please choose a longer password.'
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Incorrect email or password.'
  }

  return 'Something went wrong. Please try again.'
}

// ── Profile username retry ─────────────────────

// Returns true when the Postgres error code is a structural (non-retryable) failure.
// PostgrestError only exposes `code` (the 5-char Postgres error code), not an HTTP status.
function isNonRetryable(code: string | undefined): boolean {
  return code !== undefined && NON_RETRYABLE_PG_CODES.has(code)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Attempts to write the chosen username to the profiles row created by the
// database trigger. Retries up to maxAttempts times with a fixed delay.
//
// Row-not-found (data.length === 0 with no error) is retryable: the trigger
// that inserts the profiles row runs asynchronously and may not have committed
// before this first attempt.
async function updateUsernameWithRetry(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  userId: string,
  username: string,
  maxAttempts = PROFILE_UPDATE_MAX_ATTEMPTS,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId)
      .select('id')

    if (error) {
      if (isNonRetryable(error.code)) {
        // Structural failure - retrying will not help.
        return false
      }
      // Network or 5xx - wait and retry
    } else if (data !== null && data.length > 0) {
      // Row found and updated.
      return true
    }
    // data.length === 0 means the trigger hasn't committed the row yet - retryable.

    if (attempt < maxAttempts) {
      await sleep(PROFILE_UPDATE_RETRY_DELAY_MS)
    }
  }

  return false
}

// ── Auth operations ───────────────────────────

/**
 * Creates a new account, then writes the chosen username to the profiles table.
 *
 * On success with profileWritten: false - the user IS authenticated.
 * The caller must continue the auth flow and schedule a repair path for the
 * username on the user's first profile visit.
 */
export async function signUp(
  email: string,
  password: string,
  username: string,
): Promise<SignUpResult> {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim()
  // Password is NOT normalized - preserve exactly what the user typed.

  const validation = validateSignUpInputs(normalizedEmail, password, normalizedUsername)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  })

  if (error) {
    return { ok: false, error: mapAuthError(error, 'signUp') }
  }

  const userId = data.user?.id
  if (!userId) {
    // Supabase returned success with no user - unexpected state.
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  const profileWritten = await updateUsernameWithRetry(supabase, userId, normalizedUsername)

  return { ok: true, userId, profileWritten }
}

/**
 * Signs an existing user in with email and password.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await createBrowserSupabaseClient().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error) {
    return { ok: false, error: mapAuthError(error, 'signIn') }
  }

  const userId = data.user?.id
  if (!userId) {
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  return { ok: true, userId }
}

/**
 * Returns the currently authenticated user, or null if not signed in.
 * Uses getUser() (network-verified). Never use getSession() server-side.
 */
export async function getUser(): Promise<{
  user: { id: string; email: string | undefined } | null
}> {
  const { data } = await createBrowserSupabaseClient().auth.getUser()

  if (!data.user) {
    return { user: null }
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  }
}

/**
 * Sends a password reset email to the given address.
 * Validates email format before calling Supabase to avoid unnecessary network requests.
 */
export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase()

  const validation = validateEmail(normalizedEmail)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=/profile/update-password`
      : undefined

  const { error } = await createBrowserSupabaseClient().auth.resetPasswordForEmail(
    normalizedEmail,
    { redirectTo },
  )

  if (error) {
    return { ok: false, error: mapAuthError(error, 'passwordReset') }
  }

  return { ok: true }
}
