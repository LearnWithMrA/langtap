# LangTap - DevOps

Version 1.0 | April 2026
Domain: Deployment, environments, Vercel configuration, CI, local development,
migrations, and the pre-deployment checklist.
Reference: LangTap_Planning.md Section 7.
Owner document: CLAUDE.md
Related: docs/SECURITY.md (key rules, pre-deployment checklist)

Read this document before making any deployment, changing environment variables,
or running database migrations.

---

## 1. Deployment Platform

LangTap is deployed on Vercel. Vercel is the native platform for Next.js, built
by the same team, and requires zero configuration to deploy a Next.js app.

Vercel auto-detects Next.js and deploys it. Git push to the main branch and it is live. Automatic scaling handles traffic spikes. The free tier includes 100GB bandwidth and 100k function invocations.

The deployment workflow:
```
Push to feature branch -> Vercel preview deployment (automatic)
Open pull request     -> Preview URL generated, shareable for review
Merge to main         -> Vercel production deployment (automatic)
```

No manual deployment steps are needed. Merging to `main` is the deployment action.

---

## 2. Environments

LangTap uses two environments. Each has its own Supabase project and its own
set of environment variables in Vercel.

| Environment | Branch | Supabase project | URL |
|---|---|---|---|
| Development | local only | local Supabase CLI | localhost:3000 |
| Production | main | production project | langtap.app (TBD) |

A staging environment (separate Supabase project, non-main Vercel branch) is
recommended before the first public launch but is not required during development.
Add it when the app is ready for external testers.

Never run migrations directly against the production Supabase project without
first testing them locally. Production schema changes are one-way and hard to
reverse.

---

## 3. Environment Variables

### 3.1 Variable reference

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (never expose) |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret key (never expose) |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Canonical URL for auth redirects |

### 3.2 Where variables are set

**Local development:** `.env.local` at the project root. Never committed.

**Vercel (production and preview):** Set in the Vercel dashboard under
Project Settings > Environment Variables. Set each variable for the correct
environment scope (Production, Preview, Development) separately.

Use the Vercel CLI to pull variables to local development after setting them
in the dashboard:

```bash
vercel env pull .env.local
```

### 3.3 Variable naming rules

- Variables used in the browser must have the `NEXT_PUBLIC_` prefix.
  Next.js bundles them into the client build.
- Variables without the prefix are server-only. They are never sent to the browser.
- Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) must never
  have the `NEXT_PUBLIC_` prefix. If they do, they are exposed in the browser bundle.
- Vercel system variables are set automatically: `VERCEL_ENV` (`production`,
  `preview`, `development`), `VERCEL_URL` (deployment URL).

### 3.4 .env files in the project

```
.env.local         <- local secrets, never committed (.gitignore)
.env.example       <- template with all variable names, empty values, committed
```

No other `.env` files are needed. Do not create `.env.production` or
`.env.staging` files in the repo. Environment-specific values are set in the
Vercel dashboard, not in committed files.

---

## 4. Local Development Setup

First-time setup for a new machine:

```bash
# 1. Clone the repo
git clone https://github.com/your-username/langtap.git
cd langtap

# 2. Install dependencies
npm install

# 3. Start local Supabase
npx supabase start

# 4. Pull environment variables (requires Vercel CLI and project link)
vercel env pull .env.local
# Or manually copy .env.example to .env.local and fill in local Supabase values

# 5. Apply migrations to local Supabase
npx supabase db reset

# 6. Start the dev server
npm run dev
```

Open http://localhost:3000.

### 4.1 Local Supabase

The Supabase CLI runs a full local Supabase stack in Docker. This gives a
completely isolated local database with the same schema as production.

> **Vitest environment note:** The default test environment is `happy-dom` (switched from jsdom in Sprint 2 due to jsdom 26.x hanging indefinitely in vitest worker threads under Node.js v24). Engine test files run in happy-dom by default. Component and hook test files should also use happy-dom. The `pool: 'forks'` config option is set to prevent zombie worker processes if a test hangs. Do not switch back to jsdom or threadpool without testing on Node 24 first.

Useful commands:

```bash
npx supabase start --exclude storage-api,logflare
                            # Start local Supabase (storage-api and logflare
                            # excluded - not needed for LangTap, and both
                            # have container health issues on some Mac setups)
npx supabase stop           # Stop local Supabase
npx supabase db reset       # Reset local DB and re-apply all migrations
npx supabase status         # Show local service URLs and keys
npx supabase db diff        # Show unapplied schema changes
npx supabase gen types typescript --local > types/database.types.ts
                            # Regenerate TypeScript types from local schema
```

The local Supabase URL and anon key are shown by `npx supabase status`.
Use these in `.env.local` for local development. Do not use production keys locally.

---

## 5. Database Migrations

All schema changes go through SQL migration files in `supabase/migrations/`.

