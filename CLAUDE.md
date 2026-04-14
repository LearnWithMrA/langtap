# LangTap - CLAUDE.md

Version 1.2 | April 2026

This file is read at the start of every Cursor or Claude Code session.
Follow everything here exactly.
When an architectural decision changes, update this file and record it in CHANGELOG.md.

**File size rule:** Keep this file under 200 lines. Beyond 200 lines, adherence drops and context
is wasted. Detailed content lives in `docs/` sub-documents. Reference them with `@docs/FILENAME.md`
imports rather than copying content here. This file is the index. The sub-documents are the detail.

---

## 1. Project Identity

LangTap is a web-based Japanese typing fluency app.
The goal is to build speed and comfort with typing Japanese characters on a physical
keyboard or a mobile swipe keyboard. It is not a language teaching app. Learning is
a by-product of repetition.

Current phase: **Phase 1 - Kana (MVP).**
Do not build Phase 2, 3, or 4 features unless explicitly instructed.
The phase boundary is absolute. If a task touches Kotoba, Kanji, or multi-language
support, stop and ask before proceeding.

Full vision and feature detail: `LangTap_Planning.md`
Sprint board and task list: `LangTap_Sprints.md`

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, file-based routing) |
| Language | TypeScript (strict mode, no `any`) |
| Styling | Tailwind CSS (custom tokens defined in `theme/`) |
| State management | Zustand |
| Backend and auth | Supabase (auth, database, real-time, storage) |
| Payments | Stripe (infrastructure only in Phase 1 - no active paywall) |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |
| Linting | ESLint 9 (flat config) + Prettier |

Do not introduce a new library or tool without asking first.
Do not swap one library for another without explicit approval.

---

## 3. Project Structure

```
app/                    # Pages and routes (Next.js App Router)
  (auth)/               # Auth routes: sign-up, log-in
  (onboarding)/         # Onboarding flow: steps 1-4
  (main)/               # Main app routes: practice, dojo, profile, settings, leaderboard
  layout.tsx            # Root layout
  page.tsx              # Landing page
components/             # Reusable UI components
  ui/                   # Primitive components: Button, Input, Card, Modal, ProgressBar
  layout/               # Layout components: TopBar, BottomNav, PageShell
  game/                 # Game-specific components: CharacterDisplay, InputField, FeedbackOverlay
  dojo/                 # Dojo screen components: CharacterGroup, MasteryBar, UnlockPrompt
  animation/            # Cycling character animation component
  audio/                # Audio player component
hooks/                  # Custom React hooks
stores/                 # Zustand stores (one file per domain)
services/               # Supabase client, API calls, external integrations
  supabase.ts           # Supabase client initialisation (anon key only)
  auth.service.ts       # Auth operations
  profile.service.ts    # User profile read/write
  mastery.service.ts    # Mastery score sync to Supabase
  leaderboard.service.ts# Leaderboard read/write
engine/                 # Game logic (pure functions, no UI, no side effects)
  selection.ts          # Character and word selection algorithm
  mastery.ts            # Mastery score logic
  unlock.ts             # Unlock progression sequence
  counter.ts            # Word counter logic
  distance.ts           # Distance/progress mechanic
theme/                  # Design tokens
  colors.ts             # All colour values
  typography.ts         # Font families, sizes, weights
  spacing.ts            # Spacing scale
types/                  # TypeScript type definitions (one file per domain)
data/                   # Static data: kana sets, word banks, mnemonics
  kana/                 # Kana character data (seion, dakuon, yoon)
  words/                # Word bank files (N5-N1, keyed by kana character)
  audio/                # Audio file manifests (not the audio files themselves)
public/                 # Static assets served by Next.js
  audio/                # Kana character and lo-fi audio files
  animation/            # Cycling animation assets
docs/                   # Sub-documents (read these before working in their domain)
  ARCHITECTURE.md
  FRONTEND.md
  BACKEND.md
  AUTH.md
  SECURITY.md
  GAME_DESIGN.md
  CONTENT.md
  DEVOPS.md
CHANGELOG.md            # Session-by-session record of all changes
```

