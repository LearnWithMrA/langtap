# LangTap - Architecture

Version 1.0 | April 2026
Domain: Folder structure, module boundaries, decoupling rules, naming conventions,
patterns, and conventions that apply across the entire codebase.
Reference: CLAUDE.md Section 3, Section 5, Section 5B, Section 5C, Section 6, Section 8.
Owner document: CLAUDE.md

Read this document at the start of any session that involves creating new files,
new folders, or establishing a new pattern in the codebase.

---

## 1. Design Principles

The codebase is structured like a well-edited publication. Every file has a clear
identity. Every folder has a single stated purpose. Every module boundary is
deliberate. A developer picking up any file should understand what it does, what
it depends on, and what depends on it, without reading the whole project.

Four rules underpin every structural decision:

**Decoupling.** Nothing depends on something else unless that dependency is
explicit, justified, and flows in one direction. The engine does not know about
React. Components do not know about Supabase. Stores do not call services
directly. Dependencies flow inward toward the core, never outward.

**Purity at the core.** The game engine is pure TypeScript functions. No side
effects. No framework imports. No API calls. It takes inputs and returns outputs.
This makes it fully testable in isolation and fully portable if the framework
ever changes.

**One responsibility per file.** A file that does two things should be two files.
A component that fetches data and renders UI should be split. A service that
handles both auth and profile updates should be split. Small, focused files are
easier to read, test, and change.

**Surgical edits.** The structure is designed for targeted changes. Changing the
mastery scoring formula should touch one file in `engine/`. Changing a button
style should touch one file in `components/ui/`. Nothing is so entangled that a
small change requires touching many files.

---

## 1B. SOLID Principles

Reference: CLAUDE.md Section 5B (condensed rules). This section provides the full
rationale and project-specific examples.

### Single Responsibility Principle (SRP)

Every file, component, hook, store, and function has one reason to change. When a
unit does two things, it becomes two units.

Examples in this codebase:
- `engine/mastery.ts` handles scoring logic only. It does not read from Supabase.
- `services/mastery.service.ts` handles syncing mastery scores to the database only.
  It does not compute scores.
- `stores/mastery.store.ts` holds mastery state for the UI. It calls the service to
  persist and the engine to compute, but does neither itself.
- A page component in `app/` is a thin route wrapper. It imports and renders a client
  component. It does not contain business logic.

### Open/Closed Principle (OCP)

Modules are open for extension but closed for modification. Add new behaviour by
composing with existing code, not by editing stable code.

Examples in this codebase:
- Adding a new input mode: create a new component in `components/game/`, register it
  in the mode map. Do not modify `TypeInput` or `SwipeInput`.
- Adding a new kana group: add a new data file in `data/kana/`. The selection
  algorithm picks it up without changes to `engine/selection.ts`.

### Liskov Substitution Principle (LSP)

Any component or function that accepts a contract (props type, function signature)
must work correctly with any value satisfying that contract. A specialised variant
must not break callers that depend on the base interface.

Examples in this codebase:
- `LeaderboardList` accepts an optional `mode` prop. Callers that omit it (landing
  page) and callers that provide it (leaderboard page) both work correctly.
- Any `LeaderboardEntry` can be passed to `LeaderboardRow` regardless of rank or
  whether it is the current user.

### Interface Segregation Principle (ISP)

Types, props, and store slices stay small and focused. No consumer is forced to
depend on data it does not use.

Examples in this codebase:
- Zustand stores are split by domain: `mastery.store.ts`, `settings.store.ts`,
  `onboarding.store.ts`, `gameplay.store.ts`, `user.store.ts`, `guest-usage.store.ts`.
  A component that needs settings does not pull in mastery state.
- Component props are narrow. `Avatar` takes `username` and `size`, not the full
  `LeaderboardEntry`.

### Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concrete implementations. The
dependency direction flows inward: UI depends on stores and hooks, stores depend
on services and engine, engine depends on nothing.

Examples in this codebase:
- Components call hooks (`useMasteryStore`), never `supabase.from('mastery')`.
- Engine functions in `engine/` import only types and other engine modules. They
  never import React, Zustand, or Supabase.
- Services abstract the database. If Supabase is replaced, only `services/` changes.

---

## 2. Full Folder Structure

