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

## Sprint 2B - UX/UI Design and Screen Specification

**Goal:** Define the full user experience before any further functional development.
Every screen is specced and approved before Sprint 3 resumes.
This sprint produces the design source of truth that all future sprints build from.
Full specs live in UX_DESIGN.md. This board tracks status only.
**Status:** Active

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
| Write Leaderboard screen spec | Small | To Do | See UX_DESIGN.md Section 12. |
| Document global visual identity and asset list | Small | To Do | See UX_DESIGN.md Sections 1, 2, 14. Logo, key button style, sounds, mascot, parallax, four scene themes. |
| Build SVG assets | Medium | To Do | All SVGs listed in UX_DESIGN.md Section 14.1. Mascot, clouds, hills, icons, logos. Claude builds these. |
| Source sound assets | Small | To Do | Three WAV files listed in UX_DESIGN.md Section 14.2. Source from freesound.org (CC0) or generate. |
| Build sample data files | Small | To Do | Claude builds samples/ folder with mock game state, leaderboard, and N5 words. |
| Write Kotoba practice screen spec (Readings input) | Medium | To Do | UX_DESIGN.md new section. Spec the Kotoba game screen for Readings input across all three modes (Tap/Type/Swipe). Same input system as Kana screens. English word shown, user produces kana reading. |
| Write Kotoba practice screen spec (Kanji input) | Medium | To Do | UX_DESIGN.md new section. Spec the Kotoba game screen for Kanji input. Type/Swipe: plain input with IME kanji suggestions. Tap: two-stage flow (kana tap then kanji selection). 4x scoring. |
| Build Kotoba practice screen visual shells | Large | To Do | Build the visual shells for Kotoba Readings and Kanji input modes. Tap two-stage flow, Type/Swipe single field. Mock data. |
| Consolidate approved designs into FRONTEND.md and UX_DESIGN.md | Medium | To Do | Update both docs with any decisions made during the spec writing process. |

---

## Sprint 3 - Authentication and Onboarding

**Goal:** Users can sign up, log in, and complete the four-step onboarding flow.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Set up Supabase Auth (email and password) | **Medium** | **To Do** | Configure email/password auth in Supabase. RLS enabled on all tables from the start. |
| Build sign-up screen | **Medium** | **To Do** | Username field, email, password. Password strength indicator. Anonymity reminder. No real name prompt. |
| Build log-in screen | **Small** | **To Do** | Email and password. Forgot password link (Supabase magic link flow). |
| Build guest mode | **Small** | **To Do** | Allow entry without account. Store progress in localStorage. Show persistent banner on every screen. |
| Build onboarding step 1 - JLPT self-assessment | **Medium** | **To Do** | Show N5-N1 levels with descriptions. User selects Kotoba JLPT level and Kanji JLPT level. Save both to user profile in Supabase. Show mastery pre-set warning message. |
| Build onboarding step 2 - early character unlock | **Large** | **To Do** | Show full kana chart. User taps characters they know. Unlock those characters immediately. Skip button visible. Confirmation before applying. |
| Build onboarding step 3 - notification preferences | **Small** | **To Do** | Minimal screen in Phase 1. Toggle placeholder only. Save preference to user profile. |
| Build onboarding step 4 - input mode selection | **Small** | **To Do** | Choose Tap, Type, or Swipe. Save to user profile. Show mode icon preview. |
| Build user profile record in Supabase | **Medium** | **To Do** | Schema: user_id, username, kotoba_jlpt_level, kanji_jlpt_level, input_mode, notification_prefs, created_at. RLS: user can only read and write their own row. |
| Write auth tests | **Medium** | **To Do** | Sign up, log in, guest mode, onboarding flow. Happy path, loading, and error states for each screen. |
| Add `practice_sessions` table to Supabase | **Small** | **To Do** | Schema: user_id, event_at_utc, user_tz, local_date, characters_practiced. Unique (user_id, local_date). RLS user read/write own rows. See BACKEND.md Section 2.7. Flagged in Session 49. |
| Add `username_changed_at` to profiles | **Small** | **To Do** | timestamptz nullable. Server enforces 30-day cooldown. See BACKEND.md Section 2.7, SECURITY.md Section 5.1. Flagged in Session 49. |
| Restore `/profile` to auth-only routes | **Small** | **To Do** | Undo temporary middleware change from Session 49. Add '/profile' back to AUTHED_ONLY_ROUTES in middleware.ts. |