Only route files and layouts belong in `app/`. Components, hooks, stores, services,
engine logic, and data must live outside `app/`.

---

## 4. Sub-Document Reading Rule

Before working in any domain, read the relevant sub-document first.

| Domain | Read this first |
|---|---|
| UI, layout, components, styling | `docs/FRONTEND.md` |
| Supabase, schema, API, data flow | `docs/BACKEND.md` |
| Auth, onboarding, guest mode | `docs/AUTH.md` |
| RLS, keys, security | `docs/SECURITY.md` |
| Mastery, selection, unlock, counters | `docs/GAME_DESIGN.md` |
| Kana data, words, audio, mnemonics | `docs/CONTENT.md` |
| Deployment, Vercel, CI, environments | `docs/DEVOPS.md` |
| Folder structure, patterns, conventions | `docs/ARCHITECTURE.md` |

If a sub-document does not yet exist, say so and ask before proceeding.
Do not assume. Do not guess.

---

## 5. Architecture Rules

- The `engine/` folder contains pure functions only. No React, no Zustand, no Supabase
  calls, no side effects. Engine logic must be fully testable in isolation.
- All Supabase calls go through `services/`. Never call Supabase directly from a
  component, hook, or store.
- All global state goes through Zustand stores in `stores/`. One store per domain.
- All static game data (kana characters, word banks, mnemonics) lives in `data/`.
  It is imported directly - not fetched from Supabase.
- All colours come from `theme/colors.ts`. No hardcoded colour values anywhere.
- All spacing values come from `theme/spacing.ts` or Tailwind tokens. No hardcoded
  pixel values.
- All user-facing strings must use constants or a future i18n setup. No hardcoded
  strings in components.
- No inline styles. Use Tailwind utility classes or theme tokens only.
- Functional components only. No class components.
- Named exports only for components. No default exports for components.
- Every new screen must handle three states: loading, error, and empty.
  A screen that only handles the happy path is not complete.

---

## 6. Code Quality Rules

- TypeScript strict mode is always on. No `any`. No `@ts-ignore` without a written
  explanation in a comment directly above the line.
- Always use `const` over `let` unless reassignment is required.
- Always type function return values explicitly.
- Prefer `async/await` over `.then()` chains.
- Always handle errors explicitly. Never swallow an error silently.
- Keep components small and focused. If a component exceeds 150 lines, split it.
- No commented-out code in any file that is committed.
- Write a brief comment above any non-obvious logic.
- Every new service, store, and non-trivial hook must have tests.
- Every new screen must cover at minimum: happy path, loading state, error state.

---

## 7. File and Code Structure Rules

Code is written like a well-structured publication. Every file has a clear identity.
Every section within a file is labelled. Every function has a single, stated purpose.

### File header

Every file must begin with a header comment block:

```ts
// ─────────────────────────────────────────────
// File: engine/selection.ts
// Purpose: Weighted character and word selection algorithm.
//          Selects the next character to practise based on mastery scores
//          and word counter values. Pure functions only. No side effects.
// Depends on: engine/mastery.ts, data/kana/, data/words/
// ─────────────────────────────────────────────
```

### Section labels

Group related logic within a file using section labels:

```ts
// ── Types ─────────────────────────────────────

// ── Constants ─────────────────────────────────

// ── Helpers ───────────────────────────────────

// ── Main exports ──────────────────────────────
```

### Function size

If a function exceeds 40 lines, it should be split into smaller named helpers.
Each helper must have a single, clear purpose stated in a comment above it.

### Chunk size

No file should exceed 300 lines. If a file grows beyond this, split it into
logically named sub-files and re-export from an index file in that folder.

---