```
langtap/
|
|- app/                         # Next.js App Router - routes only
|  |- (auth)/                   # Route group: auth screens (no URL segment)
|  |  |- sign-up/
|  |  |  |- page.tsx
|  |  |- log-in/
|  |  |  |- page.tsx
|  |  |- layout.tsx             # Auth layout (minimal, no nav)
|  |
|  |- (onboarding)/             # Route group: onboarding steps
|  |  |- onboarding/
|  |  |  |- step-1/             # JLPT self-assessment
|  |  |  |  |- page.tsx
|  |  |  |- step-2/             # Knowledge level gate (Hiragana/Katakana sliders)
|  |  |  |  |- page.tsx
|  |  |  |- step-2b/            # Kana chart selector (early character unlock)
|  |  |  |  |- page.tsx
|  |  |  |- step-3/             # Input mode selection
|  |  |  |  |- page.tsx
|  |  |- layout.tsx
|  |
|  |- (main)/                   # Route group: main app screens
|  |  |- (scene)/               # Nested group: persistent landscape + cyclist scene
|  |  |  |- home/
|  |  |  |  |- page.tsx         # Game home dashboard
|  |  |  |- practice/
|  |  |  |  |- page.tsx         # Practice entry (redirect)
|  |  |  |  |- kana/
|  |  |  |  |  |- page.tsx      # Kana practice screen
|  |  |  |  |- kotoba/
|  |  |  |  |  |- page.tsx      # Kotoba practice screen
|  |  |  |- demo/
|  |  |  |  |- page.tsx         # Demo entry (redirect)
|  |  |  |  |- kana/
|  |  |  |  |  |- page.tsx      # Kana demo practice
|  |  |  |  |- kotoba/
|  |  |  |  |  |- page.tsx      # Kotoba demo practice
|  |  |  |- layout.tsx          # Scene layout (landscape/cyclist mount once, no remount on nav)
|  |  |- dojo/
|  |  |  |- page.tsx            # Dojo entry (redirect)
|  |  |  |- kana/
|  |  |  |  |- page.tsx         # Kana character progress screen
|  |  |  |- kotoba/
|  |  |  |  |- page.tsx         # Kotoba vocabulary progress screen
|  |  |- demo/
|  |  |  |- dojo/
|  |  |  |  |- kana/
|  |  |  |  |  |- page.tsx      # Demo kana dojo (local state only)
|  |  |  |  |- kotoba/
|  |  |  |  |  |- page.tsx      # Demo kotoba dojo (local state only)
|  |  |- library/
|  |  |  |- page.tsx            # Word bank (Phase 2 - stub in Phase 1)
|  |  |- leaderboard/
|  |  |  |- page.tsx
|  |  |- profile/
|  |  |  |- page.tsx
|  |  |- settings/
|  |  |  |- page.tsx
|  |  |- layout.tsx             # Main layout (AppTopBar, SettingsDialog, SessionPrefetch)
|  |
|  |- api/                      # Next.js route handlers (server-side only)
|  |  |- bug-report/
|  |  |  |- route.ts            # Bug report submission (auth, rate gate, upload, insert)
|  |  |- sync/
|  |  |  |- route.ts            # Beacon endpoint for pagehide sync (checkpoint RPCs server-side)
|  |  |- auth/
|  |  |  |- sign-out/
|  |  |  |  |- route.ts         # Server-side sign-out (clears session cookies)
|  |  |  |- delete-account/
|  |  |  |  |- route.ts         # Account deletion
|  |  |  |  |- requirements/
|  |  |  |  |  |- route.ts      # Deletion re-auth requirements check
|  |  |  |  |- reauth/[provider]/start/
|  |  |  |  |  |- route.ts      # OAuth re-auth start for account deletion
|  |  |- stripe/
|  |  |  |- webhook/
|  |  |  |  |- route.ts         # Stripe webhook handler (Phase 1: stub)
|  |
|  |- auth/
|  |  |- callback/
|  |  |  |- route.ts            # Supabase OAuth/email callback (sanitised ?next= redirect)
|  |
|  |- terms/                    # Legal: Terms of Service
|  |- privacy/                  # Legal: Privacy Policy
|  |- acceptable-use/           # Legal: Acceptable Use Policy
|  |- copyright/                # Legal: Copyright Policy
|  |- credits/                  # Attribution and licences
|  |
|  |- layout.tsx                # Root layout (html, body, fonts, providers, analytics)
|  |- page.tsx                  # Landing page
|  |- not-found.tsx             # 404 page
|  |- error.tsx                 # Root error boundary (renders components/layout/error-screen.tsx)
|  |- global-error.tsx          # Last-resort boundary for root layout failures: provides its own
|  |                            # html/body, inline-styled by documented exception (globals.css
|  |                            # may not have loaded when it renders)
|  |- loading.tsx               # Global loading state
|
|- components/                  # Reusable UI components
|  |- ui/                       # Primitive components
|  |  |- button.tsx
|  |  |- input.tsx
|  |  |- card.tsx
|  |  |- modal.tsx
|  |  |- progress-bar.tsx
|  |  |- badge.tsx
|  |  |- toast.tsx
|  |
|  |- layout/                   # Structural layout components
|  |  |- bottom-nav.tsx
|  |  |- top-bar.tsx
|  |  |- page-shell.tsx         # Standard page wrapper with padding/scroll
|  |
|  |- game/                     # Practice screen components
|  |  |- character-display.tsx  # Shows the kana character being practised
|  |  |- word-display.tsx       # Shows the full word context
|  |  |- type-input.tsx         # Type mode text input (keyboard, IME zero-width-space trick)
|  |  |- swipe-input.tsx        # Swipe mode text input (mobile swipe keyboard, raw input)
|  |  |- tap-input.tsx          # Tap mode character button grid
|  |  |- feedback-overlay.tsx   # Wrong answer highlight and mnemonic
|  |  |- meaning-reveal.tsx     # English meaning shown after correct answer
|  |  |- distance-counter.tsx   # Running distance display
|  |  |- mode-switcher.tsx      # Input mode toggle icon (top right)
|  |  |- dialogue-overlay.tsx   # Mascot dialogue card with typewriter animation
|  |  |- practice-banner.tsx    # Banner above game window (post-trial, post-kotoba)
|  |
|  |- dojo/                     # Dojo screen components (Kana and Kotoba)
|  |  |- character-group.tsx    # Kana: collapsible group (Seion, Dakuon, Yoon)
|  |  |- character-tile.tsx     # Kana: individual character with mastery bar
|  |  |- group-bar.tsx          # Shared heading bar with progress + UnlockButton
|  |  |- unlock-prompt.tsx      # Kana: single-step individual unlock
|  |  |- bulk-unlock-prompt.tsx # Kana: single-step bulk unlock
|  |  |- bulk-reset-prompt.tsx  # Kana: two-option bulk reset/mark-mastered
|  |  |- tile-detail-popover.tsx# Kana: tile options (reset/mark mastered)
|  |  |- help-card.tsx          # Dismissible onboarding help card
|  |  |- kotoba-word-tile.tsx   # Kotoba: word tile with auto-scaling text
|  |  |- kotoba-unit-card.tsx   # Kotoba: unit summary card with accordion toggle
|  |  |- kotoba-level-tabs.tsx  # Kotoba: JLPT N5-N1 tab row
|  |  |- kotoba-level-group.tsx # Kotoba: level-group accordion row with word grid
|  |  |- kotoba-word-popover.tsx# Kotoba: word detail with reset/mark mastered
|  |  |- kotoba-unlock-prompt.tsx      # Kotoba: single-step individual unlock
|  |  |- kotoba-bulk-unlock-prompt.tsx # Kotoba: single-step bulk unlock
|  |  |- kotoba-bulk-reset-prompt.tsx  # Kotoba: two-option bulk reset/mark-mastered
|  |
|  |- dashboard/                 # Game Home dashboard components
|  |  |- streak-calendar.tsx    # Streak calendar widget with flames
|  |  |- mode-panel.tsx         # Kana/Kotoba practice panel
|  |  |- dashboard-helpers.ts   # Formatting utilities
|  |  |- dashboard-icons.tsx    # Star, lock, clock, road SVGs
|  |
|  |- profile/                   # Profile screen components
|  |  |- profile-client.tsx     # Orchestrator with modals
|  |  |- header-card.tsx        # Avatar, username, sign out
|  |  |- membership-card.tsx    # Plan display, notify CTA
|  |  |- account-settings.tsx   # Username, email, password, units
|  |  |- guest-banner.tsx       # Guest conversion banner
|  |  |- profile-helpers.ts     # Date and cooldown helpers
|  |  |- profile-icons.tsx      # Pencil, chevron, shield SVGs
|  |
|  |- animation/
|  |  |- cycling-character.tsx  # Looping cycling girl animation
|  |
|  |- audio/
|  |  |- audio-player.tsx       # Lo-fi background music player
|
|- engine/                      # Pure game logic - no React, no Supabase
|  |- constants.ts              # All named constants (single source of truth)
|  |- selection.ts              # Character and word selection algorithm
|  |- kotoba-selection.ts       # Weighted word selection and kanji distractors for Kotoba
|  |- kotoba-progression.ts     # Kotoba word unlock progression (steps of 6 across levels)
|  |- mastery.ts                # Mastery score logic and weighting
|  |- unlock.ts                 # Unlock threshold and progression sequence
|  |- counter.ts                # Word counter logic
|  |- distance.ts               # Distance and speed bonus calculation
|  |- scoring.ts                # Per-character first-attempt scoring
|  |- input.ts                  # Tri-state input evaluation (full/prefix/no match)
|  |- streak.ts                 # Streak derivation, grace days, calendar rendering
|  |- practice-eligibility.ts   # Three-set character eligibility system
|  |- __tests__/
|  |  |- selection.test.ts
|  |  |- kana-selection.test.ts
|  |  |- kotoba-selection.test.ts
|  |  |- kotoba-progression.test.ts
|  |  |- kotoba-scoring.test.ts
|  |  |- mastery.test.ts
|  |  |- unlock.test.ts
|  |  |- counter.test.ts
|  |  |- distance.test.ts
|  |  |- scoring.test.ts
|  |  |- streak.test.ts
|  |  |- practice-eligibility.test.ts
|
|- stores/                      # Zustand state stores (one per domain)
|  |- mastery.store.ts          # Character mastery scores (persisted, checkpoint-synced)
|  |- word-mastery.store.ts     # Word mastery scores and manual word unlocks
|  |- unlock.store.ts           # Character unlock state (derived from mastery, not persisted)
|  |- counter.store.ts          # Word counter state (session-scoped, in-memory)
|  |- session.store.ts          # Current session score and distance (in-memory)
|  |- settings.store.ts         # User settings and settings dialog state (persisted)
|  |- user.store.ts             # Authenticated user and profile state
|  |- onboarding.store.ts       # Onboarding flow state (persisted)
|  |- auth-modal.store.ts       # Auth modal visibility (not persisted)
|  |- daily-cap.store.ts        # Shared daily distance cap state
|  |- demo.store.ts             # Demo taster prompt index and completion (in-memory)
|  |- gameplay.store.ts         # Whether practice gameplay is currently active
|  |- guest-distance.store.ts   # DEPRECATED (Sprint 14) - flagged for owner deletion
|  |- guest-usage.store.ts      # DEPRECATED (Sprint 14) - flagged for owner deletion
|  |- scoped-storage.ts         # User-scoped localStorage adapter for persist (helper, not a store).
|                                 Also owns the one-time obsolete-key sweep: when retiring a feature
|                                 that persisted data, add its keys to OBSOLETE_KEYS or
|                                 OBSOLETE_KEY_PREFIXES and bump STORAGE_SCHEMA_VERSION. Users'
|                                 browsers then clean up automatically on next app load.
|
|- services/                    # All external API calls (Supabase, Stripe)
|  |- supabase.ts               # Re-exports the browser Supabase client (back-compat)
|  |- supabase-browser.ts       # Supabase browser client factory (anon key only)
|  |- supabase-server.ts        # Supabase server client factory (route handlers, middleware)
|  |- auth.service.ts           # Sign up, log in, sign out, session
|  |- profile.service.ts        # Read and write user profile
|  |- membership.service.ts     # Membership status helpers (writes are server-side only)
|  |- mastery.service.ts        # Kana mastery snapshot load + checkpoint sync RPCs
|  |- word-mastery.service.ts   # Word mastery snapshot load + checkpoint sync RPCs
|  |- unlock.service.ts         # Manual character unlock reads and writes
|  |- counter.service.ts        # Best-effort word counter sync
|  |- leaderboard.service.ts    # Server-derived leaderboard scoring and ranked reads
|  |- practice-session.service.ts # record_practice_activity RPC (streak/heatmap batches)
|  |- streak.service.ts         # Practice summary loads for streak derivation
|  |- reset.service.ts          # Per-domain reset RPC wrappers (epoch-aware)
|  |- factory-reset.service.ts  # factory_reset RPC wrapper
|  |- bug-report.service.ts     # Bug report submission via /api/bug-report
|  |- analytics.service.ts      # Vercel Analytics custom event wrapper (event names + budget)
|  |- redirect-sanitizer.ts     # Sanitises ?next= redirect targets on the auth callback
|  |- reauth-cookie.ts          # Signed HMAC cookies for the OAuth delete re-auth flow
|  |- stripe.service.ts         # Stripe client-side helpers (Phase 1: stub)
|  |- guest-import.service.ts   # DEPRECATED (Sprint 14) - flagged for owner deletion
|  |- guest-usage.service.ts    # DEPRECATED (Sprint 14) - flagged for owner deletion
|  |- import-snapshot.ts        # DEPRECATED (Sprint 14) - flagged for owner deletion
|
|- hooks/                       # Custom React hooks
|  |- useAuth.ts                # Auth state selector (user, profile, guest/authed flags)
|  |- useSession.ts             # Current session state and scoring
|  |- useSettings.ts            # Profile settings sync into the settings store
|  |- useMastery.ts             # Read mastery scores, trigger sync
|  |- usePracticeSession.ts     # Kana practice game loop orchestrator
|  |- useKotobaPracticeSession.ts # Kotoba practice game loop orchestrator
|  |- usePracticeCounters.ts    # Per-input-mode correct-character counters
|  |- usePracticeActivityTracker.ts # Batches completions, flushes to streak RPC
|  |- useSyncCheckpoint.ts      # Epoch-aware checkpoint sync for signed-in users
|  |- useResetActions.ts        # Reset operations (per-domain and factory)
|  |- useDailyCap.ts            # Daily distance cap load and increment
|  |- useDailyCapAnalytics.ts   # Fires daily_cap_hit analytics event on cap transition
|  |- useFirstPracticeEvent.ts  # Fires first_practice analytics event once per user
|  |- useStreak.ts              # Streak state and calendar heatmap derivation
|  |- useLeaderboard.ts         # Ranked leaderboard fetch with 60s TTL cache
|  |- useBugReport.ts           # Bug report submit state and cooldown
|  |- useUsernameRepair.ts      # Default OAuth username detection and repair prompt
|  |- useAudio.ts               # Lo-fi audio playback control
|  |- useLofiPlayer.ts          # Shuffled lo-fi background music player
|  |- useKeySound.ts            # Web Audio keyboard sound effects
|  |- useWordAudio.ts           # On-demand word and kana pronunciation playback
|  |- useDialogueSeen.ts        # localStorage tracking for seen dialogues
|  |- useTutorialTrial.ts       # Sandbox kana trial session
|  |- useKotobaTrialSession.ts  # Sandbox kotoba trial session
|  |- useDemoKanaPracticeSession.ts   # Sequential demo kana prompt adapter
|  |- useDemoKotobaPracticeSession.ts # Sequential demo kotoba prompt adapter
|  |- useGameplayActive.ts      # Whether gameplay is active (prefetch guard)
|  |- useEasterEgg.ts           # "langtap" keystroke easter egg
|  |- useStuckLoadingWarning.ts # Dev-only stuck loading gate watchdog
|  |- useGuestUsage.ts          # DEPRECATED (Sprint 14) - flagged for owner deletion
|
|- data/                        # Static content (bundled, not fetched)
|  |- kana/
|  |  |- characters.ts          # Full kana character dataset
|  |  |- progression-groups.ts  # Unlocking group definitions
|  |
|  |- words/
|  |  |- n5.ts                  # N5 word bank (generated from JMdict)
|  |  |- n4.ts
|  |  |- n3.ts
|  |  |- n2.ts
|  |  |- n1.ts
|  |  |- index.ts               # Re-exports all banks keyed by JLPT level
|  |
|  |- audio/
|  |  |- word-manifest.ts       # Maps word ID to audio file path
|  |
|  |- tutorial/
|  |  |- dialogue-scripts.ts    # Dialogue script data keyed by trigger
|  |  |- trial-prompts.ts       # Fixed kana trial prompts
|
|- theme/                       # Design tokens (no logic, values only)
|  |- colors.ts                 # All colour values (pastel palette + heatmap)
|  |- typography.ts             # Font families, sizes, weights, line heights
|  |- spacing.ts                # Spacing scale
|  |- breakpoints.ts            # Responsive breakpoints
|
|- types/                       # TypeScript type definitions
|  |- kana.types.ts             # KanaCharacter, MasteryScore, UnlockState
|  |- word.types.ts             # WordBankEntry, WordCounter
|  |- user.types.ts             # UserProfile, JlptLevel, InputMode
|  |- session.types.ts          # SessionScore, PromptResult
|  |- leaderboard.types.ts      # LeaderboardEntry
|  |- game.types.ts             # GameState, FeedbackState
|
|- scripts/                     # Build and utility scripts (not app code)
|  |- build-word-bank.ts        # Generates data/words/ from JMdict export
|
|- docs/                        # Sub-documents (read before working in domain)
|  |- ARCHITECTURE.md           # This file
|  |- FRONTEND.md
|  |- BACKEND.md
|  |- AUTH.md
|  |- SECURITY.md
|  |- GAME_DESIGN.md
|  |- CONTENT.md
|  |- DEVOPS.md
|
|- public/
|  |- audio/
|  |  |- words/                 # Word audio files (.ogg/.mp3)
|  |  |- lofi/                  # Lo-fi background music
|  |- animation/                # Cycling animation assets
|  |- fonts/                    # Self-hosted font files
|  |- images/
|  |  |- mascot/                # Mascot expression PNGs
|  |  |  |- mascot-neutral.png
|  |  |  |- mascot-encouraging.png
|  |  |  |- mascot-thinking.png
|
|- middleware.ts                # Refreshes the Supabase auth token on every request and
|                               # enforces route-level access control (see docs/AUTH.md Section 4)
|- .env.local                   # Environment variables (never committed)
|- .env.example                 # Template with variable names, no values
|- CLAUDE.md                    # AI session rules
|- CHANGELOG.md                 # Session change log
|- LangTap_Planning.md          # Product vision and feature detail
|- LangTap_Sprints.md           # Sprint board
```