### 5.1 Creating a migration

```bash
npx supabase migration new create_mastery_table
# Creates supabase/migrations/20260401120000_create_mastery_table.sql
```

Write the SQL in the generated file. Every migration must include:
1. The table creation or schema change
2. The RLS enable statement (if a new table)
3. All RLS policies (if a new table)
4. Any required indexes

### 5.2 Applying migrations locally

```bash
npx supabase db reset
# Drops and recreates the local database, then applies all migrations in order
```

### 5.3 Applying migrations to production

Only run this when the migration has been tested locally and reviewed.

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

This applies any unapplied migrations to the linked Supabase project.

Rules:
- Never edit a migration file after it has been applied anywhere.
  Create a new migration instead.
- Never run `db push` to production without first testing locally with `db reset`.
- Never run destructive migrations (drop table, drop column) without explicit
  owner approval. Flag the need and wait.
- Never run any migration during a production deployment. Run migrations
  separately and verify before deploying new code that depends on the schema change.

### 5.4 TypeScript types from schema

After any migration, regenerate the TypeScript types:

```bash
npx supabase gen types typescript --local > types/database.types.ts
```

Commit the updated types file. This keeps the TypeScript types in sync with the
database schema and catches type mismatches at compile time.

---

## 6. Vercel Configuration

### 6.1 vercel.json

A minimal `vercel.json` is kept at the project root for explicit configuration:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

No region configuration needed. Vercel automatically distributes to the nearest
edge based on user location.

### 6.2 Preview deployments

Every branch push and pull request gets a unique preview URL from Vercel.
Preview deployments use their own environment variables scoped to the Preview
environment in the Vercel dashboard.

Preview deployments should use the same Supabase project as development, not
production. Set the Preview environment variables in Vercel to point to the
development Supabase project.

### 6.3 Build script

Add a pre-deployment check to the build script in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "check": "npm run lint && npm run type-check && npm run test",
    "prebuild": "npm run check"
  }
}
```

The `prebuild` script runs lint, type-check, and tests before every build.
If any of these fail, the build fails and the deployment does not proceed.
This prevents broken code from reaching production.

---

## 7. CI Checks

Vercel runs the build on every push. The `prebuild` script in Section 6.3
ensures lint, type checking, and tests run as part of every deployment.

For additional CI, a GitHub Actions workflow can be added to run checks on
pull requests before merging. This is recommended but not required for Phase 1.

A basic workflow when ready:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check
```

---

## 8. Monitoring

Vercel provides basic monitoring out of the box:

- **Function logs:** Vercel dashboard > Deployments > Functions. Shows server
  component and route handler logs.
- **Core Web Vitals:** Vercel Analytics tracks LCP, CLS, and INP from real users.
  Enable in the Vercel dashboard under Analytics.
- **Error tracking:** Add a basic error boundary at the app level (already in
  `app/error.tsx`). For production error tracking, consider adding Sentry in a
  later sprint.

Target Core Web Vitals for LangTap:
- LCP (Largest Contentful Paint): under 2.5 seconds
- CLS (Cumulative Layout Shift): under 0.1
- INP (Interaction to Next Paint): under 200ms

The practice screen is the most performance-critical page. It must feel
instantaneous. Avoid any loading states or layout shifts during the game loop.

---

## 9. Pre-Deployment Checklist

Run through this before merging to main (before every production deployment).

### Code quality
- [ ] `npm run check` passes locally (lint, type-check, tests all green)
- [ ] No `console.log` statements in production code
- [ ] No `any` types introduced without explanation
- [ ] No commented-out code

### Security (see docs/SECURITY.md for full checklist)
- [ ] RLS enabled on all tables
- [ ] No secret keys with `NEXT_PUBLIC_` prefix
- [ ] `.env.local` is not committed
- [ ] Next.js version is 15.2.3 or higher

### Database
- [ ] Any new migrations have been tested locally with `npx supabase db reset`
- [ ] Migrations are applied to production before the code deploy if required
- [ ] TypeScript types are regenerated after schema changes

### Vercel
- [ ] All required environment variables are set in the Vercel dashboard for
      the Production environment
- [ ] The production Supabase URL and keys are set (not the local/development ones)
- [ ] Preview environment variables point to the development Supabase project

---

## 10. What the AI Must Not Do

- Never run `supabase db push` against production without owner confirmation.
- Never edit a migration file that has already been applied.
- Never commit `.env.local` or any file containing real secret values.
- Never create a `.env.production` file in the repo with real values.
- Never change the `main` branch deployment configuration without owner approval.
- Never add a new environment variable without adding it to `.env.example` too.
- Never skip the `prebuild` check by bypassing the build script.

---

*This document is the authoritative reference for all deployment and infrastructure decisions.*
*If a deployment step conflicts with this document, this document wins.*
*Update this document before changing the deployment process or adding a new environment.*