## 8. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (components) | `kebab-case.tsx` | `mastery-bar.tsx` |
| Files (logic, hooks, services) | `camelCase.ts` | `selectionAlgorithm.ts` |
| Files (stores) | `domain.store.ts` | `mastery.store.ts` |
| Files (services) | `domain.service.ts` | `auth.service.ts` |
| Files (engine) | descriptive, camelCase | `characterSelection.ts` |
| Components | `PascalCase` | `MasteryBar` |
| Hooks | `useHookName` | `useMastery` |
| Types and interfaces | `PascalCase` | `KanaCharacter`, `MasteryScore` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_WORD_COUNTER` |
| Zustand stores | `useDomainStore` | `useMasteryStore` |

---

## 9. Editing Rules

Edits are surgical. The goal is to change the minimum required to achieve the task.

- Do not rewrite a file when a single function needs changing.
- Do not rewrite a function when a single line needs changing.
- Identify the exact section, function, and line to be changed before making any edit.
- State what you are changing and why before making the change.
- After editing, confirm the change did not affect any other part of the file.
- Never delete a file. If a file needs to be removed, flag it to the owner with a
  clear explanation. The owner deletes it manually.
- Never delete a database table, column, or row. Flag the need to the owner.
  The owner performs all destructive database operations manually.
- Never drop or alter a Supabase RLS policy without flagging it to the owner first.

---

## 10. AI Safety Rules

These rules exist to protect the project from irreversible mistakes.

### No deletions

The AI must never delete:
- Any file in the project
- Any folder in the project
- Any Supabase table, column, row, or policy
- Any environment variable or secret

If something needs to be deleted, the AI states clearly:
> "This task requires deleting [X]. I cannot do this. Please delete it manually
> and confirm before I continue."

### Token estimation

Before beginning any task rated Large or larger (including any task that touches
more than 3 files), the AI must state:

> "Estimated scope: [N] files affected, approximately [X] tokens.
> Confirm to proceed."

Wait for explicit confirmation before starting.

For Small and Medium tasks, proceed without estimation unless the task turns out
to be larger than expected, at which case stop and re-estimate.

### Sprint boundary

Do not build anything outside the current sprint without explicit instruction.
If a task requires work that belongs to a future sprint, stop and say so.

### Phase boundary

Do not build Phase 2, 3, or 4 features. If a task touches those phases, stop and ask.

### One task per session

Where possible, complete one task per session. Do not begin a second task in the
same session without confirmation from the owner.

### Context warning

If the conversation context is running low, say so clearly:
> "Context is running low. I recommend starting a new session before continuing."

Do not continue with degraded context. It leads to mistakes.

### Strategic compaction

Compact at logical breakpoints, not arbitrarily. Good moments to compact:
- After research or exploration, before implementation begins
- After completing a sprint task, before starting the next
- After debugging a problem, before continuing feature work
- After a failed approach is abandoned, before trying a new one

Never compact mid-implementation. You will lose variable names, file paths, and
partial state that are needed to continue correctly.

Use `/compact` in Cursor or Claude Code at these breakpoints.
Use `/clear` between entirely unrelated tasks - it is free and instant.

---

## 11. Token Optimisation

Community-tested settings from production Claude Code usage. These reduce costs
without sacrificing quality. Add these to your Cursor or Claude Code settings.

**Recommended model settings:**

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  }
}
```

| Setting | Default | Recommended | Why |
|---|---|---|---|
| `model` | opus | **sonnet** | ~60% cost reduction. Handles 90%+ of coding tasks. |
| `MAX_THINKING_TOKENS` | 31,999 | **10,000** | Reduces hidden thinking cost per request by ~70%. |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50** | Compacts earlier. Better quality in long sessions. |

Switch to Opus only for deep architectural reasoning or when Sonnet is clearly
struggling with a problem. Use `/model opus` in session, then switch back.

**MCP server limit:**
Keep under 10 MCP servers enabled per project. Each MCP tool description consumes
tokens from the context window. Disable unused servers in project settings.

---

## 12. Security Rules

- Enable Supabase Row Level Security on every table before any client access.
  Never create a table that is accessible to the client without explicit RLS policies.
- Only the Supabase anon key is used on the client. The service role key is never
  exposed to the client under any circumstances.
- Never log raw Supabase error messages to the user interface.
- Never store sensitive user data beyond what is required: username, email (via Supabase
  Auth), JLPT level, input mode preference, mastery scores.