---

## 3. Module Boundary Rules

These rules define what can depend on what. Violating them creates coupling that
makes the codebase hard to change and hard to test.

```
data/       <-- engine reads from here
             <-- stores read from here via hooks
             Nothing writes to data/ at runtime

engine/     <-- stores call engine functions
             <-- hooks call engine functions
             engine/ does NOT import from: components/, stores/, services/,
             hooks/, app/, or theme/

stores/     <-- components read from stores
             <-- hooks compose store state
             stores/ does NOT import from: components/, services/, app/
             stores/ MAY import from: engine/, data/, types/

services/   <-- hooks call services
             <-- api/ route handlers call services
             services/ does NOT import from: components/, stores/, hooks/, app/
             services/ MAY import from: types/

hooks/      <-- components call hooks
             hooks/ MAY import from: stores/, services/, engine/, data/, types/
             hooks/ does NOT import from: components/, app/

components/ <-- app/ pages use components
             components/ MAY import from: hooks/, theme/, types/
             components/ does NOT import from: services/, stores/ directly
             components/ MUST go through hooks to access state and services

app/        -- imports from: components/, hooks/, types/
             app/ does NOT contain business logic
             app/ does NOT call services directly
             app/ does NOT call engine functions directly

theme/      -- imported by: components/, app/
             theme/ does NOT import from anything in the project

types/      -- imported by: everything
             types/ does NOT import from anything in the project
```