---

## Sprint 4 - Core Game Engine

**Goal:** The mastery system, word counter, and character selection logic are built and tested.
No UI yet. This is pure logic.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Build character mastery store (Zustand) | **Medium** | **To Do** | State: all kana characters, each with a mastery score. Actions: increment on correct, read score, reset. Persisted to Supabase for logged-in users, localStorage for guests. |
| Build character unlock logic | **Medium** | **To Do** | Characters start locked. Unlock condition: 5 correct answers. Manual unlock from Dojo. Bulk unlock with confirmation. Logic only - no UI. |
| Build word counter store | **Medium** | **To Do** | Each word has a hidden counter capped at 5. Increment on show. Reset when all words for a character hit 5. Logic only. |
| Build character selection algorithm | **Large** | **To Do** | Weighted random selection based on mastery score. Lower score = higher frequency. Only unlocked characters and words with no locked characters are eligible. Prefer words with lower counters. Tested with a range of mastery distributions. |
| Build unlocking progression sequence | **Medium** | **To Do** | Seion: first 10 hiragana, then first 10 katakana, alternating. Then dakuon. Then yoon. Logic that determines which characters are currently in the active unlocking set. |
| Build distance/progress mechanic | **Small** | **To Do** | A counter that accumulates metres (or feet based on locale) per correct answer. Rate tied to answer speed. Pure function - no UI. |
| Build session score tracker | **Small** | **To Do** | Tracks correct answers, wrong answers, and distance for the current session. Resets on new session. |
| Build streak engine | **Medium** | **To Do** | Pure functions in engine/streak.ts. 3-day start rule, grace-day mechanic, streak state derivation from practice_sessions. See GAME_DESIGN.md Section 8.5. Flagged in Session 49. |
| Write game engine tests | **Large** | **To Do** | Full test coverage for: mastery scoring, word counter, selection algorithm, unlock sequence, distance counter, streak engine. Edge cases: all characters at max mastery, all words at counter 5, single character unlocked, grace day after grace day. |

---

## Sprint 5 - Content Pipeline and Practice Screen (Type Mode)

**Goal:** Word bank and kana character data are generated and committed. A working practice screen in Type mode. The core game loop is playable.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Build `data/kana/characters.ts` | **Medium** | **To Do** | Full kana character dataset. All hiragana, katakana, dakuon, yoon, sokuon, and long vowel mark. Schema per CONTENT.md Section 4. |
| Build `scripts/build-word-bank.ts` | **Medium** | **To Do** | Reads `scripts/source/jisho-jlpt-words.xlsx`. Deduplicates across levels. Strips meanings to first clean definition. Applies all filters from CONTENT.md Section 7.3 including relaxed katakana rule. Generates `characterIds`. Outputs katakana word count per level to console. Writes `data/words/n5.ts` through `n1.ts`. |
| Run build script and commit word bank files | **Small** | **To Do** | Run the script, confirm katakana counts in console output, validate output against schema, commit generated files. N5 minimum 600 words confirmed. |

| Task | Size | Status | Notes |
|---|---|---|---|
| Build practice screen layout | **Medium** | **To Do** | Character display area, input field, distance counter, cycling animation integrated. Mobile-aware: space reserved for native keyboard. |
| Integrate character selection into practice screen | **Medium** | **To Do** | Connect the game engine to the UI. Display the selected character. Accept keyboard input. |
| Build correct answer feedback | **Small** | **To Do** | Visual: brief highlight or animation. Distance counter increments. Cycling animation speeds up momentarily. Move to next character. |
| Build wrong answer feedback | **Medium** | **To Do** | Correct character highlighted orange on input. Short mnemonic shown below (if enabled). English meaning stays hidden. No score change. Brief pause then continue. |
| Build English meaning reveal | **Small** | **To Do** | Show English meaning only after correct answer is given. Hidden at all other times. |
| Integrate kana character audio | **Medium** | **To Do** | Play the character's audio on display (or on correct answer - decision to be made at this sprint). Use Wikimedia Commons audio files. |
| Build top bar and input mode switcher | **Small** | **To Do** | Logo left. Input mode icon right. Tapping the icon opens mode switcher. Switching mode saves to profile. |
| Build bottom navigation bar | **Small** | **To Do** | Profile, Dojo, Library (locked placeholder), Settings. Active state indicator. |
| Write practice screen tests | **Medium** | **To Do** | Happy path, loading state, error state, wrong answer flow, correct answer flow. |