- Stripe secret keys are server-side only. Never expose them to the client.
- All environment variables are stored in `.env.local`. The `.env.local` file is
  always in `.gitignore`. Never commit secrets.

---

## 13. Session Protocol

### At the start of every session

1. Read this file in full.
2. Read `LangTap_Sprints.md` and identify the current active sprint and task.
3. Read the relevant sub-document(s) for the domain being worked on.
4. State clearly: what sprint is active, what task is being worked on, and what
   files will be affected.
5. If the task is Large or larger, state the token estimate and wait for approval.
6. If the task is Large or Epic, prefix the message with `ultrathink`. For Small and Medium tasks, use the default thinking budget.
7. Run the pre-task checklist before writing any code:

**Pre-task checklist (inspired by production SaaS Claude Code configs):**
- What is the blast radius of this change? Which files and systems does it touch?
- Does a pattern already exist in the codebase for this? Use it. Do not invent a new one.
- What is the security surface? Does this touch auth, RLS, keys, or user data?
- Does this change anything in the database schema? Flag it before proceeding.
- Is this genuinely in the current sprint, or does it belong to a future sprint?

### Codex review checkpoints

Codex is used as a manual reviewer at deliberate stage gates. It is not
the primary implementer. It is a reviewer, challenger, and parallel thinker.
Reviews on every task degrade quality. Reviews at the right moments compound value.

The review workflow is manual: copy the plan or question, paste it into Codex
(web or terminal), ask for a staff-engineer review, bring the response back
into the session. No plugin or API key required.

**Stage gates by task size:**

| Task size | Gates |
|---|---|
| Small | None. Build it. |
| Medium | Codex review on the plan before coding. One gate. |
| Large | Codex review after Claude drafts the plan. Codex review before coding begins. Two gates. |
| Epic | Codex brainstorm before breaking it down. Codex review on the breakdown. Codex review before the first sprint of work. Three gates. |

**The four stages for Large and Epic tasks:**

1. **Plan** - Claude drafts the plan. Copy it to Codex. Codex produces an
   alternative or critique. Compare and decide before any code is written.

2. **Purpose** - Before implementation, send the agreed plan to Codex.
   Codex checks for blind spots, edge cases, and risks. Resolve any concerns
   here, not mid-code.

3. **Review** - After code is written but before the task is marked Done,
   send the output to Codex. Final gate before moving on.

4. **Implement** - Code is written only after Plan and Purpose have cleared
   both Codex gates. No Large or Epic task starts coding without this.

**Prompt to use when sending to Codex:**
"Review this plan as a staff engineer. Find blind spots, edge cases, and risks."

**Never send to Codex:** secrets, environment variables, API keys, or
`.env` files of any kind. Send plan descriptions, doc sections, and
architecture questions only.

### At the end of every session

1. Run `npm run check` in full before generating the changelog entry. If it
   fails, fix all errors before closing the session. Never generate a changelog
   entry for a session that leaves the codebase in a failing state.
2. Confirm all changes made during the session.
3. Confirm tests pass (or state which tests need to be run manually).
4. Generate a CHANGELOG.md entry in the format below.
5. State clearly what the next task is (the owner will confirm at the start of
   the next session).

### CHANGELOG.md entry format

```
## [Date] - Session [N]

**Sprint:** Sprint [N] - [Sprint Name]
**Task completed:** [Task name from sprint board]
**Status:** Done / Partial / Blocked

### Changes made
- [File changed]: [What changed and why]
- [File changed]: [What changed and why]

### Tests
- [Test file]: [Pass / Fail / Written but not yet run]

### Next task
[Task name from sprint board]

### Notes
[Any decisions made, blockers encountered, or things the owner should know]
```

The owner copies this entry and pastes it into `CHANGELOG.md` manually.
The AI does not write to `CHANGELOG.md` directly.

---

## 14. Definition of Done

A task is not done until all of the following are true:

- TypeScript compiles with no errors
- ESLint passes with no warnings
- Prettier formatting is applied
- Tests pass
- Loading, error, and empty states exist and are handled (for UI tasks)
- Accessibility: all interactive elements have ARIA labels, roles, and adequate
  touch targets (minimum 44x44pt)