**Dependency flow summary:**
```
data/ --> engine/ --> stores/ --> hooks/ --> components/ --> app/
                  \-> services/ --> hooks/
theme/ --> components/
types/ --> everything
```

---

## 4. File Rules

### 4.1 File Header

Every file must begin with a header comment block. No exceptions.

```ts
// ------------------------------------------------------------
// File: engine/selection.ts
// Purpose: Weighted character and word selection algorithm.
//          Selects the next character to practise based on
//          mastery scores and word counter values.
//          Pure functions only. No side effects.
// Depends on: engine/constants.ts, types/kana.types.ts
// ------------------------------------------------------------
```

### 4.2 Section Labels

Group related logic within a file using section labels when a file has more than
one logical grouping:

```ts
// -- Types -------------------------------------------------------

// -- Constants ---------------------------------------------------

// -- Helpers -----------------------------------------------------

// -- Main exports ------------------------------------------------
```

### 4.3 File Size Limit

Aim for 300 lines per file. The hard ceiling is 500 lines. Files between 300
and 500 are acceptable when the logic is genuinely cohesive and splitting would
create artificial fragmentation (e.g. complex orchestrators with tightly coupled
state). When a file crosses 300 lines, review whether splitting improves
readability and maintainability. If splitting would scatter tightly coupled
logic across multiple files with no clear benefit, leave it as one file. If a
file exceeds 500, it must be split into logically named sub-files and
re-exported from an `index.ts` in that folder.