---

## Sprint 6 - Tap Mode and Swipe Mode

**Goal:** All three input modes are functional.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Build Tap mode input component | **Medium** | **To Do** | On-screen kana character buttons. Tapping a button submits that character. Grid layout. Works on all screen sizes. |
| Integrate Tap mode into practice screen | **Small** | **To Do** | Connect Tap input to the same game engine used by Type mode. |
| Build Swipe mode input component | **Medium** | **To Do** | Detects native mobile swipe keyboard input. Accepts input from the device keyboard the same way Type mode does but optimised for mobile layout. |
| Integrate Swipe mode into practice screen | **Small** | **To Do** | Same game engine connection as Type and Tap. |
| Test all three modes end to end | **Medium** | **To Do** | Each mode: correct answer, wrong answer, mode switching mid-session, mobile and desktop. |

---

## Sprint 7 - Dojo Screen

**Goal:** The Dojo screen is complete with character progress, collapsible groups, and unlock controls.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Build Dojo screen layout | **Medium** | **To Do** | Heading: Kana. Subheadings: Seion, Dakuon, Yoon. Each group collapsible via arrow toggle. |
| Build character progress bar component | **Small** | **To Do** | Shows mastery score as a filled bar. Heatmap colouring from the colour utility built in Sprint 2. |
| Build individual character unlock interaction | **Small** | **To Do** | Clicking a locked character shows an unlock prompt. Confirmation required. Cannot be undone. |
| Build unlock all interaction | **Small** | **To Do** | Clicking a progress bar shows an "Unlock All" option. Two-step confirmation. Cannot be undone. |
| Connect Dojo to mastery store | **Small** | **To Do** | Read mastery scores from Zustand store. Dojo reflects live state. |
| Write Dojo screen tests | **Small** | **To Do** | Collapse/expand, locked state, unlock flow, progress bar rendering. |

---

## Sprint 8 - Profile and Settings Screens

**Goal:** Profile and Settings screens are complete and connected to user state.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Build Profile screen | **Medium** | **To Do** | Username display, Kotoba JLPT level selector, Kanji JLPT level selector (both with mastery pre-set warning), font selector, font size selector, lo-fi audio toggle, reset progress button. |
| Build reset progress flow | **Small** | **To Do** | Two-step confirmation. Clear warning that this cannot be undone. Resets all mastery, counters, and unlocks. |
| Build Settings screen | **Medium** | **To Do** | Input mode selector, mode-specific sub-settings (Type/Swipe: romaji-to-kana or kana-to-romaji), mnemonic toggle. |
| Connect Profile and Settings to Supabase | **Medium** | **To Do** | All preferences saved to the user profile record. Loaded on app start. Guest users: saved to localStorage. |
| Build delete account flow | **Medium** | **To Do** | Server-side account deletion. Typed confirmation (`delete-username`). Cascade deletes all user data. See SECURITY.md Section 5.4. Flagged in Session 49. |
| Build username change with 30-day cooldown | **Small** | **To Do** | Server validates cooldown via `username_changed_at`. Returns structured error with next-allowed timestamp. Client shows disabled state. Flagged in Session 49. |
| Wire membership card to Stripe Customer Portal | **Small** | **To Do** | "Manage billing" link opens Stripe portal session. "Notify me" button captures demand. Feature flag `SHOW_MEMBERSHIP_CARD`. Flagged in Session 49. |
| Write Profile and Settings tests | **Small** | **To Do** | Each setting saved and loaded correctly. Reset flow. Guest vs logged-in behaviour. |

---

## Sprint 9 - Leaderboards