- No hardcoded colours, strings, spacing values, or magic numbers introduced
- File header comment is present
- Section labels are present if the file has more than one logical grouping
- The relevant sub-document is up to date if the task changed something architectural

---

## 15. What Not To Do

- Do NOT install new packages without asking first.
- Do NOT introduce new architectural patterns without approval.
- Do NOT rewrite working code unless explicitly asked.
- Do NOT use inline styles.
- Do NOT use `any` in TypeScript.
- Do NOT add features outside the current sprint.
- Do NOT add Phase 2, 3, or 4 features during Phase 1.
- Do NOT call Supabase directly from a component, hook, or store.
- Do NOT hardcode colours, spacing, or font sizes.
- Do NOT create files in locations that conflict with the project structure above.
- Do NOT delete files, folders, or database records.
- Do NOT commit `.env.local` or any file containing secrets.
- Do NOT expose the Supabase service role key to the client.
- Do NOT use class components.
- Do NOT use default exports for components.
- Do NOT leave a screen that only handles the happy path.
- Do NOT continue when context is running low. Stop and say so.
- Do NOT use em-dashes (--) anywhere in code, comments, documentation, or UI strings.
  Em-dashes give an AI-generated feel to written content. Use a plain hyphen, a colon,
  or restructure the sentence instead.

---

## 16. Key Decisions Log

| Decision | Choice | Date | Reason |
|---|---|---|---|
| Framework | Next.js 15 + React 19 | April 2026 | Standard web stack, App Router for file-based routing, Vercel deployment |
| Language | TypeScript strict | April 2026 | Type safety, maintainability |
| Styling | Tailwind CSS | April 2026 | Utility-first, pairs well with Next.js |
| State | Zustand | April 2026 | Simpler than Redux for this scale |
| Backend | Supabase | April 2026 | Auth + database + real-time in one service |
| Payments | Stripe | April 2026 | Industry standard, infrastructure only in Phase 1 |
| Deployment | Vercel | April 2026 | Native Next.js host, preview deployments |
| Testing | Vitest | April 2026 | Fast, ESM-native, compatible with React Testing Library |
| Kana audio | Word-level audio only (Kanji Alive CC BY 4.0) | April 2026 | Hearing "aka" in context is more useful than isolated "a". One source covers all phases. |
| Word audio | Kanji Alive dataset (CC BY 4.0) | April 2026 | 10,187 native speaker recordings, Phase 1 onwards |
| Game engine | Pure functions in `engine/` | April 2026 | Fully testable in isolation, no UI coupling |
| Token optimisation | Sonnet default, MAX_THINKING_TOKENS 10k, autocompact 50% | April 2026 | Community-proven settings from everything-claude-code |
| Thinking budget | ultrathink triggered by planning chat on complex tasks, medium otherwise | April 2026 | Preserves token budget. ultrathink reserved for architecture decisions, algorithm design, and Large/Epic task planning. |
| Pre-task checklist | Blast radius, existing patterns, security surface | April 2026 | Adopted from production Next.js/Supabase Claude Code configs |
| Codex role | Manual reviewer at stage gates | April 2026 | Challenger and parallel thinker, not primary implementer. Manual copy-paste workflow, no plugin or API key needed. |

---

## 17. Community References

These resources informed the rules and conventions in this file.
Read them if you need context on why a rule exists.

| Resource | URL | What it informed |
|---|---|---|
| everything-claude-code | https://github.com/affaan-m/everything-claude-code | Token optimisation, strategic compaction, session discipline |
| darraghh1/my-claude-setup | https://github.com/darraghh1/my-claude-setup | Pre-task checklist, blast radius concept, RLS patterns |
| kana-dojo (kanadojo.com) | https://github.com/lingdojo/kana-dojo | Content structure, Next.js + Supabase + Vercel stack reference |

---

*This file is the operating agreement between the owner and the AI for every session.*
*Nothing in this file is optional.*
*If this file conflicts with any other document, this file wins - unless LangTap_Planning.md
explicitly overrides it on a specific point.*
