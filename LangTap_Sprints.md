# LangTap - Sprint Board

Version 1.0 | April 2026
Status: Active

Reference: LangTap_Planning.md is the source of truth for all feature detail.
When a task conflicts with the planning document, the planning document wins.
Update this sprint board at the end of every session.

---

## How to Use This Document

Sprints are flexible in length. A sprint ends when all its tasks are marked Done,
not on a fixed date. Only one sprint is active at a time.

Tasks are sized as follows:

| Size | Meaning |
|---|---|
| **Small** | Quick and contained. One short session. |
| **Medium** | Standard effort. One focused session. |
| **Large** | Complex. May span multiple sessions. |
| **Epic** | High risk or very broad. Must be broken into smaller tasks before starting. |

Rules:
- Never start an Epic directly. Break it into Smalls, Mediums, and Larges first.
- Only one sprint is active at a time.
- A sprint is complete when all tasks are marked Done.
- Backlog tasks are not assigned to a sprint until that sprint is being planned.
- Update this document at the end of every session.
- The AI must not delete any file, record, or code. Flag deletions to the owner.
- Before starting any Large or Epic task, the AI must state the estimated token cost
  and wait for approval.

---

## Sprint 1 - Foundation and Project Setup

**Goal:** Everything needed before writing a single line of app code.
**Status:** Complete