### 4.4 Function Size Limit

If a function exceeds 40 lines, split it into smaller named helpers. Each helper
must have a single, clear purpose stated in a comment above it.

---

## 5. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Files (components) | kebab-case.tsx | `mastery-bar.tsx` |
| Files (logic, hooks, services) | camelCase.ts | `selectionAlgorithm.ts` |
| Files (stores) | domain.store.ts | `mastery.store.ts` |
| Files (services) | domain.service.ts | `auth.service.ts` |
| Files (engine) | descriptive camelCase | `characterSelection.ts` |
| Files (types) | domain.types.ts | `kana.types.ts` |
| Components | PascalCase | `MasteryBar` |
| Hooks | useHookName | `useMastery` |
| Types and interfaces | PascalCase | `KanaCharacter`, `MasteryScore` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_WORD_COUNTER` |
| Zustand stores | useDomainStore | `useMasteryStore` |
| Route group folders | (kebab-case) | `(auth)`, `(main)` |
| Route segment folders | kebab-case | `sign-up`, `log-in` |
| CSS class names | Tailwind utilities only | no custom class names |

---

## 6. Component Rules

- Functional components only. No class components.
- Named exports only. No default exports for components.
- Components must not contain business logic. Logic belongs in hooks, stores,
  or engine functions.
- Components must not call services directly. Go through hooks.
- Components must not import from stores directly. Go through hooks.
- Every component that receives data must handle three states: loading, error,
  and empty. A component that only handles the happy path is not complete.
- Keep components under 150 lines. Split if larger.
- Props interfaces are defined in the same file as the component, above it.

```ts
// Good
type MasteryBarProps = {
  characterId: string
  score: number
  isLocked: boolean
}

