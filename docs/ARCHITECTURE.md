# LangTap - Architecture

Version 1.0 | April 2026
Domain: Folder structure, module boundaries, decoupling rules, naming conventions,
patterns, and conventions that apply across the entire codebase.
Reference: CLAUDE.md Section 3, Section 5, Section 6, Section 8.
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
|  |  |- step-1/                # JLPT self-assessment
|  |  |  |- page.tsx
|  |  |- step-2/                # Early character unlock
|  |  |  |- page.tsx
|  |  |- step-3/                # Notification preferences
|  |  |  |- page.tsx
|  |  |- step-4/                # Input mode selection
|  |  |  |- page.tsx
|  |  |- layout.tsx
|  |
|  |- (main)/                   # Route group: main app screens
|  |  |- practice/
|  |  |  |- page.tsx            # Core practice screen
|  |  |- dojo/
|  |  |  |- page.tsx            # Character progress screen
|  |  |- library/
|  |  |  |- page.tsx            # Word bank (Phase 2 - stub in Phase 1)
|  |  |- leaderboard/
|  |  |  |- page.tsx
|  |  |- profile/
|  |  |  |- page.tsx
|  |  |- settings/
|  |  |  |- page.tsx
|  |  |- credits/
|  |  |  |- page.tsx            # Attribution and licences
|  |  |- layout.tsx             # Main layout (bottom nav, top bar)
|  |
|  |- api/                      # Next.js route handlers (server-side only)
|  |  |- stripe/
|  |  |  |- webhook/
|  |  |  |  |- route.ts         # Stripe webhook handler
|  |
|  |- layout.tsx                # Root layout (html, body, providers)
|  |- page.tsx                  # Landing page
|  |- not-found.tsx             # 404 page
|  |- error.tsx                 # Global error boundary
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
|  |- animation/
|  |  |- cycling-character.tsx  # Looping cycling girl animation
|  |
|  |- audio/
|  |  |- audio-player.tsx       # Lo-fi background music player
|
|- engine/                      # Pure game logic - no React, no Supabase
|  |- constants.ts              # All named constants (single source of truth)
|  |- selection.ts              # Character and word selection algorithm
|  |- mastery.ts                # Mastery score logic and weighting
|  |- unlock.ts                 # Unlock threshold and progression sequence
|  |- counter.ts                # Word counter logic
|  |- distance.ts               # Distance and speed bonus calculation
|  |- scoring.ts                # Per-character first-attempt scoring
|  |- romaji.ts                 # Romaji input evaluation and variant matching
|  |- sokuon.ts                 # Sokuon position detection and validation
|  |- __tests__/
|  |  |- selection.test.ts
|  |  |- mastery.test.ts
|  |  |- unlock.test.ts
|  |  |- counter.test.ts
|  |  |- distance.test.ts
|  |  |- scoring.test.ts
|  |  |- romaji.test.ts
|  |  |- sokuon.test.ts
|
|- stores/                      # Zustand state stores (one per domain)
|  |- mastery.store.ts          # Character mastery scores
|  |- unlock.store.ts           # Unlock state per character
|  |- counter.store.ts          # Word counter state
|  |- session.store.ts          # Current session score and distance
|  |- settings.store.ts         # User settings (mode, font, audio toggle)
|  |- user.store.ts             # Authenticated user state
|
|- services/                    # All external API calls (Supabase, Stripe)
|  |- supabase.ts               # Supabase client (anon key only)
|  |- auth.service.ts           # Sign up, log in, sign out, session
|  |- profile.service.ts        # Read and write user profile
|  |- mastery.service.ts        # Sync mastery scores to Supabase
|  |- leaderboard.service.ts    # Read and write leaderboard entries
|  |- counter.service.ts        # Sync word counter state to Supabase
|  |- stripe.service.ts         # Stripe client-side helpers (Phase 1: stub)
|
|- hooks/                       # Custom React hooks
|  |- useAuth.ts                # Current user and auth state
|  |- useMastery.ts             # Read mastery scores, trigger sync
|  |- useSession.ts             # Current session state and scoring
|  |- useSettings.ts            # User preferences
|  |- useAudio.ts               # Lo-fi audio playback control
|
|- data/                        # Static content (bundled, not fetched)
|  |- kana/
|  |  |- characters.ts          # Full kana character dataset
|  |  |- mnemonics.ts           # Mnemonic per character
|  |  |- romaji-variants.ts     # Accepted romaji strings per character ID
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
|
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

No file should exceed 300 lines. If a file grows beyond this, split it into
logically named sub-files and re-export from an `index.ts` in that folder.

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

- Every engine function has a test in `engine/__tests__/`.
- Every service has a test file.
- Every non-trivial hook has a test file.
- Every screen covers at minimum: happy path, loading state, error state.
- Tests use Vitest and React Testing Library.
- Test files live adjacent to the file they test or in a `__tests__/` folder.
- No snapshot tests for game logic. Use explicit assertions.

---

## 14. What Lives Where: Quick Reference

| I need to... | File to create or edit |
|---|---|
| Change the mastery scoring formula | `engine/mastery.ts` |
| Change the unlock threshold | `engine/constants.ts` |
| Add a new kana character | `data/kana/characters.ts` |
| Add a mnemonic | `data/kana/mnemonics.ts` |
| Add a romaji variant | `data/kana/romaji-variants.ts` |
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
