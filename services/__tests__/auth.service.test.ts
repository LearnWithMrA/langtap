// ─────────────────────────────────────────────
// File: services/__tests__/auth.service.test.ts
// Purpose: Unit tests for auth.service.ts.
//          Supabase client is mocked at module level so no network calls occur.
//          Tests cover: input validation, error mapping, two-phase sign-up,
//          retry logic, signIn, getUser, and sendPasswordReset.
// Depends on: services/auth.service.ts, vitest, vi
// ─────────────────────────────────────────────

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Supabase mock ──────────────────────────────

// These are the mock return values we control per test.
let mockSignUpResult: {
  data: { user: { id: string } | null }
  error: { code?: string; status?: number; message: string } | null
} = {
  data: { user: { id: 'user-1' } },
  error: null,
}
let mockSignInResult: {
  data: { user: { id: string } | null }
  error: { code?: string; status?: number; message: string } | null
} = {
  data: { user: { id: 'user-1' } },
  error: null,
}
let mockGetUserResult: { data: { user: { id: string; email: string } | null } } = {
  data: { user: { id: 'user-1', email: 'test@example.com' } },
}
let mockResetPasswordResult: { error: { code?: string; status?: number; message: string } | null } =
  {
    error: null,
  }

// Controls the sequence of results for profile update attempts.
let mockUpdateResults: Array<{
  data: Array<{ id: string }> | null
  error: { code?: string; status?: number; message: string } | null
}> = []

type UpdateMock = {
  from: ReturnType<typeof vi.fn>
}

function makeUpdateMock(): UpdateMock {
  let callCount = 0
  return {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockImplementation(() => {
            const result = mockUpdateResults[callCount] ?? { data: [{ id: 'user-1' }], error: null }
            callCount++
            return Promise.resolve(result)
          }),
        }),
      }),
    }),
  }
}

vi.mock('@/services/supabase-browser', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(() => Promise.resolve(mockSignUpResult)),
      signInWithPassword: vi.fn(() => Promise.resolve(mockSignInResult)),
      getUser: vi.fn(() => Promise.resolve(mockGetUserResult)),
      resetPasswordForEmail: vi.fn(() => Promise.resolve(mockResetPasswordResult)),
    },
    ...makeUpdateMock(),
  })),
}))

// ── Import after mock ─────────────────────────

import { getUser, sendPasswordReset, signIn, signUp } from '@/services/auth.service'

// ── Helpers ───────────────────────────────────

function makeAuthError(overrides: { code?: string; status?: number; message?: string } = {}): {
  code?: string
  status?: number
  message: string
} {
  return {
    code: overrides.code,
    status: overrides.status,
    message: overrides.message ?? 'some error',
  }
}

// ── signUp - input validation ─────────────────

describe('signUp - input validation', () => {
  it('rejects a username that is too short', async () => {
    const result = await signUp('a@b.com', 'password123', 'ab')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/3 and 20 characters/)
  })

  it('rejects a username that is too long', async () => {
    const result = await signUp('a@b.com', 'password123', 'a'.repeat(21))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/3 and 20 characters/)
  })

  it('rejects a username with disallowed characters', async () => {
    const result = await signUp('a@b.com', 'password123', 'user name!')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/letters, numbers, and underscores/)
  })

  it('rejects an email without @', async () => {
    const result = await signUp('notanemail', 'password123', 'validuser')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/valid email/)
  })

  it('rejects a password shorter than 8 characters', async () => {
    const result = await signUp('a@b.com', 'short', 'validuser')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/at least 8 characters/)
  })
})

// ── signUp - email normalisation ──────────────

describe('signUp - email normalisation', () => {
  beforeEach(() => {
    mockSignUpResult = { data: { user: { id: 'user-1' } }, error: null }
    mockUpdateResults = [{ data: [{ id: 'user-1' }], error: null }]
  })

  it('trims and lowercases the email before passing to Supabase', async () => {
    const result = await signUp('  ALICE@EXAMPLE.COM  ', 'password123', 'alice')
    expect(result.ok).toBe(true)
  })

  it('trims the username', async () => {
    const result = await signUp('a@b.com', 'password123', '  alice  ')
    expect(result.ok).toBe(true)
  })
})

// ── signUp - auth error mapping ───────────────

describe('signUp - auth error mapping', () => {
  it('maps user_already_exists code', async () => {
    mockSignUpResult = {
      data: { user: null },
      error: makeAuthError({ code: 'user_already_exists' }),
    }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('An account with this email already exists.')
  })

  it('maps email_exists code', async () => {
    mockSignUpResult = { data: { user: null }, error: makeAuthError({ code: 'email_exists' }) }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('An account with this email already exists.')
  })

  it('maps weak_password code', async () => {
    mockSignUpResult = { data: { user: null }, error: makeAuthError({ code: 'weak_password' }) }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Please choose a longer password.')
  })

  it('maps status 400 on sign-up to already exists', async () => {
    mockSignUpResult = { data: { user: null }, error: makeAuthError({ status: 400 }) }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('An account with this email already exists.')
  })

  it('maps status 5xx to generic server error', async () => {
    mockSignUpResult = { data: { user: null }, error: makeAuthError({ status: 503 }) }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Something went wrong on our end. Please try again.')
  })

  it('maps legacy message "User already registered"', async () => {
    mockSignUpResult = {
      data: { user: null },
      error: makeAuthError({ message: 'User already registered' }),
    }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('An account with this email already exists.')
  })

  it('returns generic error for unknown codes', async () => {
    mockSignUpResult = {
      data: { user: null },
      error: makeAuthError({ message: 'unknown error xyz' }),
    }
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Something went wrong. Please try again.')
  })

  it('returns ok: false when Supabase returns no user despite no error', async () => {
    mockSignUpResult = { data: { user: null }, error: null }
    mockUpdateResults = []
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(false)
  })
})