| Task | Size | Status | Notes |
|---|---|---|---|
| Confirm and document final tech stack | **Small** | **Done** | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, Supabase, Stripe, Vercel, Vitest. Documented in Planning doc Section 7. |
| Create project folder structure | **Medium** | **Done** | All folders and placeholder files created per docs/ARCHITECTURE.md. Session 1. |
| Initialise Next.js project with TypeScript | **Medium** | **Done** | Next.js 15.5.14, React 19.1.0, Tailwind v4, App Router, strict TypeScript, @/* path alias. Session 2. |
| Set up ESLint and Prettier | **Small** | **Done** | ESLint 9 flat config, Prettier, format:check script, lint script changed to `eslint .` (next lint deprecated in 15.5.14). Session 3. |
| Set up Vitest for testing | **Small** | **Done** | Vitest 3, React Testing Library, jsdom, coverage-v8. Per-file `// @vitest-environment jsdom` annotations for component tests. Session 4. |
| Create Supabase project | **Small** | **Done** | Production project created. Local Supabase running via `supabase start --exclude storage-api,logflare`. All five tables migrated with RLS + FORCE RLS. Session 5. |
| Set up Vercel project and link to repo | **Small** | **In Progress** | Connect GitHub repo to Vercel. Add production Supabase keys as environment variables. |
| Write CLAUDE.md | **Medium** | **Done** | Completed in planning phase. v1.2. |
| Write docs/ARCHITECTURE.md | **Medium** | **Done** | Completed in planning phase. |
| Write docs/FRONTEND.md | **Medium** | **Done** | Completed in planning phase. |
| Write docs/BACKEND.md | **Medium** | **Done** | Completed in planning phase. Updated post-migration to reflect leaderboard no-client-writes policy. |
| Write docs/AUTH.md | **Small** | **Done** | Completed in planning phase. |
| Write docs/SECURITY.md | **Small** | **Done** | Completed in planning phase. |
| Write docs/GAME_DESIGN.md | **Large** | **Done** | Completed in planning phase. |
| Write docs/CONTENT.md | **Medium** | **Done** | Completed in planning phase. |
| Write docs/DEVOPS.md | **Small** | **Done** | Completed in planning phase. Updated with correct supabase start command and Vitest environment annotation note. |
| Create CHANGELOG.md | **Small** | **Done** | Created and maintained in this planning conversation. |
| Audit Kanji Alive dataset coverage against N5 word bank | **Small** | **Done** | Pure kana words have no Kanji Alive coverage. Resolved: VOICEVOX pre-generation used instead for all words. Kanji Alive no longer needed for Phase 1. See CONTENT.md Section 2.2. |

---

## Sprint 2 - Design System and Landing Page ✅ COMPLETE

**Goal:** Design tokens, base components, and a live landing page on Vercel.

| Task | Size | Status |
|------|------|--------|
| Colour tokens | Small | ✅ Done |
| Typography scale | Small | ✅ Done |
| Spacing and layout tokens | Small | ✅ Done |
| Base components (button, input, card, badge, progress-bar, modal, toast) | Large | ✅ Done |
| Heatmap colour utility | Small | ✅ Done |
| Build landing page | Medium | ✅ Done |
| Fix Vercel build (NODE_ENV=production interference) | Hotfix | ✅ Done |

**Notes:**
- 120 tests passing (18 engine + 102 component)
- Live at langtap.vercel.app
- Cycling animation and lo-fi audio deferred to a later sprint (non-blocking)

---

## Sprint 2B - UX/UI Design and Screen Specification ✅ COMPLETE

**Goal:** Define the full user experience before any further functional development.
Every screen is specced and approved before Sprint 3 resumes.
This sprint produces the design source of truth that all future sprints build from.
Full specs live in UX_DESIGN.md. This board tracks status only.
**Status:** Complete

Sprint 3 (auth implementation) is on hold until this sprint is complete.
Specs are written in UX_DESIGN.md. Claude builds all SVG assets.
Claude Code does not touch implementation until designs are approved.
Gemini is used for image generation only when photographic or painted assets are needed.

| Task | Size | Status | Notes |
|---|---|---|---|
| Write landing page spec | Medium | Done | See UX_DESIGN.md Section 3. Parallax landscape, nav, hero, footer. |
| Write game home screen spec | Small | Done | See UX_DESIGN.md Section 6. Redesigned as dashboard in Session 49: streak calendar (Figma-inspired, proper streak engine with 3-day start + grace mechanic + blue flames), Kana + Kotoba mode panels with collapsible progress bars, leaderboard glance, integrated mode selector on practice buttons. Responsive: stacked mobile, calendar-left + panels-right tablet, full layout desktop. |
| Write practice screen spec (all three input modes) | Medium | Done | See UX_DESIGN.md Section 7. Spec written and screen built with all three modes, audio sprite sound system, IME handling, and direction alternation. |
| Write Dojo screen spec - Kana | Medium | Done | See UX_DESIGN.md Section 8. Visual shell built at /dojo/kana with mid-progress mock fixture. Spec revised to match existing heat contract. Session 42 iteration: fluid mobile scaling (clamp + container queries) validated down to 320px, tiered unlock buttons (dark/medium/light blue, grey reset swap when all unlocked), translucent-on-scroll top bar, bulk-reset flow. |
| Write Dojo screen spec - Kotoba | Medium | Done | See UX_DESIGN.md Section 9. Visual shell built and iterated at `/dojo/kotoba` with the `variety` fixture. JLPT tab row with roving tabindex, WaniKani-style unit cards (active / completed / locked variants), single-open unit accordion, multi-open level-group accordion, three-row word tile with auto-scaling text (Range API + ResizeObserver), progress pill at 80% tile width, scoped unlock buttons that swap to grey reset/mark-mastered prompts when all unlocked, Modal-backed word popover with Reset/Mark as mastered, parity `state` prop on both dojo clients, bare `/dojo` falls through to `not-found`. Mark-as-mastered added to both Kana and Kotoba dojos (individual tiles and bulk). |
| Write auth screens spec | Small | Done | See UX_DESIGN.md Section 4. Sign-up and log-in built as state-driven modals on the landing page. Two-step flow: method picker (Email/Google/Apple tiles) then email form. Removed @modal parallel routes in favour of pure state. Responsive mobile scaling. |
| Write onboarding flow spec | Medium | Done | See UX_DESIGN.md Section 5. Reduced to 3 steps (notifications deferred to post-first-practice). Visual shell built: Step 1 JLPT picker, Step 2A knowledge gate (None/Some/All sliders), Step 2B kana chart selector (seion/dakuon/yoon tabs, row checkboxes, select all/clear), Step 3 input mode picker. Zustand store with localStorage persist. Purple colour theme. Codex-reviewed plan. |
| Write Profile screen spec | Small | Done | See UX_DESIGN.md Section 10. Visual shell built at /profile with yellow theme. Header card (avatar, username, sign out), membership card (Free plan, notify CTA), account settings (username 30-day limit, email, password, distance units), delete account with typed confirmation, landing footer. Codex-reviewed plan. Session 49. |
| Write Settings screen spec | Small | Done | See UX_DESIGN.md Section 11. Settings is now a centered dialog overlay (not a route), triggered from the gear icon. Contains: input direction (kana-to-romaji/alternate/romaji-to-kana), mnemonics toggle, pronunciation audio toggle, key clicks toggle, auto-advance (instant/delayed). Account, JLPT, theme, and font moved to Profile. Visual shell built. Profile updated with Preferences card (JLPT with confirmation modal, locked theme/font, leaderboard visibility). Membership card layout updated (inline notify CTA). Fixture selector moved to floating pill. Key clicks wired to settings store and default off. Session 50. |
| Write Leaderboard screen spec | Small | Done | See UX_DESIGN.md Section 12. Visual shell built and iterated. Podium top-3 with animated trophy (float + sparkles) for rank 1, medal rings for 2/3. Independent Tap/Type/Swipe mode switchers per card. All Time/This Week toggle. Responsive: side-by-side Kana + Kotoba on desktop, single column with coloured game type switcher on mobile. Kotoba unlocked with fixture data. Landing page leaderboard preview added (all-time, no pinned user). Scales down to 320px. |
| Document global visual identity and asset list | Small | Done | UX_DESIGN.md Sections 1 and 2 written incrementally across screen spec sessions. Logo, key button style, sounds, mascot, parallax, scene themes all documented. |
| Build SVG assets | Medium | Done | 16 SVGs built in public/images/: logo, mascot, icons (lock, home, grove, forest, settings, tap, keyboard, profile, swipe, tree), hills, clouds. Built incrementally during screen spec sessions. |
| Source sound assets | Small | Done | Keyboard Click.mp3 sourced and wired to settings store key clicks toggle. Built during settings dialog session. |
| Build sample data files | Small | Done | samples/ folder with 4 fixture files: dashboard-fixtures.ts, kotoba-dojo-fixtures.ts, mastery-fixtures.ts, profile-fixtures.ts. Built incrementally during screen spec sessions. |
| Write Kotoba practice screen spec (Readings input) | Medium | Done | UX_DESIGN.md Section 13. Show kanji, user produces kana reading. Tap: kana grid with furigana. Type/Swipe: kana input with ZWSP. One-way direction (no alternation). |
| Write Kotoba practice screen spec (Kanji input) | Medium | Done | UX_DESIGN.md Section 14. Show English, user produces kanji. Tap: two-stage (kana then kanji selection from 4 options). Type/Swipe: native IME kanji selection. 2x Tap / 4x Type+Swipe scoring. Answer normalization policy. |
| Build Kotoba practice screen visual shells | Large | Done | KotobaGameWindow built from scratch. Readings mode: kanji prompt with ruby furigana. Kanji mode: English prompt, furigana + kanji option buttons (Tap), persistent kanji area (Type/Swipe). Settings: inputMode, kotobaInput (Readings/Kanji with 4x badge) added to store and dialog. Practice route reads ?mode=kana/kotoba. Dynamic tap grids. Similar kanji distractors. 16 fixture words. Kana-only word handling. Hint system (3 wrong). Onboarding routes to /home. |
| Consolidate approved designs into FRONTEND.md and UX_DESIGN.md | Medium | Done | Full audit of all 9 MD files against codebase. 27 discrepancies found and fixed. Heatmap colours, font sizes, file names, route structure, onboarding steps, constants, leaderboard spec all updated. LandscapeBackgroundV2 renamed to landscape-background.tsx (kebab-case). |

---

## Sprint 3 - Authentication and Onboarding ✅ COMPLETE

**Goal:** Users can sign up, log in, and complete the onboarding flow.
**Status:** Complete

| Task | Size | Status | Notes |
|---|---|---|---|
| Set up Supabase Auth (email and password) | **Medium** | **Done** | auth.service.ts (signUp, signIn, getUser, sendPasswordReset), Supabase browser+server clients, middleware, auth callback route all built in Sprint 2B. Verified and wired in this sprint. |
| Build sign-up screen | **Medium** | **Done** | sign-up-card.tsx wired to auth.service.signUp(). Loading/error states. Anonymity reminder added. Redirects to /onboarding/step-1 on success. |
| Build log-in screen | **Small** | **Done** | log-in-card.tsx wired to auth.service.signIn(). Checks onboardingComplete, routes accordingly. Forgot password flow with sendPasswordReset(). |
| Build guest mode | **Small** | **Done** | "Try it now" routes through onboarding (localStorage via Zustand persist). GuestBanner component in (main) layout. Dismissible per session. /leaderboard and /profile are auth-only. |
| Build onboarding step 1 - JLPT self-assessment | **Medium** | **Done** | Visual shell from Sprint 2B. Stores jlptLevel in onboarding store (localStorage). Synced to Supabase profile at completion (step 3). |
| Build onboarding step 2 - early character unlock | **Large** | **Done** | Visual shell from Sprint 2B (step 2 + step 2b). Character selections stored in onboarding store. Synced to manual_unlocks table via syncManualUnlocks() at completion. |
| Build onboarding step 3 - notification preferences | **Small** | **Deferred** | Deferred to Sprint 10 per AUTH.md. Contextual prompt after first practice session. |
| Build onboarding step 4 - input mode selection | **Small** | **Done** | Visual shell from Sprint 2B (step 3 in the 3-step flow). Input mode synced to profile at completion. |
| Build user profile record in Supabase | **Medium** | **Done** | profiles table + handle_new_user trigger created in Sprint 1. profile.service.ts implemented with loadProfile() and updateProfile(). Tested. |
| Write auth tests | **Medium** | **Done** | 380 tests total. Auth: auth.service (33), useAuth hook (4), user.store (7), profile.service (4), unlock.service (6), guest-banner (5). |
| Add `practice_sessions` table to Supabase | **Small** | **Done** | Migration 20260428120000. RLS + FORCE RLS + indexes. Needs `supabase db reset` to apply locally. |
| Add `username_changed_at` to profiles | **Small** | **Done** | Same migration. Also adds distance_unit column. |
| Restore `/profile` to auth-only routes | **Small** | **Done** | middleware.ts AUTHED_ONLY_ROUTES restored to ['/leaderboard', '/profile']. /onboarding left open for guests. |

---

**Note on multi-language support:** The engine layer (Sprint 4 onwards) is the
language-neutral core. Character IDs, mastery scores, word counters, selection
weights, and unlock thresholds are all agnostic to the target language. Thai is
the planned second language (the owner speaks Thai). Japanese-specific concepts
(JLPT levels, kana types, romaji, IME handling) live in the data and UI layers,
not in the engine. When naming engine abstractions, keep them generic.

---

## Sprint 4 - Core Game Engine ✅ COMPLETE

**Goal:** The mastery system, word counter, and character selection logic are built and tested.
No UI yet. This is pure logic.
**Status:** Complete

| Task | Size | Status | Notes |
|---|---|---|---|
| Build character mastery store (Zustand) | **Medium** | **Done** | Zustand + persist (localStorage key: langtap-mastery, skipHydration, version 1). Actions: increment, bulkLoad (max merge + sanitize), reset, resetAll, getScore, hasEncountered. hasHydrated gate for hydration safety. Types: MasteryScoreMap, CharacterWithMastery, UnlockSource in game.types.ts. WordBankEntry, WordCounterMap in word.types.ts. PromptResult, SelectionResult, SessionScore in session.types.ts. 26 tests passing. |
| Build character unlock logic | **Medium** | **Done** | isCharacterUnlocked (mastery threshold OR manual), isWordEligible (all chars unlocked, false for empty), isWordEligibleByUnlockedSet (precomputed set variant for selection), getUnlockedCharacterIds (strict dataset contract), getUnlockSource (mastery/manual/mastery_and_manual). Defensive safeScore normalisation for NaN/Infinity/negative. 62 tests passing (shared with progression). |
| Build word counter store | **Medium** | **Done** | Engine: incrementWordCounter, shouldResetCounters, resetCountersForCharacter, getWordCounterWeight, sanitizeCounter. Store: session-scoped (no persist), in-memory only. resetAll() on session start. bulkLoad is replace-all for session resumption. 42 tests passing. |
| Build character selection algorithm | **Large** | **Done** | selectNextPrompt orchestrator, buildWordIndex (one-pass eligible word grouping), buildCharacterWeights (mastery weighting on feasible set), weightedRandomDraw (generic, injectable RNG, strict preconditions), selectWordForCharacter (JLPT preference, fallback, counter reset, secondary counter weighting). Returns SelectionResult with updatedCounters. Feasible-set prefilter eliminates retry loops. 31 tests passing including seeded statistical distribution tests. |
| Build unlocking progression sequence | **Medium** | **Done** | isGroupComplete, getActiveGroup, getActiveCharacterIds, getCompletedGroupCount, getContiguousCompletedCount. All in engine/unlock.ts. Active group is open-mode (does not restrict selection pool). Tested with real PROGRESSION_GROUPS data. 62 tests passing (shared with unlock logic). |
| Build distance/progress mechanic | **Small** | **Done** | calculateDistanceIncrement (base + speed bonus, invalid inputs to base), convertToFeet, formatDistance (metric m/km, imperial ft/mi, negative clamped to 0). Constants: MAX_RESPONSE_TIME_MS, BASE_DISTANCE_INCREMENT, METRES_TO_FEET, STREAK_START_THRESHOLD. 23 tests passing. |
| Build session score tracker | **Small** | **Done** | Zustand store (in-memory, no persist). startSession (reset + active), endSession, recordCorrect (count + distance + encountered set), recordWrong (count + encountered set), addDuration, reset. charactersEncountered is Set<string> for automatic uniqueness. 11 tests passing. |
| Build streak engine | **Medium** | **Done** | deriveStreakState (two-phase: backward chain collection, forward threshold + grace evaluation), getCalendarDays (window rendering with practiced/grace/pre-streak/missed statuses). 3-day start rule enforced. Grace is per-gap reusable. todayStatus: active/pending/broken (no grace state per Codex review). Returns streakDays + preStreakDays sets for calendar. 34 tests passing. |
| Write game engine tests | **Large** | **Done** | engine/scoring.ts implemented (evaluateCharacterAttempt, evaluateWordResult with max() for duplicate characters). 13 scoring tests. Data integrity already covered by existing characters.test.ts (12 tests). Integration tests embedded in selection (statistical), unlock (progression), and streak (state machine) test files. Full suite: 622 tests passing, 0 failures. 2 skipped (romaji, sokuon - Sprint 5). |

---

## Sprint 5 - Content Pipeline and Practice Screen (Type Mode) ✅ COMPLETE

**Goal:** Word bank and kana character data are generated and committed. Kana practice screen wired to real engine. Progression system redesigned.
**Status:** Complete

| Task | Size | Status | Notes |
|---|---|---|---|
| Build `data/kana/characters.ts` | **Medium** | **Done** | Expanded from 208 to 234 characters. Renamed yoon to combination. Added Vu row, extended combinations, 3 special characters. |
| Build `scripts/build-word-bank.ts` | **Medium** | **Done** | Reads JMDict JSON, NFC normalization, greedy two-char-first decomposition. Generates N5-N1. |
| Run build script and commit word bank files | **Small** | **Done** | Word bank integrity tests passing. |
| Build bonus katakana word bank | **Medium** | **Done** | 555 katakana loanwords in `data/words/kt.ts`. Separate from JLPT levels. Included in `ALL_WORDS` for kana selection. |
| Reorder progression groups | **Medium** | **Done** | H1,H2,K1,K2 pattern. Paired initial unlocks (H1+H2 = 21 chars, K1+K2 = 22 chars). Sokuon and longvowel added to group 1. |
| Build auto-progression engine | **Medium** | **Done** | `isReadyToProgress()`, `getCurrentStepIndex()`, `getNextUnlockIds()` in engine/unlock.ts. UNLOCK_STEPS defines paired/single group progression. |
| Wire practice screen to engine | **Medium** | **Done** | `usePracticeSession` hook (191 lines), `unlock.store.ts` (111 lines). Real engine replaces mock game loop. |
| Remove unused features | **Small** | **Done** | Removed bottom nav, romaji variants, romaji engine. Mnemonics deferred as optional. Settings hints toggle renamed from mnemonics. |

---

## Sprint 5B - Kotoba Wiring and Dojo

**Goal:** Kotoba dojo wired to real word bank data. Word mastery store built. Kotoba auto-progression: 12 words per level, master to 5 before next level unlocks.
**Status:** Done

| Task | Size | Status | Notes |
|---|---|---|---|
| Categorise all word banks by theme | **Large** | **Done** | New workflow: categorise-first, then build lessons. All 5 JLPT levels categorised into markdown files in `data/words/kotoba-levels/categories/`. N5: 684 words, 49 categories. N4: 640 words, 57 categories. N3: 1,717 words, 108 categories. N2: 1,776 words, 136 categories. N1: 3,426 words, 151 categories. All validated: 0 duplicates, 0 missing. Old level files (n5.ts, n4.ts, n3.ts) removed pending rebuild. Session 73. |
| Build all Kotoba levels from categories | **Large** | **Done** | Built `scripts/build-kotoba-levels.ts` to read categories in order, split by 12, write TypeScript. Removed `theme` from KotobaLevel type (unused). N5: 57 levels. N4: 54 levels (last has 4). N3: 144 levels (last has 1). N2: 148 levels. N1: 286 levels (last has 6). All validated: 0 duplicates, 0 missing. Session 73. |
| Build word mastery store (Zustand) | **Medium** | **Done** | Same pattern as character mastery store. `stores/word-mastery.store.ts` with `useWordMasteryStore`. Per-word scores, persist to localStorage (key: `langtap-word-mastery`). Hydration gate. `WordMasteryScoreMap` type added to `types/word.types.ts`. 26 tests. Session 73. |
| Build Kotoba auto-progression | **Medium** | **Done** | `engine/kotoba-progression.ts`: isKotobaLevelComplete, isKotobaLevelUnlocked, getActiveKotobaLevelIndex, getUnlockedKotobaWordIds. Level 0 always unlocked. Next level unlocks when all words in previous level hit score 5. Manual unlock per level. 23 tests. Session 74. |
| Wire Kotoba dojo to real data | **Medium** | **Done** | Replaced fixture data with real word bank levels and word mastery store. New adapter `data/words/kotoba-dojo-data.ts` converts WordBankEntry to KotobaWord, pairs levels into groups. N5 eager, N4-N1 lazy-loaded with race-safe tab switching. Word mastery store extended with manual unlocks (v2 migration). Word tile and level group fixed to use KOTOBA_MASTERY_THRESHOLD (15) instead of kana threshold (40). 734 tests. Session 75. |
| Wire Kotoba practice screen to engine | **Medium** | **Done** | Replaced fixture words with real mastery-weighted selection. New `engine/kotoba-selection.ts` (pool building, weighted draw, counter reset, distractor generation). New `hooks/useKotobaPracticeSession.ts` (hydration-aware, bridges progression + selection + stores). New `KotobaPrompt` view-model type. Game window wired with loading/empty states, `recordWordComplete(wasClean)` scoring. 767 tests. Session 76. |
| Design word mastery schema in Supabase | **Medium** | **Done** | Migration `20260501120000_create_word_mastery.sql`: `word_mastery` table (score, updated_at trigger) + `word_manual_unlocks` table (write-once). RLS on both. New `services/word-mastery.service.ts` (load/sync scores + manual unlocks). BACKEND.md updated (Sections 2.8, 2.9, 4.6, 5.2). Session 76. |
| Write Kotoba wiring tests | **Medium** | **Done** | 21 tests for `engine/kotoba-selection.ts` (pool, selection, counter reset, distractors, immutability). 12 tests for `services/word-mastery.service.ts` (load/sync scores + unlocks, empty/error cases). 767 total tests. Session 76. |

---

## Sprint 5C - Word Bank English Glosses Cleanup

**Goal:** Clean up English meanings across all word bank files. Differentiate words that share the same meaning by adding register/context tags in brackets. The standard/plain form keeps the bare meaning with no brackets. Only variants get a bracket tag to the right: e.g. "yes" for はい, "yes (Casual)" for ええ. Replace academic labels like (honorable), (humble) with natural tags: (Formal), (Casual), (Informal), (Polite). No words are deleted.
**Status:** Done

| Task | Size | Status | Notes |
|---|---|---|---|
| Audit all word banks for duplicate and unclear meanings | **Medium** | **Done** | `scripts/audit-word-meanings.ts` scans 8,244 words. Reports exact + normalised duplicates, bracket annotations (deny/keep categorised), casing issues, multi-definition counts. Output: `scripts/output/meaning-audit.md`. Session 78. |
| Rewrite bracket labels to natural register tags | **Large** | **Done** | `transformMeaning()` in `scripts/build-word-bank.ts`. Deny map: (honorable) to (Polite), (humble) stripped, (respectful) to (Formal), (col) to (Casual), (sl) to (Slang), etc. Grammar metadata removed: (uk), (abbr), (n), (vs), etc. All 8,244 words processed. Session 78. |
| Differentiate shared meanings with register context | **Large** | **Done** | `scripts/meaning-overrides.json` with ~200 composite-key overrides (`id:kana`). N5: 48 sets, N4: 24 sets, N3: 40 sets, N2: 38 sets, N1: 48 sets resolved. 0 exact duplicates remain. Overrides checked at build time. Session 78. |
| Enforce sentence case on all word bank meanings | **Small** | **Done** | `toSentenceCase()` in build script finds first letter character and uppercases it. Handles leading quotes/punctuation. 93.5% of words affected. Session 78. |
| Shuffle words within levels to break theme clusters | **Medium** | **Done** | Seeded Fisher-Yates shuffle in `scripts/build-kotoba-levels.ts`. Deterministic (seed per level + JLPT). All 689 levels rebuilt. Same-theme words no longer adjacent. Session 78. |
| Validate cleaned word banks | **Small** | **Done** | 16 new test assertions in `data/words/__tests__/word-bank.test.ts`: sentence case, denied brackets, empty meanings, idempotence. 789 tests pass. Session 78. |

---

## Sprint 6 - Input Modes (Kana + Kotoba)

**Goal:** All three input modes functional for both Kana and Kotoba practice.
**Status:** Done

| Task | Size | Status | Notes |
|---|---|---|---|
| Build Tap mode input (Kana) | **Medium** | **Done** | `components/game/tap-input.tsx` built and integrated into `game-window.tsx`. On-screen kana buttons, grid layout, responsive. Built in earlier sprints. |
| Integrate Tap mode into Kana practice | **Small** | **Done** | Wired into game window with mode switching. All three modes (tap/type/swipe) selectable from practice screen. |
| Build Swipe mode input (Kana) | **Medium** | **Done** | `components/game/swipe-input.tsx` built and integrated. Native mobile keyboard with swipe support. |
| Integrate Swipe mode into Kana practice | **Small** | **Done** | Wired into game window alongside tap and type modes. |
| Build Kotoba Readings input mode | **Large** | **Done** | Kotoba game window supports all three input modes for kana reading entry. Furigana fills character-by-character. |
| Build Kotoba Kanji input mode | **Large** | **Done** | Kanji mode with IME input (type/swipe) and kanji option buttons (tap). Distractor generation from word bank. |
| Build Kotoba Tap two-stage flow | **Medium** | **Done** | Tap mode: stage 1 (kana from grid), stage 2 (select kanji from 4 options). Both stages wired with feedback. |
| Wire settings store to game windows | **Small** | **Done** | Fixed `game-window.tsx`: replaced local `useState` with `useSettingsStore.inputDirection`. Alternate mode toggles per word, fixed modes stay locked. Session 79. |
| Implement Kanji 4x scoring multiplier | **Small** | **Done** | `KANJI_INPUT_MULTIPLIER = 4` in `engine/constants.ts`. `recordWordComplete` accepts optional `scoreMultiplier`. Kotoba game window passes 4 for kanji, 1 for readings. Session 79. |
| Test all modes end to end | **Medium** | **Done** | 10 new tests: `engine/__tests__/kotoba-scoring.test.ts` (multiplier constant), `stores/__tests__/settings.store.test.ts` (inputDirection, kotobaInput, hints). 799 total tests. Session 79. |

---

## Sprint 7 - Dojo Screens (Kana + Kotoba)

**Goal:** Both Kana and Kotoba dojo screens are complete with real mastery data, progress tracking, and unlock controls.
**Status:** Done

| Task | Size | Status | Notes |
|---|---|---|---|
| Wire Kana Dojo to mastery store | **Medium** | **Done** | `kana-dojo-client.tsx` reads from `useMasteryStore`. Real mastery scores, heatmap colouring, live state. Built in earlier sprints. |
| Build Kana Dojo layout | **Medium** | **Done** | Hiragana/Katakana groups, collapsible stages (Seion, Dakuon, Combination), progress bars with heatmap colours. Built in earlier sprints. |
| Build character progress bar component | **Small** | **Done** | `ProgressBar` component with heatmap fill from `engine/mastery.ts`. Built in Sprint 2. |
| Build individual character unlock interaction | **Small** | **Done** | Locked tile tap opens unlock prompt with confirmation. Wired to unlock store. 16 kana dojo tests. |
| Build bulk unlock interaction | **Small** | **Done** | Page-level and stage-level unlock buttons with two-step confirmation. Wired to unlock store. |
| Wire Kotoba Dojo to word mastery store | **Medium** | **Done** | `kotoba-dojo-client.tsx` reads from `useWordMasteryStore`. Progression-based locking via `getUnlockedKotobaWordIds`. N5 eager, N4-N1 lazy-loaded. 24 kotoba dojo tests. Built in Sprint 5B, fixed in Session 77. |
| Gate Kotoba Mode behind kana progress | **Small** | **Done** | Removed. Kotoba is open from the start for all users. Decision made in Session 77. |
| Write Dojo tests (Kana + Kotoba) | **Medium** | **Done** | Kana: 16 tests (collapse, unlock, bulk unlock, reset). Kotoba: 24 tests (tabs, groups, tiles, popover, unlock, bulk unlock, state props). 40 total. |

---

## Sprint 7B - Tutorial and Guidance System

**Goal:** New players understand how the game works through in-game guidance. A mascot character delivers dialogue via Pokemon-style typewriter overlays. Dojo screens show contextual banner tips. Characters require 5 correct picks before appearing in words.
**Status:** Done

| Task | Size | Status | Notes |
|---|---|---|---|
| Build dialogue overlay component | **Medium** | **Done** | `components/game/dialogue-overlay.tsx`. Themed card (green for kana, blue for kotoba, cream default) with mascot bottom-left, white speech bubble right side, typewriter at 50ms/char. Continuous message flow. Skip/Got it press-in buttons themed to match card. Optional `onSkip`/`skipLabel` for skip-trial. Fixed height 340px, scrollable bubble with `scrollbar-gutter: stable`. 10 tests. Session 80. |
| Build dialogue content and sequencing system | **Small** | **Done** | `data/tutorial/dialogue-scripts.ts` (all scripts keyed by trigger ID), `hooks/useDialogueSeen.ts` (localStorage tracking with `useSyncExternalStore`, same pattern as dojo help-card). Session 80. |
| Implement dialogue scripts | **Medium** | **Done** | Chained dialogue flow in `practice-client.tsx`. Kana: intro then settings then mode-specific (all green themed). Kotoba: mode-specific (blue themed). Skip trial on mode dialogues. Mode switch triggers unseen mode's dialogue + trial. Per-mode trial tracking. Post-trial/post-kotoba banners (kana=sage, kotoba=blue). Session 80. |
| Build tutorial trial round | **Medium** | **Done** | Kana trial: 3 chars (あいう) + 3 words (あう, いえ, うえ) in green-themed GameWindow with restricted tap grid (groups 0+1). Kotoba trial: 3 words (水, 犬, 猫) in blue-themed KotobaGameWindow. Both sandboxed (no mastery/counter writes). Per-mode tracking (`kana-trial-tap`/`type`/`swipe`, `kotoba-trial-tap`/`type`/`swipe`). Skip trial button on mode dialogues. Post-trial banners above game window. Session 80. |
| Build dojo banner tips (Kana) | **Small** | **Done** | Refactored `help-card.tsx` to sequential tip system. Two kana tips: welcome + refresher. `useKanaTips` hook tracks tip index in localStorage. Tips show one at a time, advance on dismiss. Session 83. |
| Build dojo banner tips (Kotoba) | **Small** | **Done** | Two kotoba tips: welcome + explore. `useKotobaTips` hook. Blue-themed HelpCard with 言 icon. Renders above JLPT tab row in `kotoba-dojo-client.tsx`. Session 83. |
| Build inline kana learning phase | **Large** | **Done** | Separate learning scores (0-5) and mastery scores (0-40+). Learning scores unlock characters via single-char drills. Mastery scores drive heatmap from word practice only. Three sets: practiceAvailable, wordEligible, dojoUnlocked. `engine/practice-eligibility.ts` (5 functions, 15 tests). `selectNextKanaPrompt` with 60/40 mixing, manual unlock bypass, special exclusion (6 tests). Auto-unlock bootstrap removed. Hydration gated on both mastery + onboarding. Three-state dojo tiles (locked/learning/unlocked). v1 migration backfills learningScores. 7 new mastery store tests. Codex-reviewed x4. Sessions 82-83. |
| Write mascot ChatGPT image prompt | **Small** | **Done** | Prompt written, owner generated 3 poses (neutral, encouraging, thinking) via ChatGPT. PNGs in `public/images/mascot/`. Session 80. |
| Build guest trial cap (30m) | **Medium** | **Done** | `stores/guest-distance.store.ts` (separate persisted store, keyed by gameType). `GUEST_TRIAL_DISTANCE_CAP = 30` combined across kana + kotoba. Game window greys out (`pointer-events-none opacity-50`) at cap. `GuestBanner` shows on every visit (resets on route change), non-dismissable at cap. 4 store tests, 6 banner tests. Sessions 80-83. |
| Fix kanji distractor character count | **Small** | **Done** | `generateKotobaDistractors` now filters by matching kanji character length first (e.g. single-kanji words get single-kanji distractors). Falls back to any length only if not enough same-length matches. Session 80. |
| Write tutorial system tests | **Small** | **Done** | `tutorial-system.test.tsx`: 8 tests covering dialogue theme rendering, skip trial button, dialogue seen tracking (localStorage), guest trial cap (combined 30m). Session 83. |

---

## Sprint 7C - Server-Side Guest Trial Cap

**Goal:** Move the guest trial counter from localStorage to Supabase using anonymous auth. The 30m combined cap is enforced server-side. Editing localStorage no longer bypasses the cap. Clearing cookies starts a fresh guest (acceptable). 3-day retention for anonymous guest data.
**Status:** Complete

| Task | Size | Status | Notes |
|---|---|---|---|
| Enable Supabase anonymous sign-ins | **Small** | **Done** | Enable in Supabase dashboard. Anonymous users get `user.is_anonymous = true`. No email/password required. |
| Create `guest_usage` table and migration | **Medium** | **Done** | Table: `user_id` (PK, FK to auth.users on delete cascade), `kana_distance` (int, default 0), `kotoba_distance` (int, default 0), `capped_at` (timestamptz, null), `created_at`, `updated_at`, `expires_at` (default now() + interval '3 days'). RLS: guests select own row only. No direct client insert/update/delete. |
| Build RPCs for guest usage | **Medium** | **Done** | `get_or_create_guest_usage()`: creates/returns anonymous guest row. `increment_guest_usage(game_type, metres)`: clamps increments, never lets combined total exceed 30, sets `capped_at` when cap reached. All writes go through RPC, not direct table access. |
| Add restrictive RLS for anonymous users | **Medium** | **Done** | Anonymous users cannot write to `mastery`, `word_mastery`, `manual_unlocks`, `practice_sessions`, or `profiles`. Check `is_anonymous` JWT claim in policies. Only permanent authenticated users can write to account tables. |
| Build `services/guest-usage.service.ts` | **Medium** | **Done** | `ensureGuestSession()`: calls `signInAnonymously()` only when no user exists. `loadGuestUsage()`: calls `get_or_create_guest_usage` RPC. `incrementGuestUsage(gameType, metres)`: calls `increment_guest_usage` RPC. |
| Build `useGuestUsage` hook | **Medium** | **Done** | Ensures anonymous session for guest practice. Loads server usage before active practice mounts. Exposes `isLoading`, `isOverCap`, `usage`, and `increment`. Replaces `useGuestDistanceStore` as cap authority. |
| Update `useAuth` for anonymous users | **Small** | **Done** | Add `isAnonymous` to AuthUser. `isGuest = no user OR user.isAnonymous`. `isAuthenticated = user exists AND !isAnonymous`. Anonymous users allowed on guest routes but not treated as permanent for /profile or auth redirects. |
| Update middleware for anonymous users | **Small** | **Done** | Anonymous users can view/play guest routes. Not treated as permanent users. Not redirected away from sign-up/login. Cannot access permanent-only profile behaviour. |
| Wire `PracticeClient` to server usage | **Medium** | **Done** | Stop using localStorage `guest-distance.store` as cap authority. Gate active practice on server usage via `useGuestUsage`. If usage loading and not permanent user, render scene shell only. If capped, render static disabled card + signup CTA. No `GameWindow`/`KotobaGameWindow`/practice hooks when capped. |
| Update `GuestBanner` to server usage | **Small** | **Done** | Read cap state from `useGuestUsage` instead of `useGuestDistanceStore`. Same visual behaviour (shows at cap, resets on route change). |
| Handle sign-up from anonymous guest | **Small** | **Done** | When guest signs up, permanent auth takes over and guest cap no longer applies. Do not import guest usage into leaderboard. Guest usage rows deleted on sign-up or left for 3-day cleanup. |
| Build guest data cleanup job | **Small** | **Done** | Daily scheduled SQL: delete anonymous users whose `guest_usage.expires_at < now()`. Also delete anonymous auth users with no `guest_usage` row older than 3 days. Cascading FK handles `guest_usage` deletion. |
| Write guest auth and cap tests | **Medium** | **Done** | Auth: anonymous user returns `isGuest: true, isAuthenticated: false, isAnonymous: true`. Middleware: anonymous not redirected as permanent. Service: creates session, loads/increments via RPC. Practice: server usage gates active practice. SQL/RLS: anonymous can select own row, cannot update directly, cannot write account tables, RPC cannot reduce distance or exceed 30m. |

---

## Sprint 8 - Smooth Game Loading and Navigation

**Goal:** Fix the blank practice screen, reduce initial payload, eliminate duplicate auth, and make every route transition feel like navigating within a game. Skeleton-first for cold load. Stable frames for warm navigation. Gameplay never stalls because auth/profile/data is still resolving. No prefetch during active gameplay. Absorbs all tasks from the former Sprint 12 (Page Transition Speed and Rendering Performance).
**Status:** Done

**Implementation constraints (from Codex staff-engineer review):**
1. Auth initializer mounts in `(main)` and `(onboarding)` layouts, not root. Landing page must never be affected.
2. FPS targets are verification metrics (browser trace), not unit tests. Unit tests cover state behaviour only.
3. "Active gameplay" means: prompt visible and not completed, OR input in last 3-5 seconds, OR timers/meaning reveal active. Prefetch resumes on menus, loading shells, route idle, or after prompt completion settles.
4. Practice code/data split is two patches: first split Kana/Kotoba surfaces, then add async level loaders.
5. Shared scene layout lands after measurable wins, with before/after screenshots for home, practice, mobile, reduced motion, audio button, top-bar layering. Rollback checkpoint.
6. Cache strategy: version cyclist filenames and use immutable caching. No mixed approach.
7. Old practice URLs (`/practice`, `/practice?mode=kana`, `/practice?mode=kotoba`) all redirect correctly. Covers auth callbacks, saved links, browser history, tests.

### Phase A: Measurement Baseline

| Task | Size | Status | Notes |
|---|---|---|---|
| A1: Production bundle baseline | **Small** | **Done** | Run `next build`, record production page sizes and compressed transfer sizes (gzip/brotli) for landing, practice, home, kana dojo, kotoba dojo, leaderboard, profile. Dev-build `.next` chunks contain React Refresh, eval wrappers, and inline source maps, so current figures (13MB practice, 5.3MB landing) are inflated. Record real numbers. All subsequent budget targets are derived from this baseline. |
| A2: Browser waterfall and frame metrics baseline | **Small** | **Done** | Using Chrome DevTools on a production build (`next build && next start`), capture full waterfall for: cold landing page, cold `/practice`, warm home-to-practice, warm kana-to-kotoba mode switch, warm practice-to-dojo, back/forward between practice and dojo, onboarding-to-practice, auth callback-to-practice, settings open/close during practice, dojo kana/kotoba switch. Record time-to-first-paint, time-to-interactive, total transfer size, largest-contentful-paint, long tasks over 50ms, dropped frames during typing, and input latency. |
| A3: Reference benchmark against KanaDojo | **Small** | **Skipped** | Not needed. LangTap's numbers are strong on their own (1s FCP, 4s LCP, 188 kB practice). Reference comparison would not change any implementation decision at this point. |
| A4: Bundle analyzer setup | **Small** | **Skipped** | D2/D3 already proved Kana/Kotoba split via production build route sizes. Analyzer not needed retroactively. |

### Phase B: Immediate UX Fixes and Auth Architecture

B2 (split auth identity from profile) and C1 (centralize auth) are combined into one task (B2) to avoid touching the same logic twice.

| Task | Size | Status | Notes |
|---|---|---|---|
| B1: PracticeLoadingShell skeleton | **Small** | **Done** | Replace `<PracticeScene>{null}</PracticeScene>` in `PracticeClient` (line 476) with a `PracticeLoadingShell` component. The skeleton renders inside `PracticeScene` at the same position as the real game card: cream background (`#faf5e4`), matching shadow (`0_6px_0_0_#d4c9b0`), `rounded-2xl`, `max-w-md`, correct vertical centering (`top-[34%]`). Interior shows a subtle pulse placeholder for the character display area and input area. No game logic, no hooks, no stores. Shown during both `authLoading` AND guest usage loading. Cap gate stays before `ActivePracticeClient` so capped guests never mount playable sessions or heavy hooks. Test: auth loading renders skeleton, not blank. Test: capped guest never mounts `ActivePracticeClient`. |
| B2: Centralize auth and split identity from profile | **Medium** | **Done** | Two problems solved in one task. (1) Every `useAuth()` consumer (`hooks/useAuth.ts:34`) runs its own `getUser()` network call and `onAuthStateChange` subscription. Supabase documents `getUser()` as a network request. Components that call `useAuth` include AppTopBar, GuestBanner, PracticeClient wrapper, ActivePracticeClient, dojo pages, and onboarding. (2) The init function awaits `loadProfile()` before `setLoading(false)`, blocking practice render for profile data it does not need. Fix: create an `AuthInitializer` component mounted once in both `app/(main)/layout.tsx` and `app/(onboarding)/layout.tsx` (not root, so landing page is unaffected). The initializer calls `getUser()` once, sets auth identity on `useUserStore`, calls `setLoading(false)` immediately, then loads profile as a non-blocking background operation. Sets up one `onAuthStateChange` subscription. `useAuth` becomes a pure Zustand selector: reads user, profile, isLoading from the store, derives `isAuthenticated`, `isGuest`, `isAnonymous`. No `useEffect`, no Supabase calls, no subscription. Test: only one `getUser()` call in network waterfall regardless of consumer count. Test: signed-in users render practice (skeleton then game) before profile loads. Test: auth works correctly in onboarding routes. |
| B3: Configurable dialogue delay | **Small** | **Done** | In `components/game/dialogue-overlay.tsx`, replace the global `PAGE_LOAD_DELAY_MS = 800` constant with an opt-in `startDelayMs` prop defaulting to 0. The component uses this prop in the `useEffect` at line 99 instead of the hardcoded constant. In `practice-client.tsx` where `DialogueOverlay` is rendered (line 356), only the first tutorial dialogue (`kana-first-play`) passes `startDelayMs={400}` if needed. All other dialogue instances use the default 0. If the skeleton and auth split solve the original problem (typewriter starting before page loaded), the first tutorial may not need a delay either. |

### Phase C: Guest Usage and DNS

| Task | Size | Status | Notes |
|---|---|---|---|
| C1: Centralize guest usage state | **Small** | **Done** | Guest cap state is split across two `useGuestUsage()` instances: PracticeClient wrapper (line 473) and inside ActivePracticeClient (line 274). The wrapper uses it for cap gating, the inner for increment. If the inner increments past the cap, the wrapper's `isOverCap` may never update during the same session. Fix: lift guest usage state into a shared Zustand store or single provider, scoped to cap-aware surfaces (practice + guest banner). Do not move `ensureGuestSession()` into global auth init (it is side-effectful and would create anonymous Supabase users on any route visit). Both wrapper and inner read from the same source. Test: when inner increment pushes past cap threshold, wrapper's `isOverCap` updates in the same render cycle. Test: visiting non-practice routes does not create guest usage rows. |
| C2: DNS prefetch and preconnect for Supabase | **Small** | **Done** | In `app/layout.tsx` (root layout), add `<link rel="dns-prefetch">` and `<link rel="preconnect" crossOrigin="anonymous">` for the project's Supabase URL. Only the hostname, never the anon key. Resolves DNS before any auth or data calls, shaving 50-100ms off the first Supabase request. Read the Supabase URL from the environment at build time. |

### Phase D: Payload Reduction

Practice code/data split is two patches per implementation constraint #4: first split surfaces (D2), then add async loaders (D3).

| Task | Size | Status | Notes |
|---|---|---|---|
| D1: Cyclist asset reduction | **Small** | **Done** | Frames 2-14 are absolutely positioned inside the visible viewport, so `loading="lazy"` will not defer them. Fix: render only frame 1 (`<Image>`) on initial mount. After `requestIdleCallback`, mount the remaining 13 frames and begin loading them. Remove the `unoptimized` prop to enable Next.js image optimization (WebP/AVIF conversion and resizing). Convert source PNGs to WebP or AVIF before committing (version filenames, e.g. `01-v2.webp`). The existing `handleFrameLoad` and `allLoaded` logic handles waiting for all frames before starting animation. Verify frame 1 alone provides a stable visual (no layout shift, correct dimensions). Asset budget: total cyclist image transfer under 2MB compressed after optimization. Test: only frame 1 loads during initial render. Test: animation starts after remaining frames load on idle. |
| D2: Split Kana and Kotoba practice surfaces | **Medium** | **Done** | First patch of practice code/data split. Currently `PracticeClient` imports both `GameWindow` and `KotobaGameWindow` together, so Kana practice loads all Kotoba code and data. Fix: use `next/dynamic` to lazy-load `KotobaGameWindow` and its dependencies (`useKotobaPracticeSession`, kotoba levels, tap grids) only when `gameType === 'kotoba'`. The dynamic import boundary must be above the hook calls so Kotoba hooks are not imported in the Kana path. Also split `KotobaGameWindow` into `KotobaGameWindowInner` (pure view, receives session via props, no internal hook) and a wrapper that calls `useKotobaPracticeSession`. When an external session is provided (trial), render `KotobaGameWindowInner` directly. Test: Kana practice bundle does not include `KotobaGameWindow`, `useKotobaPracticeSession`, or kotoba level data. Test: rendering with external session does not import or execute `useKotobaPracticeSession`. |
| D3: Lazy-load word banks as cacheable level data | **Medium** | **Done** | Second patch of practice code/data split. Create a `WordBankDataService` with `loadWordBank(level)` and `loadKotobaLevels(level)`. Prefer generated static JSON assets under `/data-words/` and `/data-kotoba/` for large JLPT/Kotoba banks if bundle analysis shows TS dynamic imports still produce large JS chunks or parse/eval work. The loader caches resolved data module-wide, dedupes pending requests, loads the active level first, and idle-prefetches adjacent levels only when gameplay is inactive. `usePracticeSession` and `useKotobaPracticeSession` call the loader with the user's active JLPT level. The aggregate `WORD_BANK` and `ALL_WORDS` exports remain for tests and tooling only with a comment that they must not be imported in route code. Never swap the loaded word bank mid-prompt. If profile/onboarding changes the active JLPT level while a game is running, apply it on the next prompt selection or next route entry. The hook needs a loading state for cold direct `/practice/kana` loads, while cache hits should select a prompt synchronously. Define `resolvedPracticeLevel` on route entry and freeze until next prompt/route entry. If D3 uses static JSON, D4 must add `max-age=604800, stale-while-revalidate=86400` cache headers for those data assets. Test: Kana practice bundle does not include N1-N4 word data. Test: current prompt remains stable if JLPT profile data resolves late. Test: duplicate level requests share one pending promise. |
| D4: Cache-Control headers for static assets | **Small** | **Done** | LangTap already has cache headers in `vercel.json`; do not add conflicting rules in both `vercel.json` and `next.config.ts`. Choose one source of truth and keep it there. Cyclist frames use versioned filenames from D1, so `max-age=31536000, immutable` is safe. Audio files (`/audio/**` and `/sounds/**`) and fonts use immutable caching only when filenames are versioned or content-addressed. Non-versioned assets use shorter cache (`max-age=86400, stale-while-revalidate=3600`). If D3 moves word banks to static JSON assets, add `/data-words/:path*.json` and `/data-kotoba/:path*.json` with `max-age=604800, stale-while-revalidate=86400`. One clear rule: versioned filenames get immutable, non-versioned data/assets get short or revalidating cache. |

### Phase E: Route Architecture and Navigation Smoothness

| Task | Size | Status | Notes |
|---|---|---|---|
| E1: Convert `/practice` from query param to route segments | **Large** | **Done** | Currently `/practice?mode=kana` and `/practice?mode=kotoba` use `useSearchParams()` in `practice-client.tsx`. `useSearchParams` without a Suspense boundary forces Next.js to skip static rendering entirely. Fix: create `app/(main)/practice/kana/page.tsx` and `app/(main)/practice/kotoba/page.tsx` as separate routes. Each page passes a `gameType` prop to `PracticeClient`. Remove the `useSearchParams` import. Comprehensive link audit: update `practice-client.tsx`, `mode-panel.tsx`, `game-home-client.tsx`, `kana-dojo-client.tsx`, `kotoba-dojo-client.tsx`, `session-prefetch.tsx` (CORE_ROUTES array), auth callback redirects, onboarding completion redirects, dashboard CTAs, top-bar prefetch, and all tests. Add redirects: `/practice` -> `/practice/kana`, `/practice?mode=kana` -> `/practice/kana`, `/practice?mode=kotoba` -> `/practice/kotoba`. Old URLs must work for saved links, browser history, and auth callbacks. |
| E2: Add Suspense boundaries and loading shells | **Medium** | **Skipped** | Practice no longer gates on loading (renders immediately). No skeleton needed. Loading shells for dojo/home are nice-to-have but not blocking any user experience issue. |
| E3: Intent-based route prefetching with gameplay guard | **Small** | **Done** | Replace the fixed 500ms `setTimeout` in `session-prefetch.tsx` with `requestIdleCallback`-based prefetching. Add a "game is active" guard: no route or data prefetch while a prompt is visible and not completed, while input occurred in the last 3-5 seconds, or while timers/meaning reveal are active. Prefetch resumes on menus, loading shells, route idle, or after prompt completion settles. Priority order: current route's critical data first, next likely route on idle, nav/link intent on hover/touch/focus. Skip on slow connections (`navigator.connection.saveData` or `effectiveType === '2g'/'slow-2g'`). Update CORE_ROUTES to `/practice/kana` and `/practice/kotoba` after E1. Verify dojo "Practice" buttons (already `<Link>`) prefetch on viewport entry. |
| E4: PracticeDataPreloader | **Medium** | **Done** | New component mounted in the `(main)` layout after auth and store hydration. After auth identity is known and onboarding store is hydrated, reads the user's active JLPT level and game type preference. Calls `loadWordBank(level)` and `loadKotobaLevels(level)` from D3 to warm the module-level cache. Then on `requestIdleCallback`, prefetches adjacent JLPT levels. Respects the gameplay guard from E3 (does not prefetch during active practice). By the time a user navigates to `/practice`, word data is cached and the practice hook selects a prompt synchronously. Focuses on word banks, kotoba levels, and route chunks. Kana character/tap-grid data is comparatively small and not worth lazy-loading. Renders nothing. Does not block any render. |
| E5: Move landscape and cyclist to shared layout | **Large** | **Done** | Highest visual-risk task. Do after all Phase B-D wins are landed and verified. Currently `LandscapeBackground` and `CyclingCharacter` render inside both `game-home-client.tsx` and `practice-client.tsx`. Navigation between home and practice causes full unmount/remount and visible scene reset. Fix: create `app/(main)/(scene)/layout.tsx` wrapping only routes that show the landscape (home, practice). Layout owns fixed background at z-0. Pages render content in a z-10 slot. Top bar stays z-50. Background is `pointer-events-none`. Practice owns the centered card slot, not the background. `game-home-client.tsx` and `practice-client.tsx` become pure content components. Routes like dojo, profile, leaderboard stay outside this layout group. Rollback checkpoint: capture before/after screenshots for home, practice, mobile, reduced motion, audio button positioning, and top-bar layering. Test: warm home-to-practice navigation does not unmount landscape or cyclist. |
| E6: Scroll restoration | **Small** | **Done** | Implement scroll restoration for back/forward navigation on scrollable pages (dojo pages can be long). Use `window.history.scrollRestoration = 'manual'` and a custom hook that saves scroll position per pathname. Add to the `(main)` layout. Prevents jarring scroll-to-top on back navigation. |
| E7: Page transition animation (optional) | **Medium** | **Done** | Optional. Only implement after waterfall and frame verification pass in Phase G. A fade can hide problems but also adds paint/composition work. If implemented: subtle fade transition between routes within the `(main)` layout group. Use CSS `animation: fadeIn 150ms ease-out` on mount, not experimental `viewTransition` (must be validated locally first). Test that it does not conflict with landscape persistence from E5. Do not use to mask real performance issues. |
| E8: Key-sound warmup | **Small** | **Done** | Current key sounds fetch and decode on first use, which can drop the first click or create a small hitch. After the first trusted user gesture, warm only the most common practice sounds (`e`, `o`, tap correct/wrong, nav click) if key clicks are enabled. Do not decode audio during an active prompt. Respect the existing `keyClicks` setting, browser autoplay policy, and module-level audio buffer cache. Test: first enabled key sound has a decoded buffer before active typing begins. Test: no audio warmup work runs while gameplay is active. |

### Phase F: Landing Page

| Task | Size | Status | Notes |
|---|---|---|---|
| F1: Lazy-load interactive landing page islands | **Medium** | **Skipped** | Skipped: landing page is 237 kB which is acceptable. The auth modals pull in Supabase client (175 kB) but lazy-loading them would delay first sign-up click. The performance problem was never the landing page, it was practice (now fixed by D2/D3). Not worth the complexity. |

### Phase G: Verification and Budgets

| Task | Size | Status | Notes |
|---|---|---|---|
| G1: Production bundle verification | **Small** | **Done** | Practice 552->188 kB (-66%), home 169->117 kB (-31%), landing flat at 238 kB. Warm home->practice only 60 kB extra (prefetched). Session 90. |
| G2: Browser waterfall and gameplay metrics verification | **Small** | **Done** | Lighthouse on production build with local Supabase. FCP 1.0s, LCP 3.9-4.1s, CLS 0, Speed Index 2.1s. Network requests from 514 to 39-79 after font subsetting. Session 90. |
| G3: Lighthouse audit | **Medium** | **Done** | Run locally (not Vercel preview). Accessibility 95-96, Best Practices 96-100. Performance 61-63 (capped by TBT from Supabase client init, not font/network). Font strategy fixed: self-hosted subset, 3 files, 119 kB total. Session 90. |
| G4: Performance budget enforcement | **Small** | **Done** | Updated `check-bundle-budget.ts` with route-specific budgets (`/practice/kana`, `/practice/kotoba`). Largest-chunk-size check (150 kB max). Budgets from G1 actuals +25% headroom. Session 91. |
| G5: Real-user performance telemetry | **Small** | **Done** | Added `@vercel/speed-insights` to root layout. Zero-config, production-only. Tracks INP, CLS, LCP, FCP, TTFB. Session 91. |
| G6: Automated performance smoke suite | **Medium** | **Done** | Playwright (28 tests, desktop + mobile). `performance:smoke` and `performance:trace`. Real link clicks, 4x CPU throttle, TaskDuration assertions, bundle leakage checks. Lighthouse CI (`npm run lighthouse`) with 5 URLs, 3 runs, numeric assertions. Session 91. |
| G7: Codex staff-engineer review of Sprint 8 | **Small** | **Done** | Three Codex review passes. Fixed: cap gate, build gate, JLPT level resolution, gameplay guard, cyclist WebP, stale profile race, word bank loading model, Kotoba level selection. Session 91. |

### Tests Required

- Capped guests never mount active practice hooks while usage is loading or capped
- Auth loading renders `PracticeLoadingShell` skeleton, not blank content
- Signed-in users can render practice before profile has loaded
- Only one `getUser()` call appears in network waterfall regardless of consumer count
- Auth initializer works correctly in both `(main)` and `(onboarding)` routes
- When inner guest usage increment pushes past cap, wrapper's `isOverCap` updates immediately
- Visiting non-practice routes does not create guest usage rows
- Current prompt remains stable if JLPT profile data resolves late
- Kana practice bundle does not include `KotobaGameWindow`, `useKotobaPracticeSession`, or kotoba level data
- Kana practice bundle does not include N1-N4 word data
- Duplicate word-bank or kotoba-level requests for the same JLPT level share one pending promise
- Only cyclist frame 1 loads during initial render; animation starts after idle frames load
- No route/data prefetch fires while a prompt is active or input in last 3-5 seconds
- Audio warmup never fetches or decodes key sounds during active gameplay
- Automated performance smoke suite catches major regressions without manual clicking through every route
- Old practice URLs (`/practice`, `/practice?mode=kana`, `/practice?mode=kotoba`) redirect correctly
- Warm home-to-practice navigation does not unmount landscape or cyclist
- Route transition shows skeleton or stable frame, never empty content

### Execution Order

Phase A first (baseline measurements, KanaDojo reference benchmark, bundle analyzer setup). Then B (skeleton + auth architecture + dialogue delay). Then C (guest usage + DNS). Then D (cyclist assets, then Kana/Kotoba surface split, then async/cacheable word loaders, then cache headers). Then E (route segments, Suspense shells, prefetch with gameplay guard, data preloader, shared scene layout, scroll restoration, optional page transitions, key-sound warmup). Then F (landing page). Then G (verification against baseline, budgets, telemetry, automated performance smoke suite).

Cross-phase dependencies: D2 before D3. E1 before E2, E3, and E4. D3 before E4. B1 reused in E2. D1 before D4 (versioned filenames). All of B-D before E5 (shared layout needs stable foundation).

**Relationship to previous sprints:** Sprint 12 (Page Transition Speed and Rendering Performance) has been fully merged into this sprint. All Sprint 12 tasks are present: E1 (route segments), E5 (shared scene layout), E2 (Suspense boundaries), E3/D4 (prefetch and cache headers), C2 (DNS prefetch), G3 (Lighthouse audit), E7 (page transitions), E6 (scroll restoration). Sprint 11 task "Performance audit" is marked Done, with remaining performance work absorbed into Sprint 8.


---

## Sprint 9 - Leaderboard and Audio

**Goal:** Complete the game experience. Leaderboard is live and functional with full support for the existing UI (Kana/Kotoba, Tap/Type/Swipe, All Time/This Week). All audio (word pronunciation and lo-fi background) is integrated. Game-centric features are finished before moving to account infrastructure.
**Status:** Pending

**Assumptions:**
- Weekly leaderboard is in scope because the UI already exposes the All Time/This Week toggle.
- Do not reuse the old one-row-per-user leaderboard concept. The schema must support game_type, input_mode, period, and week boundaries natively.
- Leaderboard writes are server-only via security-definer RPC. No client owner-write RLS for scores.
- Legacy leaderboard table (if any) is left in place unless the owner explicitly approves a cleanup migration later.

| Task | Size | Status | Notes |
|---|---|---|---|
| Design leaderboard Supabase schema | **Medium** | **Done** | Score-event-backed schema: `leaderboard_scores` (aggregate read surface) + `leaderboard_score_events` (idempotency + audit). Supports game_type, input_mode, total_score, week_score with lazy weekly rollover. No public SELECT - reads via RPC only. Session 93. |
| Build leaderboard score sync (server-only RPC) | **Medium** | **Done** | `record_leaderboard_completion` RPC: delta-based scoring (capped at 20), anonymous rejection, rate limiting, idempotency via event_id. `get_leaderboard` RPC: visibility filtering, row_number ranking, pinned user. Service layer + game window integration. Session 93. |
| Add leaderboard privacy (profiles.leaderboard_visibility) | **Small** | **Done** | Column added in earlier migration. Profile toggle wired. RPC filters by visibility. Session 93. |
| Build leaderboard screen | **Medium** | **Done** | Wired to real Supabase data via useLeaderboard hook with 60s cache TTL. Default mode from settings store. Mode tabs independent per card. Loading/error/empty states. Session 93. |
| Build leaderboard rank calculation | **Small** | **Done** | row_number() with total_score desc, user_id asc tiebreak. Weekly: effective_score reset to 0 for stale week_start. Pinned user outside top 50. Session 93. |
| Write leaderboard tests | **Medium** | **Done** | 42 tests: service unit (10), hook (7), scoring integration (12), UI (13). Covers RPC params, response transformation, cache, loading/error states, guest exclusion, scoring rules. Session 94. |
| Source and confirm lo-fi track licence | **Small** | **Done** | HoliznaCC0 - Public Domain Lofi. 17 tracks, CC0 licence, no attribution required. Session 94. |
| Integrate lo-fi background audio | **Small** | **Done** | 17 tracks in shuffled rotation. Previous/play/next controls. Lazy load on play click only. Preference persisted to localStorage. Auto-advances on track end. Session 94. |
| Build VOICEVOX generation script | **Medium** | **Done** | `scripts/generate-audio.ts` created. CLI args: --level, --dry-run, --speaker. Prerequisite checks (VOICEVOX running, ffmpeg installed). Batch processing (5 concurrent) with retry. Incremental (skip-if-exists). Auto-generates word-manifest.ts. npm script added. Session 94. |
| Generate word audio and build manifest | **Medium** | **Done** | 8,243 words generated via VOICEVOX (Shikoku Metan, 0.85x speed, 44.1kHz, max quality). Organized by JLPT level in public/audio/words/n5..n1/. Manifest maps word ID to level. useWordAudio hook wired into both game windows. Plays on word completion. Session 94. |
| Write audio tests | **Small** | **Done** | 7 tests: manifest path resolution, useWordAudio no-load-on-mount, settings toggle, unknown IDs, fetch on valid ID. Session 94. |
| Server-derived leaderboard scoring | **Large** | **Done** | True verification: prompt catalog (8,243 words with expected romaji/kana/kanji), server-issued sessions, server computes scores from raw submitted inputs. Old RPC retired. Codex reviewed through 4 iterations. Session 95. |
| Leaderboard bug fixes (Codex review) | **Small** | **Done** | Kanji clean scoring checks kanjiWrongCount. Lo-fi auto-advance fixed. Default mode persisted to settings store. Profile visibility wired to Supabase with optimistic update. Wrong kanji tap increments kanjiWrongCount. Session 94-95. |

---

## Sprint 10 - Accounts, Auth, and Membership

**Goal:** Guest-to-account conversion works end-to-end. Signed-in users have all progress synced to Supabase. Google and Apple sign-in available. Membership tiers defined and enforced (free tier daily cap). Profile and settings fully wired. Guest progress import is validated and safe.
**Status:** In Progress

**Architecture:** Plans v10 approved after 10 rounds of Codex staff-engineer review. Full plans in `~/Downloads/Plans.md`. Key decisions: profile-level domain epoch with row lock serialization, checkpoint sync via RPCs (not client upsert), user-scoped localStorage, dual-marker guest session verification, import quarantine model.

### Phase 0: Fix RLS + Schema (blockers)

| Task | Size | Status | Notes |
|---|---|---|---|
| Fix anonymous write blocking RLS + cleanup rows | **Medium** | **Done** | Broken permissive "block anonymous" policies replaced with combined `user_id + is_permanent_user()` policies. Anonymous-owned rows cleaned up. word_counters and profiles (previously unprotected) now covered. Migration `20260507120000`. Session 97. |
| Add learning_score, epoch columns + updated_at trigger | **Small** | **Done** | `learning_score` (0-5) on mastery, backfilled with `least(score, 5)`. `mastery_reset_epoch` and `word_mastery_reset_epoch` on profiles. `set_mastery_updated_at` trigger. Same migration `20260507120000`. Session 97. |
| Create kana_character_catalog + verify word catalog completeness | **Small** | **Done** | 234 kana characters seeded. Word catalog reseeded: 8798 words (8243 JLPT + 555 katakana). Public read policies added to both catalogs. 7 completeness tests. Empty N1 word ID documented. Migration `20260507120001`. Session 97. |
| Create reset RPCs with row lock + epoch + unlock deletion | **Medium** | **Done** | 4 RPCs with profile row lock, epoch increment, and unlock cleanup. `reset_word_mastery` validates word_id against catalog. Migration `20260507120002`. Session 97. |
| Create username change RPC with server-enforced cooldown | **Small** | **Done** | `change_username` RPC, `lower(username)` unique index, BEFORE UPDATE trigger guard with `set_config` bypass. Migration `20260507120003`. Session 97. |
| Add user_tz, import columns to profiles + app_config table | **Small** | **Done** | `user_tz`, 4 import tracking columns, `app_config` table, `skip_guest_import` and `skip_legacy_import` RPCs. Migration `20260507120003`. Session 97. |
| Create checkpoint sync RPCs with row lock + exact epoch + ID validation + unlock RPCs | **Medium** | **Done** | 4 RPCs: exact epoch match, catalog validation, deduplication, greatest-merge. Profile row lock serialization shared with reset RPCs. Migration `20260507120004`. Session 97. |
| Migrate persisted stores to user-scoped localStorage keys | **Medium** | **Done** | All 5 persisted stores now use `createScopedStorage` adapter. `AuthInitializer` sets `setStorageUserId` before hydration. `scoped-storage.ts` provides helpers for legacy keys, guest keys, pending keys, session markers, dirty queues, and cleanup. Session 97. |

### Phase 1: Service Layer

| Task | Size | Status | Notes |
|---|---|---|---|
| Implement kana mastery service | **Medium** | **Done** | `loadMasterySnapshot` (scores + learningScores + epoch). `syncMastery` and `syncManualUnlocks` via checkpoint RPCs. `loadManualUnlocks` via direct query. 14 tests. Session 97. |
| Implement word counter service | **Small** | **Done** | `syncCounters` via plain client upsert (session-scoped best-effort, no epoch). Session 97. |
| Wire word mastery service calls | **Small** | **Done** | Added `loadWordMasterySnapshot` (scores + epoch), `checkpointWordMastery`, `checkpointWordManualUnlocks` via RPCs. Legacy direct-write functions retained for existing callers. 19 tests (7 new). Session 97. |
| **Codex gate: Phase 1 review** | - | **Done** | Codex found: non-atomic snapshot load (blocker), unsafe response casts, naming collisions. Fixed: atomic load RPCs (`load_mastery_snapshot`, `load_word_mastery_snapshot`), runtime response validation, renamed checkpoint functions, payload cap enforcement. Session 97. |

### Phase 2: Sync Infrastructure

| Task | Size | Status | Notes |
|---|---|---|---|
| Wire load-on-start for signed-in users | **Medium** | **Done** | StoreHydrator loads server data via atomic RPCs with epoch-aware merge. `replaceAll` and `epoch` added to mastery + word-mastery stores. `isServerHydrated` gates PracticeClient. Guests skip server load. Session 97. |
| Wire checkpoint sync for signed-in users | **Medium** | **Done** | Dirty version tracking in mastery + word-mastery stores. `useSyncCheckpoint` hook with epoch-aware flush, stale-epoch discard + reload. `SyncManager` component with pagehide beacon. `/api/sync` route with CSRF, Content-Type flexibility, server-side RPC calls. Session 97. |
| Sync input mode from Supabase profile to settings store on login | **Small** | **Done** | `useSettingsSync` hook reads `input_mode` from profile and pushes to settings store on login. Mounted in StoreHydrator. Session 97. |
| **Codex gate: Phase 2 review** | - | **Done** | Codex found: unlock IDs ignored in merge, auth-change rehydration unsafe, stale-epoch discard ordering wrong, local winners not marked dirty, CSRF origin check weak. All fixed. Session 97. |

### Phase 3: Guest Conversion

| Task | Size | Status | Notes |
|---|---|---|---|
| Safe guest progress import via server RPC | **Medium** | **Done** | `import_guest_progress` and `import_legacy_progress` RPCs. Cheap validation before lock, catalog ID validation, abuse detection (>50% invalid), score clamping, greatest-merge, one-time-per-source guard. Client service with error classification. SECURITY.md Section 7.1 added. 13 tests. Session 98. |
| Guest-to-account migration flow | **Medium** | **Done** | Centralized in AuthInitializer. Three scenarios: (A) dual-marker auto-import for same-session non-OAuth, (B) confirmation prompt for missing markers or OAuth, (C) legacy modal for pre-Sprint-10 keys. Pending import quarantine with Retry/Start fresh banner. StoreHydrator gates on migrationPhaseComplete. Snapshot builder parses Zustand persist format with v1 backfill. Profile type extended with import tracking columns. 9 snapshot builder tests. Session 98. |
| **Codex gate: Phase 3 review** | - | **Done** | Fixed: (1) numeric overflow on large scores - clamp in numeric space before integer cast, (2) per-array count caps to bound lock hold time (500/9000), (3) deduplication via seen-ID arrays, (4) non-JSON-number score fields dropped instead of coerced to zero. Migration `20260507120009`. Session 98. |

### Phase 4: Profile and Settings

| Task | Size | Status | Notes |
|---|---|---|---|
| Connect Profile and Settings to Supabase | **Medium** | **Done** | Fixtures removed. All components wired to useAuth/useUserStore. Username change via RPC with cooldown UI and error codes. Email/password change modals wired to auth service. Distance unit persists optimistically with rollback. JLPT level change persists to Supabase. Leaderboard visibility already working. Session 98. |
| Build username change UI | **Small** | **Done** | Included in Plan 6. Inline edit with 30-day cooldown, RPC error codes, disabled state. Session 98. |
| Build reset progress flow | **Small** | **Done** | ResetProgress component in profile screen. Non-optimistic: spinner during RPC, local state cleared only on success. Calls reset_all_mastery and reset_all_word_mastery RPCs. Confirmation modal. Updates epoch from response. Session 98. |
| Build delete account flow | **Medium** | **Done** | Route handler with CSRF origin check, server-side getUser auth, password re-auth for email users, admin client deletion, sb-* cookie clearing. Client service function. Profile dialog wired with password field, error display, loading state, post-deletion localStorage cleanup and redirect. Session 98. |
| **Codex gate: Phase 4 review** | - | **To Do** | Review profile wiring, settings sync, username/reset/delete flows, and CSRF/re-auth implementation. |

### Phase 5: Auth Expansion

| Task | Size | Status | Notes |
|---|---|---|---|
| Google Sign-In | **Medium** | **To Do** | Supabase OAuth. `window.location.origin` for redirect. Callback sanitization. |
| Apple Sign-In | **Medium** | **To Do** | Supabase OAuth. Apple-specific handling (Private Relay, no name reliance). |
| **Codex gate: Phase 5 review** | - | **To Do** | Review OAuth callback sanitization, redirect origin handling, account linking, and guest migration integration. |

### Phase 6: Membership

| Task | Size | Status | Notes |
|---|---|---|---|
| Build free tier daily distance cap | **Medium** | **To Do** | Server-enforced via `daily_cap_events` table. Two-int advisory lock. Feature flag in `app_config`. Cap crossing allowed, next prompt blocked. |
| **Codex gate: Phase 6 review** | - | **To Do** | Review daily cap RPC, advisory lock serialization, feature flag enforcement, cap_enforced tracking, and practice gating. |

### Phase 7: Tests

| Task | Size | Status | Notes |
|---|---|---|---|
| Write accounts and sync tests | **Medium** | **To Do** | ~110 tests: RLS, epoch/lock, reset, import/quarantine, sync versioning, daily cap, OAuth, delete account. |
| Write guest import tests | **Small** | **To Do** | Catalog completeness, error classification, greatest-merge, pending key ownership. |

---

## Sprint 11 - Security, Email, Polish, and Pre-Launch

**Goal:** App is launch-ready. Email deliverability is production-grade. Mutating endpoints are protected with CSRF/origin checks and rate limits. Accessibility and cross-browser verified. Privacy policy and credits in place. Soft launch to testers.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Implement CSRF/origin checks for mutating endpoints | **Medium** | **To Do** | All mutating route handlers and RPC callers must verify origin/referer headers against allowed origins. Covers: sign-out, delete account, username change, leaderboard score sync RPC, guest import RPC, and future Stripe endpoints. Use Next.js middleware or per-route validation. Reject requests with missing or mismatched origin. Document the approach in `docs/SECURITY.md`. |
| Implement rate limiting for mutating endpoints | **Medium** | **To Do** | Rate limit all mutating API routes and RPC-calling service endpoints. Suggested limits: auth actions (sign-up, sign-in, password reset) 5/min per IP, profile mutations (username, delete) 3/min per user, leaderboard sync 10/min per user, guest import 3/hour per IP. Use Vercel Edge middleware or an in-memory/Redis store. Return 429 with Retry-After header. Document limits in `docs/SECURITY.md`. |
| Configure custom SMTP with domain authentication | **Medium** | **To Do** | Supabase's default SMTP has poor deliverability - password reset and confirmation emails go to spam or promotions tab. Fix: choose a transactional email provider (Resend or Postmark). In Supabase dashboard: Auth > SMTP Settings > configure custom SMTP with the provider's credentials. On the domain registrar: add SPF record (TXT, `v=spf1 include:<provider> ~all`), DKIM record (TXT, provider-generated key), and DMARC record (TXT, `v=DMARC1; p=quarantine; rua=mailto:dmarc@langtap.com`). Test with mail-tester.com before launch - target score 9/10 or higher. Document the provider choice and DNS records in `docs/DEVOPS.md`. |
| Build onboarding email sequence | **Medium** | **To Do** | Three-email drip sequence using the chosen email provider (Resend or Postmark). Day 0: welcome email ("You're in! Here's how to start practising"). Day 2: activation nudge ("Have you tried [kana/kotoba] practice yet? Here's a quick tip"). Day 7: social proof ("Other learners at your JLPT level are practising X minutes a day"). Trigger Day 0 on sign-up via a Supabase database webhook or edge function on `auth.users` insert. Days 2 and 7 via the email provider's drip/sequence feature or a scheduled edge function. All emails must include an unsubscribe link (GDPR). Respect the `notifications_enabled` field on the profiles table. |
| Accessibility audit | **Medium** | **To Do** | Every interactive element: ARIA labels, keyboard navigation, focus states, touch targets minimum 44x44pt. |
| Cross-browser and cross-device testing | **Medium** | **To Do** | Chrome, Safari, Firefox. Desktop, tablet, mobile. iOS and Android swipe keyboard behaviour. |
| Error boundary implementation | **Small** | **To Do** | Global error boundary. All screens handle error state with a human-readable message and a recovery action. |
| Build credits / attribution screen | **Small** | **To Do** | List VOICEVOX attribution, font licences, and any other third-party credits. |
| Write privacy policy and terms of service | **Medium** | **To Do** | Plain language. Cover data storage (Supabase), leaderboard visibility of username, guest mode data loss warning, email communications and unsubscribe rights, and cookie usage (localStorage for guest state). |
| Write security tests | **Small** | **To Do** | CSRF/origin rejection: requests with missing or wrong origin are rejected with 403. Rate limit: rapid requests return 429 after threshold. Covers all mutating endpoints listed above. |
| Update stale sprint references in docs | **Small** | **Done** | Fixed 12 stale references: CONTENT.md (5x Sprint 10 -> 9), PERFORMANCE.md (Sprint 11 -> 9), UX_DESIGN.md (2x Sprint 10 -> 11, 2x Sprint 11 -> 12, 1x Sprint 10 -> 9), AUTH.md (2x Sprint 10 -> 11), data/audio/word-manifest.ts (Kanji Alive -> VOICEVOX, Sprint 10 -> 9). Session 92. |
| Final end-to-end test pass | **Large** | **To Do** | Full user journey: guest entry, sign up (verify email lands in inbox, not spam), onboarding, Kana practice (all three modes), Kotoba practice (Readings + Kanji), Dojo (Kana + Kotoba), Profile, Settings, Leaderboard. Include: password reset email deliverability test, rate limit verification (hit endpoint rapidly, confirm 429 response), CSRF rejection verification. |
| Soft launch on Vercel | **Small** | **To Do** | Share URL with a small group of testers. Monitor for errors. Confirm email deliverability with real inboxes (Gmail, Outlook, iCloud). |

---

## Sprint 12 - Payments (Stripe)

**Goal:** Stripe payments integrated post-launch. Hosted checkout, customer portal for subscription management. No custom payment UI. Membership unlocks unlimited daily practice.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Set up Stripe account with hosted Checkout Sessions | **Medium** | **To Do** | Create Stripe account. Define membership product (details TBD). Use Stripe-hosted Checkout Sessions (prebuilt page) instead of custom payment UI. This handles PCI compliance, webhook signature verification, and payment flow out of the box. Wire a checkout session creation endpoint at `app/api/stripe/checkout/route.ts` that calls `stripe.checkout.sessions.create()` server-side and returns the session URL. Client redirects to Stripe's hosted page. Success/cancel URLs point back to the app. No custom webhook handler needed for basic checkout - Stripe's hosted page manages payment confirmation. |
| Activate Stripe membership | **Epic** | **To Do** | Break into smaller tasks at the time. Define pricing model first. For subscription management, use Stripe Customer Portal (hosted) so users can update payment methods, cancel, and view invoices without custom UI. |
| Wire membership card to Stripe Customer Portal | **Small** | **To Do** | "Manage billing" link opens Stripe portal session. "Notify me" button captures demand. Feature flag `SHOW_MEMBERSHIP_CARD`. |
| Build Stripe webhook handler | **Medium** | **To Do** | Listen for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Update user's membership status in Supabase. Verify webhook signatures. Idempotent processing. |
| Write Stripe integration tests | **Small** | **To Do** | Test mode checkout flow. Webhook signature verification. Subscription status updates. Membership gate on daily cap removal. |

---

## Future Backlog - Platform Improvements

Ideas and improvements not tied to a phase. Pulled in when the time is right.

| Task | Size | Status | Notes |
|---|---|---|---|
| Cross-reference JMDict JSON files against Jisho Excel word bank | **Small** | **To Do** | Five JSON files (N5-N1) sourced from JMDict via Waller. Each entry has jmdict_seq, kana, kanji, waller_definition. N1 JSON has 3,427 entries vs Excel's 3,444 (17 gap). Script should match on kana, output words unique to each source, and flag definition differences. Goal: confirm nothing is missing from the word bank and evaluate waller_definition as a cleaner alternative to the stripped Jisho definitions. JSON files stored at scripts/source/. |
| Cross-reference JMDict JSON against Jisho Excel | **Small** | **To Do** | Write `scripts/compare-word-sources.ts`. Match on kana across both sources per JLPT level. Output: words only in Excel, words only in JSON, count totals. Useful for validating word bank completeness. Not blocking anything. |
| Additional language support | **Epic** | **To Do** | Architecture should support this from Phase 1. Korean and Mandarin are the most likely additions. Break into tasks when scoping begins. |

---

## Version History

| Version | Date | Notes |
|---|---|---|
| 1.0 | April 2026 | Initial sprint board. Sprint 1 active. Sprints 2-11 pending. Phase 2 backlog drafted. |
| 1.1 | April 2026 | Kanji removed from scope. Phase 3 (Kanji) and Phase 4 (Kanji with Kotoba) backlogs dropped. Game structure simplified to Kana then Kotoba. kotoba_jlpt_level now serves both modes. |
| 1.2 | April 2026 | Kotoba brought forward from Phase 2 backlog. Phase 2 backlog absorbed into Sprints 5B-9. Sprint 5 closed. Sprint 5B (Kotoba Wiring) added. Sprints 6-9 expanded with Kotoba tasks. Removed: bottom nav, romaji variants/engine, mnemonics (optional in backlog). Kotoba dojo restructured: flat levels of 12 words (no units). |
| 1.3 | May 2026 | Sprint 8 replaced with Smooth Game Loading and Navigation (performance sprint). Former Sprint 12 (Page Transition Speed) merged into new Sprint 8. Old Sprint 8 (Profile/Settings/Sync) renumbered to Sprint 9. Sprints 9-11 renumbered to 10-12. Three rounds of Codex staff-engineer review incorporated. |
| 1.4 | May 2026 | Sprints 9-12 reshuffled for launch-first strategy. Sprint 9: Leaderboard + Audio (game-centric). Sprint 10: Accounts, Auth, Membership (guest conversion, OAuth, daily cap). Sprint 11: Security, Email, Polish, Pre-Launch. Sprint 12: Payments (Stripe, post-launch). Google/Apple Sign-In moved from backlog to Sprint 10. Font size linked to mastery, JIS kana keyboard, animation asset upgrade, and mnemonic expansion removed from backlog. Stripe webhook handler and integration tests added to Sprint 12. |
| 1.5 | May 2026 | Guardrail tasks added to Sprints 9-11. Sprint 9: leaderboard schema redesigned for game_type/input_mode/period with server-only RPC writes, leaderboard privacy (profiles.leaderboard_visibility), audio tasks split (licence confirmation, script creation, manifest build, lazy-load enforcement). Sprint 10: safe guest progress import with validation/sanitization/clamping, profile wiring expanded (fixture removal, distance unit, email/password modals, profile repair), dedicated guest import tests. Sprint 11: CSRF/origin checks and rate limiting for all mutating endpoints, security tests, stale sprint reference cleanup. |
