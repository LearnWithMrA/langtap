# LangTap - Security

Version 1.0 | April 2026
Domain: RLS policies, key management, data protection, input validation,
known vulnerabilities, and the security checklist.
Reference: LangTap_Planning.md, docs/BACKEND.md, docs/AUTH.md.
Owner document: CLAUDE.md

Read this document before touching anything that involves keys, RLS policies,
user data, or environment variables.

---

## 1. Security Model Overview

LangTap's security is built in layers. Each layer provides protection
independently. No single layer is assumed to be perfect.

```
Layer 1: RLS (database level)
  Every table in the public schema has RLS enabled.
  Users can only read and write their own rows.
  This holds even if every other layer fails.

Layer 2: Auth (session level)
  HTTP-only cookies. Verified server-side with getUser().
  Service role key never touches the client.

Layer 3: Middleware (route level)
  Redirects unauthenticated users away from protected routes.
  NOT a security boundary. Defense-in-depth only.

Layer 4: Input validation (application level)
  All user input is validated before it reaches the database.
  Raw Supabase errors are never shown to users.

Layer 5: Environment isolation (infrastructure level)
  Separate Supabase projects per environment.
  Secrets in environment variables, never in code.
```

The most important layer is Layer 1. If RLS is correctly configured, a
misconfiguration in any other layer cannot expose another user's data.

Real-world reminder: In January 2026, a platform exposed
1.5 million API keys because their Supabase database had Row Level Security
disabled. Anyone with basic technical knowledge could access email addresses,
authentication tokens, and API keys for every user on the platform. Two SQL
statements would have prevented the entire incident. Do not skip RLS.

---

## 2. API Key Rules

LangTap uses two Supabase keys. Their rules are absolute.

### 2.1 Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

- Safe to expose in client-side code. Designed for this purpose.
- Prefixed with `NEXT_PUBLIC_` so Next.js bundles it into the browser build.
- Protected by RLS. On its own it grants no data access beyond what policies allow.
- Used by: `services/supabase-browser.ts`, `middleware.ts`.

### 2.2 Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

- Bypasses all RLS. Grants full database access.
- Must never appear in any file that runs in the browser.
- Must never be prefixed with `NEXT_PUBLIC_`.
- Used only in: server-side route handlers and server actions.
- In LangTap Phase 1, it is used only by the Stripe webhook handler.
- If this key is ever committed to the repository, rotate it immediately.

### 2.3 Environment Variable File Rules

```
# .env.local - never committed, always in .gitignore
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only, never public
STRIPE_SECRET_KEY=sk_live_...                      # server only, never public
NEXT_PUBLIC_SITE_URL=https://langtap.app
```

```
# .env.example - committed to the repo, values are empty
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=
```

`.env.local` is always in `.gitignore`. Verify this before the first commit.
If `.env.local` is ever accidentally committed, rotate all keys in it immediately.

---

## 3. RLS Policy Reference

All tables have RLS enabled. Policies follow the same pattern throughout.

The `(select auth.uid())` wrapping on all policy conditions is intentional and
required. It instructs the query planner to cache the result rather than
re-evaluating it for every row, which can improve performance by over 100x on
large tables.

### 3.1 Standard user-owns-row pattern

Used by: `mastery`, `word_counters`, `manual_unlocks`, `profiles` (update).

```sql
-- SELECT
create policy "Users read own rows"
  on public.table_name for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- INSERT
create policy "Users insert own rows"
  on public.table_name for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE
create policy "Users update own rows"
  on public.table_name for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

Note: UPDATE policies must include both `using` and `with check`. PostgreSQL
needs to read the existing row (using) before updating it, and validate the
new data (with check). Without both clauses, the policy is incomplete.

### 3.2 Public read pattern

Used by: `leaderboard`.

```sql
create policy "Public read"
  on public.leaderboard for select
  to authenticated, anon
  using (true);