export function MasteryBar({ characterId, score, isLocked }: MasteryBarProps) {
  ...
}
```

---

## 7. Engine Rules

- Pure functions only. No React imports. No Zustand imports. No Supabase calls.
- Every exported function must have an explicit return type.
- Every engine function must have a corresponding test file in `engine/__tests__/`.
- Constants are imported from `engine/constants.ts`. No magic numbers.
- Engine functions take plain typed inputs and return plain typed outputs.
- No mutation of input arguments. Return new objects.

```ts
// Good - pure, typed, no side effects
export function calculateWeight(score: MasteryScore): number {
  return 1 / (score + 1)
}

// Bad - side effect, no return type
export function updateScore(char: KanaCharacter) {
  char.score++ // mutates input
}
```

---

## 8. Store Rules

- One Zustand store per domain.
- Stores hold state and expose actions. They do not call services.
- Stores may call engine functions for computed values.
- Stores are persisted to Supabase via hooks and services, not directly.
- Guest users: store state is persisted to localStorage via a Zustand middleware.
- Logged-in users: store state is synced to Supabase at session end, not on
  every state change.
- Persisted stores use `skipHydration: true` to prevent server/client mismatch.
  They expose a `hasHydrated: boolean` field set via `onRehydrateStorage`.
  Consuming hooks must gate on `hasHydrated` before running logic that depends
  on stored values.
- `components/performance/store-hydrator.tsx` centralises hydration at layout
  level. It rehydrates `useMasteryStore`, `useWordMasteryStore`, and
  `useOnboardingStore` once, then bootstraps the unlock store. Pages never
  call `.persist.rehydrate()` themselves.
- Persisted stores include `version: 1` and a `migrate` function in the persist
  config. Start with a no-op migrate. Update when the schema changes.
- `bulkLoad` actions that merge remote data with local state use `max(local, incoming)`
  for monotonic values (mastery scores) to prevent progress regression from stale
  server snapshots.
- Input sanitization: `bulkLoad` actions validate incoming values at the boundary
  (finite, integer, non-negative) before merging. Invalid values are clamped to safe
  defaults rather than rejected.
---

## 9. Service Rules

- All Supabase calls are in `services/`. Nowhere else.
- Services are plain async functions, not classes.
- Services never import from components, stores, or hooks.
- Services handle their own errors and return typed results.
- The Supabase client is initialised once in `services/supabase.ts` and imported
  by other service files. It is never initialised in a component or hook.
- The anon key only. The service role key never touches the client.

---

## 10. Route Handler Rules

- API route handlers live in `app/api/`.
- They are server-side only. They may use the Supabase service role key.
- Client components never call route handlers for game data. Route handlers
  are only used for server-side operations like Stripe webhook processing.
- Route handlers must validate all incoming data before processing.

---

## 11. Server vs Client Components

Next.js 15 App Router defaults to Server Components. This matters for LangTap.

| Component type | When to use |
|---|---|
| Server Component (default) | Static content, pages that do not need interactivity, initial data loading |
| Client Component (`'use client'`) | Anything with useState, useEffect, event handlers, Zustand stores, browser APIs |

Rules:
- Add `'use client'` only when needed. Do not make everything a client component.
- The practice screen, Dojo, and all interactive game components are client components.
- The landing page can be a server component with client islands for the CTA buttons.
- Never import a client component into a server component without wrapping it.
- Keep server component data fetching at the page level, not deep in the tree.

---

## 12. TypeScript Rules

- Strict mode always on. No `any`. No `@ts-ignore` without a written explanation.
- Always type function return values explicitly.
- Prefer `type` over `interface` for consistency unless extending is needed.
- Use `const` over `let` unless reassignment is required.
- No implicit any from untyped third-party libraries. Add types or use `unknown`.
- Types live in `types/`. Do not define domain types inline in components.

---

## 13. Testing Rules

Reference: CLAUDE.md Section 5C (TDD principle).

### TDD workflow

This project follows test-driven development. The cycle for every new unit of work:

1. **Red:** Write a test that describes the expected behaviour. Run it. It fails.
2. **Green:** Write the minimum code to make the test pass. No more.
3. **Refactor:** Clean up both the test and the production code. Tests stay green.
4. **Repeat:** Move to the next behaviour.

For legacy code (files that exist without tests), write characterisation tests for
the current behaviour before making any changes. This protects against regressions.

### Coverage requirements by layer

| Layer | Rule | Test location |
|---|---|---|
| Engine (`engine/`) | Every exported function has a test | `engine/__tests__/` |
| Services (`services/`) | Every service file has a test | `services/__tests__/` |
| Hooks (`hooks/`) | Every non-trivial hook has a test | `hooks/__tests__/` |
| Stores (`stores/`) | Every store with derived state or actions has a test | `stores/__tests__/` |
| UI primitives (`components/ui/`) | Every interactive component has a test | `components/ui/__tests__/` |
| Screen clients (`components/*/`) | Every page client covers happy path, loading, error, empty | `components/*/__tests__/` |
| Data (`data/`) | Data integrity tests for static datasets | `data/*/__tests__/` |

### What to test per component type

**UI primitives (Button, Input, Modal, etc.):**
- Renders correct content and variants
- ARIA attributes (roles, labels, states)
- Keyboard accessibility (Enter, Space, Escape, Tab)
- Minimum touch target (44px)
- Disabled and loading states
- Event handlers fire correctly

**Screen clients (page-level orchestrators):**
- Happy path renders expected content
- Loading state shows skeleton or spinner
- Error state shows message and retry action
- Empty state shows CTA
- User interactions trigger correct state changes
- Responsive layout differences (when testable)

**Engine functions (pure logic):**
- Input/output mapping for all branches
- Edge cases (zero, negative, NaN, empty arrays)
- Boundary values (thresholds, caps, wraparounds)

**Services (Supabase wrappers):**
- Input validation before API calls
- Error mapping to user-friendly messages
- Retry logic where applicable
- Mock Supabase client, never hit real database

**Hooks:**
- State initialisation
- State transitions on actions
- Cleanup on unmount
- Side effect timing (debounce, timeout)

### Async render gate tests

Any hook that gates rendering on an `isLoading` flag (auth, guest usage, membership)
must have a regression test proving it resolves under React Strict Mode. Use the
shared utilities in `test-utils/async-gate.tsx`:

- `deferred<T>()`: controllable promise (resolve/reject manually in the test)
- `renderHookStrict()`: renders inside real `<React.StrictMode>`
- `expectLoadingClears()`: asserts `isLoading` resolves to `false`

Pattern: render the hook in StrictMode, hold the async work pending via `deferred()`,
resolve it, and assert loading clears. If the hook uses an eager init flag that
breaks under double-fire, the test will timeout (proving the bug).

### General test rules

- Tests use Vitest and React Testing Library.
- Test files live in a `__tests__/` folder adjacent to the source.
- Shared test utilities live in `test-utils/` at the project root.
- No snapshot tests for game logic. Use explicit assertions.
- Test names describe behaviour, not implementation ("shows error when email is
  empty", not "calls setError with string").
- Prefer `userEvent` over `fireEvent` for user interactions.
- Use fake timers for time-dependent tests. Never use real `setTimeout` in tests.
- Mock at the boundary (Supabase client, Audio API), not internal functions.

---

## 14. What Lives Where: Quick Reference

| I need to... | File to create or edit |
|---|---|
| Change the mastery scoring formula | `engine/mastery.ts` |
| Change the unlock threshold | `engine/constants.ts` |
| Add a new kana character | `data/kana/characters.ts` |
| Change a button style | `components/ui/button.tsx` |
| Add a new screen | New folder in `app/(main)/` |
| Add a new reusable component | `components/` in the appropriate subfolder |
| Add a Supabase query | Appropriate file in `services/` |
| Add user-facing state | Appropriate file in `stores/` |
| Add a shared hook | `hooks/` |
| Change a colour | `theme/colors.ts` |
| Change a font size | `theme/typography.ts` |
| Change spacing | `theme/spacing.ts` |
| Add a new TypeScript type | Appropriate file in `types/` |

---

## 15. Patterns in Use

### 15.1 Hook Composition Pattern

Hooks compose store state, engine logic, and service calls into a single
interface for components. Components never wire these together themselves.

```ts
// hooks/useMastery.ts
export function useMastery() {
  const scores = useMasteryStore(state => state.scores)
  const increment = useMasteryStore(state => state.increment)

  const syncToSupabase = useCallback(async () => {
    await masteryService.sync(scores)
  }, [scores])

  return { scores, increment, syncToSupabase }
}
```

### 15.2 Engine-First Pattern

Business logic is written as a pure engine function first, tested in isolation,
then wired into a store or hook.

```ts
// engine/mastery.ts (pure, testable)
export function calculateWeight(score: MasteryScore): number {
  return 1 / (score + 1)
}

// stores/mastery.store.ts (uses the engine function)
import { calculateWeight } from '@/engine/mastery'
```

### 15.3 Service Result Pattern

Services return a typed result object, never throw to the caller.

```ts
type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function syncMastery(scores: MasteryScoreMap): Promise<ServiceResult<void>> {
  try {
    await supabase.from('mastery').upsert(...)
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Failed to sync mastery scores' }
  }
}
```

### 15.4 Guest vs Authenticated Pattern

Every store and service must handle both guest and authenticated states.
The pattern is checked once in the hook, not repeated in every component.

```ts
// hooks/useMastery.ts
const { user } = useAuth()

const syncScores = useCallback(async () => {
  if (!user) {
    // Guest: persist to localStorage via Zustand middleware
    return
  }
  // Logged in: sync to Supabase
  await masteryService.sync(scores)
}, [user, scores])
```

---

*This document is the architectural contract for the LangTap codebase.*
*Every file, folder, and pattern must conform to the rules defined here.*
*Update this document before introducing any new pattern or folder.*