// ── signUp - profile write ────────────────────

describe('signUp - profile write', () => {
  beforeEach(() => {
    mockSignUpResult = { data: { user: { id: 'user-1' } }, error: null }
  })

  it('returns profileWritten: true when update succeeds immediately', async () => {
    mockUpdateResults = [{ data: [{ id: 'user-1' }], error: null }]
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.profileWritten).toBe(true)
  })

  it('returns profileWritten: true after a row-not-found retry', async () => {
    // First attempt: trigger hasn't committed yet (data is empty, no error)
    // Second attempt: row is there
    mockUpdateResults = [
      { data: [], error: null },
      { data: [{ id: 'user-1' }], error: null },
    ]
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.profileWritten).toBe(true)
  })

  it('returns profileWritten: false after all retries exhausted', async () => {
    mockUpdateResults = [
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.profileWritten).toBe(false)
  })

  it('returns profileWritten: false immediately on non-retryable RLS error (42501)', async () => {
    mockUpdateResults = [{ data: null, error: makeAuthError({ code: '42501' }) }]
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.profileWritten).toBe(false)
  })

  it('returns profileWritten: false immediately on non-retryable undefined column error (42703)', async () => {
    mockUpdateResults = [{ data: null, error: makeAuthError({ code: '42703' }) }]
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.profileWritten).toBe(false)
  })

  it('retries on a transient (non-structural) error and succeeds on second attempt', async () => {
    // An error with no code is treated as transient (network/unknown) and retried.
    mockUpdateResults = [
      { data: null, error: makeAuthError({ message: 'connection error' }) },
      { data: [{ id: 'user-1' }], error: null },
    ]
    const result = await signUp('a@b.com', 'password123', 'alice')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.profileWritten).toBe(true)
  })
})

// ── signIn ────────────────────────────────────

describe('signIn', () => {
  it('returns ok: true with userId on success', async () => {
    mockSignInResult = { data: { user: { id: 'user-1' } }, error: null }
    const result = await signIn('a@b.com', 'password123')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.userId).toBe('user-1')
  })

  it('normalises the email to lowercase and trimmed', async () => {
    mockSignInResult = { data: { user: { id: 'user-1' } }, error: null }
    const result = await signIn('  ALICE@EXAMPLE.COM  ', 'password123')
    expect(result.ok).toBe(true)
  })

  it('maps invalid_credentials code', async () => {
    mockSignInResult = {
      data: { user: null },
      error: makeAuthError({ code: 'invalid_credentials' }),
    }
    const result = await signIn('a@b.com', 'password123')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Incorrect email or password.')
  })

  it('maps status 400 on sign-in to incorrect credentials', async () => {
    mockSignInResult = { data: { user: null }, error: makeAuthError({ status: 400 }) }
    const result = await signIn('a@b.com', 'password123')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Incorrect email or password.')
  })

  it('returns ok: false when Supabase returns no user despite no error', async () => {
    mockSignInResult = { data: { user: null }, error: null }
    const result = await signIn('a@b.com', 'password123')
    expect(result.ok).toBe(false)
  })
})

// ── getUser ───────────────────────────────────

describe('getUser', () => {
  it('returns the authenticated user', async () => {
    mockGetUserResult = { data: { user: { id: 'user-1', email: 'a@b.com' } } }
    const result = await getUser()
    expect(result.user).not.toBeNull()
    expect(result.user?.id).toBe('user-1')
    expect(result.user?.email).toBe('a@b.com')
  })

  it('returns null when no user is authenticated', async () => {
    mockGetUserResult = { data: { user: null } }
    const result = await getUser()
    expect(result.user).toBeNull()
  })
})

// ── sendPasswordReset ─────────────────────────

describe('sendPasswordReset', () => {
  it('returns ok: true on success', async () => {
    mockResetPasswordResult = { error: null }
    const result = await sendPasswordReset('a@b.com')
    expect(result.ok).toBe(true)
  })

  it('validates the email before calling Supabase', async () => {
    const result = await sendPasswordReset('notanemail')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/valid email/)
  })

  it('normalises the email before validation', async () => {
    mockResetPasswordResult = { error: null }
    const result = await sendPasswordReset('  ALICE@EXAMPLE.COM  ')
    expect(result.ok).toBe(true)
  })

  it('maps rate-limit error', async () => {
    mockResetPasswordResult = {
      error: makeAuthError({ code: 'over_email_send_rate_limit' }),
    }
    const result = await sendPasswordReset('a@b.com')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Too many requests/)
  })

  it('maps 5xx error', async () => {
    mockResetPasswordResult = {
      error: makeAuthError({ status: 500 }),
    }
    const result = await sendPasswordReset('a@b.com')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/went wrong on our end/)
  })
})