**Goal:** Global leaderboards are live for all three input modes and the overall board.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Design leaderboard Supabase schema | **Medium** | **To Do** | Table: leaderboard_entries. Fields: user_id, username, input_mode, total_score, updated_at. RLS: anyone can read, only owner can write their own row. |
| Build leaderboard score sync | **Medium** | **To Do** | On session end, push the updated total mastery score to the leaderboard table. Debounced - not on every keypress. |
| Build leaderboard screen | **Medium** | **To Do** | Four tabs: Tap, Type, Swipe, Overall. Each shows ranked list with username, input mode indicator, and score. Highlight the current user's row. |
| Build leaderboard rank calculation | **Small** | **To Do** | Rank by total_score descending. Ties resolved by updated_at ascending (earlier score wins on tie). |
| Write leaderboard tests | **Small** | **To Do** | Correct ranking order, current user highlight, empty state, loading state. |

---

## Sprint 10 - Audio, Polish, and Guest-to-Account Flow

**Goal:** All audio is integrated, UI is polished, and guests can convert to a full account.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Integrate lo-fi background audio | **Small** | **To Do** | Connect audio player component to the settings toggle. Persist preference. Default on. |
| Generate and integrate word audio via VOICEVOX | **Medium** | **To Do** | Open VOICEVOX on Mac. Run scripts/generate-audio.ts to call local VOICEVOX API for every word in the N5 word bank. Save MP3s to public/audio/words/. Commit to repo. Confirm chosen voice character licence permits use in a free app. Add attribution to credits screen. See CONTENT.md Section 2.2. |
| Build guest-to-account conversion flow | **Medium** | **To Do** | Guest user clicks "Save Progress" or similar CTA. Prompted to create an account. Local progress migrated to Supabase on account creation. |
| Accessibility audit | **Medium** | **To Do** | Every interactive element: ARIA labels, keyboard navigation, focus states, touch targets minimum 44x44pt. |
| Cross-browser and cross-device testing | **Medium** | **To Do** | Chrome, Safari, Firefox. Desktop, tablet, mobile. iOS and Android swipe keyboard behaviour. |
| Performance audit | **Small** | **To Do** | Lighthouse score. Identify and fix any slow loads. Confirm animation does not cause jank. |
| Error boundary implementation | **Small** | **To Do** | Global error boundary. All screens handle error state with a human-readable message and a recovery action. |

---

## Sprint 11 - Stripe Infrastructure and Pre-Launch

**Goal:** Payments infrastructure is in place but not active. App is ready for soft launch.
**Status:** Pending

| Task | Size | Status | Notes |
|---|---|---|---|
| Set up Stripe account and products | **Medium** | **To Do** | Create Stripe account. Define membership product (details TBD in Phase 2). Wire Stripe into the app but do not activate any paywall. |
| Build credits / attribution screen | **Small** | **To Do** | List VOICEVOX attribution, font licences, and any other third-party credits. |
| Write privacy policy and terms of service | **Medium** | **To Do** | Plain language. Cover data storage (Supabase), leaderboard visibility of username, and guest mode data loss warning. |
| Final end-to-end test pass | **Large** | **To Do** | Full user journey: guest entry, sign up, onboarding, practice in all three modes, Dojo, Profile, Settings, Leaderboard. |
| Soft launch on Vercel | **Small** | **To Do** | Share URL with a small group of testers. Monitor for errors. |

---

## Phase 2 Backlog - Kana with Kotoba

Not assigned to a sprint. Pulled in once Phase 1 is complete and stable.