```

### 3.3 No DELETE policies

LangTap does not expose DELETE operations to the client for any table.
Data is never deleted via the client API. Deletion is a server-side-only
operation performed manually by the owner or via a server action with the
service role key. This reduces the attack surface for accidental or malicious
data loss.

### 3.4 RLS verification query

Run this in the Supabase SQL editor to verify RLS is enabled on all tables
before any production deployment:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every row in the result must have `rowsecurity = true`. If any row shows
`false`, stop and enable RLS on that table before proceeding.

---

## 4. Data Protection Rules

### 4.1 Minimum data collection

LangTap stores only what is necessary to operate:
- Username (chosen by user, not a real name)
- Email (stored by Supabase Auth, not in `profiles`)
- JLPT level preference
- Input mode preference
- Mastery scores (integers, no personal content)
- Word counters (integers, no personal content)
- Settings toggles (booleans)
- Leaderboard score (integer, tied to username only)

No real names are stored. No profile photos are stored. No location data is
collected. No device fingerprinting is performed.

### 4.2 Username privacy

Usernames appear on the leaderboard and are therefore public. Users are
explicitly told during sign-up that their username will be visible to others
and should not be their real name. The UI copy reinforces this.

### 4.3 No sensitive data in logs

Never log:
- Auth tokens or session cookies
- Raw Supabase error messages (may contain schema details)
- User email addresses
- Any personally identifiable information

Client-side `console.log` statements must be removed before production.
The `no-console` ESLint rule enforces this.

---

## 5. Input Validation

All user-provided input is validated before reaching the database.
Never trust client-supplied data.

### 5.1 Validation rules by field

| Field | Rule |
|---|---|
| Username | 3-20 chars, `^[a-zA-Z0-9_]+$`, no spaces, unique |
| Username change | Server enforces 30-day cooldown via `username_changed_at` |
| Email | Valid email format |
| Password | Minimum 8 characters |
| JLPT level | Must be one of: N5, N4, N3, N2, N1 |
| Input mode | Must be one of: tap, type, swipe |
| Character ID | Must exist in `data/kana/characters.ts` |
| Word ID | Must exist in the word bank for the user's JLPT level |
| Mastery score delta | Must be a positive integer, max 1 per event |
| Word counter | Must be 0-5 |

### 5.2 Where validation happens

- Username, email, password: validated client-side for UX, then validated again
  in `auth.service.ts` before calling Supabase.
- All enum fields (JLPT level, input mode): validated against the TypeScript
  union type. If the type system is strict, invalid values cannot be submitted.
- Character IDs and word IDs: validated against the static data files during
  the sync operation in the service layer.
- RLS policies provide a final database-level check that `user_id` matches
  the authenticated user. Client-supplied `user_id` values are never trusted.

### 5.3 Never trust client-supplied user_id

RLS policies always use `auth.uid()` to identify the current user. The client
never sends a `user_id` field that the database trusts. Even if a malicious
client submits a different `user_id`, the RLS policy will reject it.

```sql
-- Correct: uses auth.uid() from the verified JWT
with check ((select auth.uid()) = user_id)

