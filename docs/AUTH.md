# LangTap - Auth

Version 1.0 | April 2026
Domain: Authentication flow, session management, guest mode, onboarding,
route protection, and middleware.
Reference: LangTap_Planning.md Section 5.1.
Owner document: CLAUDE.md
Related: docs/BACKEND.md (profile schema, trigger), docs/SECURITY.md (RLS, key rules)

Read this document before working on sign-up, log-in, onboarding, middleware,
or any route that requires a user session.

---

## 1. Auth Stack

| Concern | Tool |
|---|---|
| Auth provider | Supabase Auth (email and password) |
| Session storage | HTTP-only cookies via `@supabase/ssr` |
| Token flow | PKCE (default in `@supabase/ssr`) |
| Session refresh | Next.js middleware |
| Route protection | Middleware + server-side session check |

Sessions are stored in HTTP-only cookies, not localStorage. This is more
secure (immune to XSS) and works correctly with Next.js SSR. The `@supabase/ssr`
package handles cookie read/write automatically.

Do not use the legacy `@supabase/auth-helpers-nextjs` package. Use `@supabase/ssr`.

---

## 2. Supabase Client Setup

Two separate Supabase clients are needed: one for browser (client components),
one for server (server components, route handlers, middleware).

```ts
// services/supabase-browser.ts
// Used in client components and hooks
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```ts
// services/supabase-server.ts
// Used in server components, server actions, and route handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component. Safe to ignore if middleware
            // is handling session refresh.
          }
        },
      },
    }
  )
}
```

Critical rule: always initialise the server Supabase client inside the request
handler function, never at module level. A module-level client on Vercel's
infrastructure can persist between requests from different users and leak one
user's session into another user's request.

---

## 3. Middleware

Next.js middleware runs on every request. Its job in LangTap is to refresh
the Supabase auth token and pass the updated session to both server components
and the browser.

```ts
// middleware.ts (at project root, or /src/middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session. Do not use getSession() here.
  // getUser() makes a network request to verify the token.
  // getSession() only reads from the cookie and can be spoofed.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Auth-only routes: require a full account. Guests are redirected.
  // Source of truth for route access rules: Section 4 of this document.
  // Do not add /practice, /dojo, /settings here - guests can access those.
  const AUTHED_ONLY_ROUTES = ['/leaderboard', '/profile', '/onboarding']
  const isAuthedOnly = AUTHED_ONLY_ROUTES.some((r) => pathname.startsWith(r))

  if (!user && isAuthedOnly) {
    const url = request.nextUrl.clone()
    url.pathname = '/log-in'
    return NextResponse.redirect(url)
  }

  // Auth pages: redirect already-authenticated users to practice.
  const AUTH_PAGES = ['/sign-up', '/log-in']
  const isAuthPage = AUTH_PAGES.some((r) => pathname.startsWith(r))

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/practice'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals, API routes, the auth
    // callback (must not be intercepted during PKCE exchange), and static
    // assets. Keeping this narrow avoids unnecessary getUser() network
    // calls on every asset request.
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
```

Important: middleware is not a security boundary. It can be bypassed. Always
verify the session server-side inside any server component or route handler that
serves sensitive data. Never rely on middleware alone to protect data.

---

## 4. Route Protection Rules

| Route group | Access rule |
|---|---|
| `/` (landing page) | Public. No auth required. |
| `/(auth)/sign-up` | Public. Redirect to practice if already logged in. |
| `/(auth)/log-in` | Public. Redirect to practice if already logged in. |
| `/(onboarding)/*` | Authenticated only. Redirect to log-in if not. |
| `/(main)/practice` | Guest or authenticated. Guests see guest banner. |
| `/(main)/dojo` | Guest or authenticated. |
| `/(main)/library` | Guest or authenticated. Shows under-construction in Phase 1. |
| `/(main)/leaderboard` | Authenticated only. Guests see a sign-up prompt. |
| `/(main)/profile` | Authenticated only. **Temporarily unprotected in Sprint 2B for visual shell testing. Restore to auth-only before Sprint 3.** |
| `/(main)/settings` | Guest or authenticated. |
| `/(main)/credits` | Public. |

Guest users can access the practice screen, Dojo, and Settings.
Leaderboard and Profile require a full account.

---

## 5. Sign-Up Flow

1. User lands on `/sign-up`.
2. User enters: username (not a real name), email, password.
3. Client-side validation:
   - Username: 3-20 characters, alphanumeric and underscores only, no spaces.
   - Email: valid format.
   - Password: minimum 8 characters. Show a strength indicator. Encourage randomness.
4. On submit, call `auth.service.ts signUp()`.
5. Supabase creates the user in `auth.users`.
6. The database trigger `on_auth_user_created` creates a row in `public.profiles`
   with a default username.
7. The `signUp` service then updates the profile with the chosen username.
8. On success, redirect to `/onboarding/step-1`.
9. On error, show a human-readable message. Never show the raw Supabase error.

Common error messages to map:
- `User already registered`: "An account with this email already exists."
- `Password should be at least 6 characters`: "Please choose a longer password."
- Any network or unexpected error: "Something went wrong. Please try again."

Email confirmation: disabled in Phase 1 for simplicity. Users log in immediately
after sign-up. Enable in a later sprint if required.

---

## 6. Log-In Flow

1. User lands on `/log-in`.
2. User enters email and password.
3. On submit, call `auth.service.ts signIn()`.
4. On success:
   - If the user has no profile (edge case), create one and redirect to onboarding.
   - If the user has completed onboarding, redirect to `/practice`.
   - If the user has not completed onboarding, redirect to the first incomplete step.
5. On error, show a mapped error message. Never show raw Supabase errors.

Onboarding completion is tracked by a `onboarding_complete` boolean field on
the `profiles` table (add to the schema in BACKEND.md on the next migration).

---

## 7. Sign-Out Flow

Sign-out is handled server-side via a route handler to ensure the session cookie
is properly cleared.

```ts
// app/api/auth/sign-out/route.ts
import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL!))
}
```

The sign-out button in the Profile screen calls this route via a form POST,
not a client-side fetch. This ensures the cookie is cleared on the server before
the redirect.

---

## 8. Guest Mode

Guest users enter the app from the landing page without creating an account.

**What they can access:**
- Practice screen (all input modes)
- Dojo screen (read-only mastery progress)
- Settings screen
- Credits screen

**What they cannot access:**
- Leaderboard (they see a sign-up prompt)
- Profile screen (they see a sign-up prompt)

**How their state is stored:**
All game state (mastery scores, word counters, manual unlocks, settings) is stored
in `localStorage` via Zustand persist middleware. Nothing goes to Supabase.

**Guest banner:**
A persistent banner is shown on every screen the guest can access:

> "Your progress will be lost when you close this tab. Create a free account to
> save it."

The banner has a "Create account" link and a dismiss button. Dismissal hides the
banner for the current browser session only (stored in React state, not persisted).

**Guest state on sign-up:**
When a guest creates an account, their local state is migrated to Supabase
immediately after auth completes. See BACKEND.md Section 3.3 for the full
migration flow.

---

## 9. Onboarding Flow

Shown once after sign-up. Never shown again after completion.
Tracked by `onboarding_complete: boolean` on the user's profile.

Three steps. The original notification preferences step was deferred to a
contextual prompt after the user's first practice session (Sprint 10). This
reduces time-to-first-practice and follows the just-in-time permission
pattern. Full visual and interaction spec: UX_DESIGN.md Section 5.

### Step 1 - JLPT Self-Assessment (`/onboarding/step-1`)

- Show N5 through N1 with a short description of each level.
- User selects one level. This sets `kotoba_jlpt_level` on the profile.
  The `kanji_jlpt_level` field is vestigial (kanji removed from scope per
  Sprint Board v1.1) and is not set during onboarding.
- Default: N5 pre-selected.
- Message shown: "Words below this level will be marked as mastered. To
  reset, change your level in Settings."
- Next button saves the selection and navigates to Step 2.
- Can be changed later in Settings.

### Step 2 - Early Character Unlock (`/onboarding/step-2`)

- Show seion characters only (46 hiragana + 46 katakana = 92 total).
  Dakuon and yoon are excluded; the Dojo handles those stages.
- User taps characters they already know to unlock them immediately.
- A "Skip" link is always visible and prominent.
- Selections are stored as character IDs in the onboarding store (Sprint
  2B: localStorage via Zustand persist). Sprint 3 migrates these to
  `manual_unlocks` rows in Supabase.
- Confirmation modal before applying: "Unlock [n] characters?"

### Step 3 - Input Mode Selection (`/onboarding/step-3`)

- Show three options: Type, Tap, Swipe.
- Each option has an icon and a one-line description.
- Default: Type pre-selected.
- Selection saves `input_mode` to the profile.
- "Start practising" button completes onboarding and navigates to
  `/practice`.
- After this step, `onboarding_complete` is set to `true`.

### Deferred: Notification Prompt (Sprint 10)

After the user's first completed practice session, a contextual interstitial
prompts: "Want daily practice reminders?" with a toggle. If enabled, sets
`notifications_enabled: true` on the profile. Appears once per user. See
UX_DESIGN.md Section 5.6 for full spec.

---

## 10. Password Reset Flow

1. User clicks "Forgot password" on the log-in screen.
2. They enter their email.
3. Call `supabase.auth.resetPasswordForEmail()` with a redirect URL pointing to
   `/auth/callback?next=/profile/update-password`.
4. Supabase sends a reset email.
5. User clicks the link, lands on `/auth/callback`, which exchanges the token
   for a session and redirects to the update password screen.
6. User sets a new password.

The `/auth/callback` route handler:

```ts
// app/auth/callback/route.ts
import { createServerSupabaseClient } from '@/services/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/practice'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/log-in?error=auth_callback_failed`)
}
```

---

## 11. Auth Service

All auth operations are in `services/auth.service.ts`. Components and hooks
never call `supabase.auth.*` directly.

```ts
// services/auth.service.ts

type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string }

async function signUp(
  email: string,
  password: string,
  username: string
): Promise<AuthResult>

async function signIn(
  email: string,
  password: string
): Promise<AuthResult>

async function getUser(): Promise<{ user: User | null }>

async function sendPasswordReset(email: string): Promise<{ ok: boolean }>
```

Errors from Supabase are caught in the service and mapped to plain English
strings before being returned. Raw Supabase error messages never reach the UI.

---

## 12. Security Notes Specific to Auth

**Never use `getSession()` in middleware or server components.**
`getSession()` only reads from the cookie and does not verify the token with
Supabase. It can be spoofed. Always use `getUser()`, which makes a network
request to verify the token.

**Middleware is not a security boundary.**
The middleware redirect protects UX but cannot be relied on for data security.
A determined attacker can bypass middleware. All data access must be protected
by RLS at the database level, regardless of what the middleware does.

**Next.js version must be 15.2.3 or higher.**
A critical vulnerability (CVE-2025-29927, CVSS 9.1) in Next.js versions below
15.2.3 allows complete bypass of middleware security checks by manipulating the
`x-middleware-subrequest` header. Never deploy LangTap on a version below 15.2.3.
Check the version before every deployment.

**HTTP-only cookies, not localStorage, for session tokens.**
The `@supabase/ssr` package handles this automatically. Never store the
Supabase session or JWT in localStorage. localStorage is accessible to JavaScript
and vulnerable to XSS. HTTP-only cookies are not.

---

## 13. What the AI Must Not Do

- Never call `supabase.auth.*` directly from a component. Use `auth.service.ts`.
- Never use `getSession()` in middleware or server-side code. Use `getUser()`.
- Never initialise the server Supabase client at module level.
- Never store session tokens in localStorage.
- Never show raw Supabase error messages in the UI.
- Never rely on middleware alone to protect sensitive data.
- Never deploy on Next.js below version 15.2.3.
- Never skip the `/(onboarding)` redirect check. A user without a completed
  profile must be sent to onboarding before reaching the practice screen.

---

*This document is the authoritative reference for all authentication decisions.*
*If auth code conflicts with this document, the document wins.*
*Update this document before changing any auth flow or adding a new auth provider.*