| Task | Size | Status | Notes |
|---|---|---|---|
| Design word mastery schema in Supabase | **Medium** | **To Do** | Separate from character mastery. Table: word_mastery. Fields: user_id, word_id, score, counter, updated_at. |
| Build word mastery store (Zustand) | **Medium** | **To Do** | Same logic as character mastery but for words. Frequency-weighted selection. Counter cap at 5. |
| Build Library screen | **Large** | **To Do** | JLPT N5-N1 word banks. Organised by level and set. Heatmap colouring per word. Remove "Under Construction" placeholder. |
| Build Kotoba Mode game loop (Readings input) | **Large** | **To Do** | Show English word. User types/taps/swipes kana reading. Uses same input system as Kana game screens. Correct: word mastery increments at 1x. Wrong: same feedback as Kana mode. |
| Build Kotoba Mode game loop (Kanji input) | **Large** | **To Do** | Same as Readings but user produces kanji via keyboard auto-suggestion. Scoring at 4x multiplier (`KANJI_INPUT_MULTIPLIER`). Type/Swipe: single plain input field (no zero-width-space). Tap: two-stage flow (kana tap first, then kanji selection). |
| Build Kotoba Tap mode two-stage flow | **Medium** | **To Do** | Tap mode only. Stage 1: select correct kana from tap grid. Stage 2 (Kanji input only): select correct kanji from options. Stage 2 skipped when Readings input is selected. |
| Add Kotoba Input setting to Settings dialog | **Small** | **To Do** | Two-option segmented control: Readings (1x) / Kanji (4x). Only shown when Kotoba Mode is unlocked. Persists to settings.store.ts. |
| Build Kotoba leaderboards | **Medium** | **To Do** | Kotoba board. Separate from the main Kana boards. Same ranking logic. Kanji input users accumulate faster due to 4x. |
| Gate Kotoba Mode behind full Kana mastery | **Small** | **To Do** | Check mastery threshold before allowing access. Show friendly message if not yet unlocked. |
| Activate Stripe membership | **Epic** | **To Do** | Break into smaller tasks at the time. Define pricing model first. |

---

## Future Backlog - Platform Improvements

Ideas and improvements not tied to a phase. Pulled in when the time is right.

| Task | Size | Status | Notes |
|---|---|---|---|
| Cross-reference JMDict JSON files against Jisho Excel word bank | **Small** | **To Do** | Five JSON files (N5-N1) sourced from JMDict via Waller. Each entry has jmdict_seq, kana, kanji, waller_definition. N1 JSON has 3,427 entries vs Excel's 3,444 (17 gap). Script should match on kana, output words unique to each source, and flag definition differences. Goal: confirm nothing is missing from the word bank and evaluate waller_definition as a cleaner alternative to the stripped Jisho definitions. JSON files stored at scripts/source/. |
| Google Sign-In | **Medium** | **To Do** | Add as a second auth option. Supabase OAuth. |
| Apple Sign-In | **Medium** | **To Do** | Add as a third auth option. Required for any future iOS wrapper. |
| Font size linked to mastery | **Medium** | **To Do** | Starts at 30pt. Decreases by 2pt per correct answer. Minimum size TBD (suggested 12pt). Toggle in Profile. |
| Additional language support | **Epic** | **To Do** | Architecture should support this from Phase 1. Korean and Mandarin are the most likely additions. Break into tasks when scoping begins. |
| Cross-reference JMDict JSON against Jisho Excel | **Small** | **To Do** | Write `scripts/compare-word-sources.ts`. Match on kana across both sources per JLPT level. Output: words only in Excel, words only in JSON, count totals. Useful for validating word bank completeness. Not blocking anything. |
| JIS kana keyboard mapping | **Medium** | **To Do** | Map physical QWERTY keys to JIS kana layout so users can type kana directly without switching to a Japanese IME. E.g. 1=ぬ, 2=ふ, 3=あ, 4=う, 5=え. Enables romaji-to-kana mode on English keyboards. Alternative to requiring Japanese keyboard setup. |
| Animation asset upgrade | **Small** | **To Do** | Commission or generate a higher-quality cycling character animation if the initial asset needs replacing. |
| Mnemonic content expansion | **Medium** | **To Do** | Review and expand the mnemonic library. Ensure all seion, dakuon, and yoon characters have a mnemonic. |

---

## Version History

| Version | Date | Notes |
|---|---|---|
| 1.0 | April 2026 | Initial sprint board. Sprint 1 active. Sprints 2-11 pending. Phase 2 backlog drafted. |
| 1.1 | April 2026 | Kanji removed from scope. Phase 3 (Kanji) and Phase 4 (Kanji with Kotoba) backlogs dropped. Game structure simplified to Kana then Kotoba. kotoba_jlpt_level now serves both modes. |