-- Never do this: trusts client-provided user_id
with check (user_id = current_setting('app.current_user_id'))
```

### 5.4 Account Deletion Safety

The delete account flow on the Profile screen requires the user to type
`delete-[username]` as confirmation. This prevents accidental deletion.
Server-side validation must confirm:
- The authenticated user's session is valid
- The typed confirmation matches the account being deleted
- All user data is cascade-deleted via the `on delete cascade` foreign
  key constraints on all tables

---

## 6. Known Vulnerabilities and Mitigations

### 6.1 CVE-2025-29927 - Next.js Middleware Bypass

**Severity:** Critical (CVSS 9.1)
**Affected versions:** Next.js 11.1.4 through 15.2.2
**Fixed in:** Next.js 15.2.3+

Attackers can bypass middleware security checks entirely by sending a request
with the `x-middleware-subrequest` header set to a specific value. This would
allow unauthenticated access to any route protected only by middleware.

**LangTap mitigation:**
- Always run Next.js 15.2.3 or higher. Check before every deployment.
- Middleware is not relied upon as a security boundary. All data access is
  protected by RLS at the database level regardless of what middleware does.
- Vercel automatically strips the `x-middleware-subrequest` header on their
  infrastructure. Self-hosted deployments must configure a WAF or reverse proxy
  to strip this header.

### 6.2 Session Leakage on Vercel (Supabase SSR)

Vercel's infrastructure can keep server instances warm and reuse them across
requests. A Supabase client initialised at module level could persist between
requests from different users, causing one user's session to leak into another
user's request.

**LangTap mitigation:**
- The server Supabase client is always initialised inside the request handler
  function, never at module level. See docs/AUTH.md Section 2.

### 6.3 XSS and Session Tokens

If session tokens are stored in localStorage, an XSS attack can steal them.

**LangTap mitigation:**
- Session tokens are stored in HTTP-only cookies managed by `@supabase/ssr`.
- HTTP-only cookies are not accessible to JavaScript.

### 6.4 Service Role Key Exposure

If the service role key is bundled into client-side code (e.g. via a
`NEXT_PUBLIC_` prefix), it bypasses all RLS and grants full database access.

**LangTap mitigation:**
- `SUPABASE_SERVICE_ROLE_KEY` never has a `NEXT_PUBLIC_` prefix.
- ESLint rule added to catch accidental `NEXT_PUBLIC_SERVICE` variable names.
- GitHub secret scanning is enabled. Supabase auto-revokes leaked keys detected
  in public repositories.

---

## 7. Security Checklist

Run through this checklist before every production deployment.

### Database
- [ ] RLS is enabled on all tables in the public schema (run the verification
      query in Section 3.4)
- [ ] Every table has both SELECT and write policies defined
- [ ] No table has a DELETE policy exposed to the client
- [ ] Indexes exist on all `user_id` columns used in RLS policies
- [ ] The profile creation trigger exists and is active

### Keys and Secrets
- [ ] `.env.local` is in `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix
- [ ] `STRIPE_SECRET_KEY` has no `NEXT_PUBLIC_` prefix
- [ ] No hardcoded secrets anywhere in the codebase (`git grep` for key values)
- [ ] Vercel environment variables are set for production (not just local)

### Next.js Version
- [ ] Next.js version is 15.2.3 or higher (`npm list next`)
- [ ] No other critical CVEs affecting the current version

### Auth
- [ ] `getUser()` is used in middleware, not `getSession()`
- [ ] Server Supabase client is initialised inside request handlers, not at
      module level
- [ ] Sign-out clears the session cookie server-side
- [ ] Password reset flow points to the correct callback URL

### Code
- [ ] No `console.log` statements in production code
- [ ] No raw Supabase error messages returned to the UI
- [ ] No `any` types that could mask a security issue
- [ ] Input validation runs before any database write

---

## 8. What the AI Must Not Do

- Never create a table without enabling RLS in the same migration.
- Never write an RLS policy without the `(select auth.uid())` wrapping.
- Never use bare `auth.uid()` in an RLS policy.
- Never trust a client-supplied `user_id`. Always use `auth.uid()` in policies.
- Never expose the service role key to the client.
- Never prefix the service role key or Stripe secret key with `NEXT_PUBLIC_`.
- Never add a console.log that outputs user data, tokens, or error messages.
- Never return a raw Supabase error message to the UI.
- Never add a DELETE policy to any table without explicit owner approval.
- Never deploy without running the pre-deployment security checklist above.

---

*This document is the authoritative reference for all security decisions.*
*If code conflicts with this document, this document wins.*
*Update this document whenever a new vulnerability is identified or a security
decision changes.*
