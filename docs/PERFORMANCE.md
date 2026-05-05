# LangTap - Performance Reference

Version 1.0 | May 2026
Domain: Production bundle baselines, browser metrics, optimization targets,
and verification results for Sprint 8 (Smooth Game Loading and Navigation).
Reference: LangTap_Sprints.md Sprint 8.
Owner document: CLAUDE.md

Read this document before working on any Sprint 8 task. Update it after
completing any measurement or optimization task.

---

## 1. Production Bundle Baseline (A1)

Recorded: 2026-05-05, Session 88
Build tool: `next build` (Next.js 15.5.14, production mode)
Node environment: production
865 tests passing (1 flaky timeout, see Section 6)

### 1.1 Route Sizes

| Route | Route JS | First Load JS | First Load JS (gzip est.) |
|---|---|---|---|
| `/` (landing) | 5.27 kB | 237 kB | ~85 kB |
| `/practice` | **278 kB** | **552 kB** | **~175 kB** |
| `/home` | 5.78 kB | 169 kB | ~60 kB |
| `/dojo/kana` | 8.26 kB | 121 kB | ~40 kB |
| `/dojo/kotoba` | 6.66 kB | 139 kB | ~47 kB |
| `/leaderboard` | 1.27 kB | 107 kB | ~35 kB |
| `/profile` | 7.79 kB | 110 kB | ~36 kB |
| `/onboarding/step-1` | 2.48 kB | 110 kB | ~36 kB |
| `/onboarding/step-2` | 2.42 kB | 112 kB | ~37 kB |
| `/onboarding/step-2b` | 5.23 kB | 115 kB | ~38 kB |
| `/onboarding/step-3` | 2.94 kB | 206 kB | ~70 kB |
| `/log-in` | 382 B | 177 kB | ~58 kB |
| `/sign-up` | 384 B | 177 kB | ~58 kB |
| Shared (all routes) | 102 kB | - | ~34 kB |

Route JS = code unique to that route.
First Load JS = shared JS + layout JS + route JS (everything the browser
downloads on a cold visit to that route).

### 1.2 Word Bank and Kotoba Level Chunks (Practice-Only)

These chunks load on `/practice` regardless of the user's JLPT level.

| Chunk | Raw | Gzip | Contents |
|---|---|---|---|
| 4995 | **548 kB** | 124 kB | N1 word bank (3,426 words) |
| 8822 | **275 kB** | 63 kB | N2 word bank (1,776 words) |
| 185 | **257 kB** | 58 kB | N3 word bank (1,717 words) |
| 3932 | **89 kB** | 19 kB | N4 word bank (640 words) |
| 4660 | 42 kB | 14 kB | N1 kotoba levels (286 levels) |
| 114 | 20 kB | 7 kB | N3 kotoba levels (144 levels) |
| 7317 | 20 kB | 7 kB | N2 kotoba levels (148 levels) |
| 6043 | 7 kB | 3 kB | N4 kotoba levels (54 levels) |
| **Subtotal** | **1,258 kB** | **295 kB** | **All JLPT word + level data** |

N5 word bank and N5 kotoba levels are inlined in the practice page chunk
(65 kB raw) and are not separately lazy-loadable.

### 1.3 Framework and Shared Chunks

| Chunk | Raw | Gzip | Contents | Route count |
|---|---|---|---|---|
| framework | 183 kB | 58 kB | React + React DOM | all |
| 4bd1b696 | 173 kB | 54 kB | Next.js runtime | all |
| 1255 | 172 kB | 46 kB | Next.js App Router | all |
| main | 128 kB | 37 kB | Next.js client | all |
| polyfills | 113 kB | 40 kB | Browser polyfills | all |
| 4324 | 176 kB | 49 kB | Supabase/auth libraries | 6 routes |
| 6446 | 135 kB | 45 kB | Shared components (landing, home, practice) | 3 routes |
| 8581 | 93 kB | 19 kB | Mastery/heatmap utilities + kotoba level logic | 2 routes |

Chunk 4324 (Supabase/auth) loads on: landing, sign-up, log-in, (main) layout,
practice, and onboarding step-3.

### 1.4 Static Assets

| Asset | Size | Notes |
|---|---|---|
| Cyclist animation PNGs | **12 MB** (14 frames, ~860-920 kB each) | All loaded eagerly |
| Audio (sounds/) | 236 kB | Key click sound only |
| Audio (audio/) | 0 B | Word audio not yet generated (Sprint 11) |
| SVG images | ~100 kB | Logo, mascot icons, landscape |
| Mascot PNGs | ~500 kB | 3 poses |
| Total public/ | **13 MB** | Dominated by cyclist frames |

### 1.5 Practice Route Chunk Composition

The practice route loads 22 chunks, the most of any route. Breakdown by category:

**Word bank data (practice-only, optimization target D3):**
N1 words (548 kB) + N2 words (275 kB) + N3 words (257 kB) + N4 words (89 kB)
+ N1 levels (42 kB) + N2 levels (20 kB) + N3 levels (20 kB) + N4 levels (7 kB)
= 1,258 kB raw / 295 kB gzip

**Practice page code:**
Practice page chunk (65 kB) containing N5 words, N5 levels, and PracticeClient
component code.

**Shared with other routes:**
Supabase/auth (176 kB), shared components (135 kB), mastery/heatmap (93 kB),
framework + runtime + polyfills (596 kB).

---

## 2. Key Findings

1. **Practice is 5x heavier than the next largest route.** 552 kB first load
   vs 237 kB (landing) and 169 kB (home).

2. **1.26 MB of word bank data loads on every practice visit** regardless of
   the user's JLPT level. An N5 user downloads N1-N4 data they will never use.
   Primary optimization target: D3 (lazy-load word banks).

3. **Cyclist images are 12 MB of unoptimized PNGs** loading eagerly. Converting
   to WebP and deferring frames 2-14 should cut this to under 2 MB.
   Optimization target: D1.

4. **Onboarding step-3 loads 206 kB** because it imports tap grid and game
   preview components (the input mode picker shows a live preview).

5. **Dev vs production confirms the expected gap:** 13 MB (dev) to 552 kB
   (prod) for practice, 5.3 MB to 237 kB for landing. Dev numbers are
   meaningless for budgeting.

6. **Supabase/auth chunk (176 kB raw / 49 kB gzip) is the baseline cost of
   auth.** It loads on 6 routes including the (main) layout. This is fixed
   cost, not an optimization target.

7. **The practice route loads 22 chunks.** Splitting Kana and Kotoba surfaces
   (D2) will reduce this to ~12-14 chunks per game type.

---

## 3. Browser Waterfall and Frame Metrics Baseline (A2)

Recorded: 2026-05-05, Session 88
Tool: Lighthouse CLI 13.2.0 (headless Chrome, localhost:3001, production build)
Note: Lighthouse measures cold loads only. Warm navigation, frame drops
during typing, and input latency require manual DevTools tracing (see 3.3).

### 3.1 Cold Load Lighthouse Results

| Route | Score | FCP | LCP | TBT | CLS | TTI | Transfer |
|---|---|---|---|---|---|---|---|
| `/` (landing) | 53 | 2.3s | 88.3s | 400ms | 0 | 91.3s | 20.7 MB |
| `/practice` | **34** | 1.8s | **133.1s** | **8,690ms** | 0 | 133.1s | 21.3 MB |
| `/home` | 43 | 2.0s | 127.4s | 2,870ms | 0 | 127.4s | 21.1 MB |
| `/dojo/kana` | 53 | 2.0s | 35.3s | 880ms | 0 | 61.2s | 8.9 MB |
| `/dojo/kotoba` | 44 | 2.0s | 47.2s | 1,060ms | 0 | 61.2s | 8.9 MB |
| `/leaderboard` | 46 | 2.0s | 58.3s | 690ms | 0 | 61.2s | 8.9 MB |
| `/profile` | **63** | 2.1s | 57.9s | **340ms** | 0 | 57.9s | 8.5 MB |

FCP = First Contentful Paint, LCP = Largest Contentful Paint,
TBT = Total Blocking Time, CLS = Cumulative Layout Shift,
TTI = Time to Interactive.

**Patterns:**
- Pages with cyclist landscape (landing, practice, home): ~21 MB transfer,
  LCP 88-133s driven by 14 unoptimized PNGs downloading sequentially.
- Pages without cyclist (dojo, leaderboard, profile): ~8.9 MB transfer,
  LCP 35-58s driven by mascot PNGs and layout images.
- FCP is consistent at ~2s across all routes (framework baseline).
- CLS is 0 everywhere (no layout shift issues).
- Practice has catastrophic TBT (8.7s) from word bank data parsing.

### 3.2 Practice Page Long Tasks (>50ms)

| Duration | Source | Category |
|---|---|---|
| **1,843ms** | chunk 4995 (N1 word bank, 548 kB) | Word data parsing |
| 1,360ms | chunk 1255 (Next.js App Router) | Framework |
| 824ms | chunk 1255 (Next.js App Router) | Framework |
| 780ms | (main) layout chunk | Layout |
| 660ms | chunk 6446 (shared components) | Shared code |
| 593ms | chunk 1255 (Next.js App Router) | Framework |
| 589ms | Unattributable | Unknown |
| 584ms | Unattributable | Unknown |
| 514ms | Unattributable | Unknown |
| 497ms | Error boundary chunk | Error handling |

**Main thread work breakdown (practice):**
- Script Evaluation: 8,413ms (dominant)
- Other: 5,639ms
- Style & Layout: 3,168ms
- Script Parsing: 593ms
- Rendering: 361ms

**Unused JS on practice page:**
- 39/48 KB unused from Supabase/auth chunk (4324)
- 25/44 KB unused from shared components chunk (6446)

### 3.3 Warm Navigation Metrics (manual verification required)

These flows cannot be measured by Lighthouse (cold loads only). They require
manual Chrome DevTools Performance traces on the production build.

| Flow | Status | Result |
|---|---|---|
| Warm home-to-practice | **Done** | Visible scene reset (cyclist/landscape remounts). Fix: E5. |
| Warm kana-to-kotoba mode switch | **Done** | Smooth, no issues. |
| Warm practice-to-dojo | **Done** | Flash between pages (full remount). |
| Back/forward between practice and dojo | **Done** | Same visible reset as home-to-practice. Fix: E5. |
| Onboarding-to-practice | Pending | Needs fresh onboarding flow to test. |
| Auth callback-to-practice | Pending | Needs auth flow to test. |
| Settings open/close during practice | **Done** | Smooth, no issues. |
| Dojo kana/kotoba switch | Pending | Not tested this session. |
| Input mode switching (tap/type/swipe) | **Done** | Smooth, no issues. |
| Dropped frames during active typing | Pending | DevTools trace needed. |
| Input latency during active typing | Pending | DevTools trace needed. |

**Key finding:** The landscape/cyclist scene fully remounts on every route
change between home and practice. This is the primary visual smoothness
issue. E5 (shared scene layout) is the fix.

---

## 4. Reference Benchmark: KanaDojo (A3)

Recorded: (pending)

_To be filled after A3 is completed. Same-device measurements of the
reference app (lingdojo/kana-dojo) for comparison._

---

## 5. Optimization Targets (derived from baseline)

These targets are refined after each optimization task lands.

| Target | Baseline (A1/A2) | Goal | Task |
|---|---|---|---|
| Practice first load JS | 552 kB raw | Under 200 kB raw | D2 + D3 | **241 kB** (done) |
| Practice word data loaded | 1,258 kB (all JLPT) | Active level only (~89-548 kB) | D3 | Active level only (done) |
| Practice TBT | 8,690ms | Under 1,000ms | D2 + D3 | Pending re-measure |
| Practice Lighthouse score | 34 | 70+ | D1 + D2 + D3 | Pending re-measure |
| Cyclist image transfer | 12 MB (14 PNGs) | Under 2 MB (WebP, deferred) | D1 | Deferred + Next.js optimization (done) |
| Landing page total transfer | 20.7 MB | Under 2 MB | D1 + F1 |
| Landing page Lighthouse score | 53 | 80+ | D1 + F1 |
| Warm home-to-practice | Pending (manual) | Under 100ms to interactive | E5 |
| Cold practice FCP | 1.8s | Under 1.5s | B1 + B2 |
| FPS during active typing | Pending (manual) | Above 55 FPS | verification target |
| CLS all routes | 0 | Stay at 0 | regression gate |

---

## 6. Resolved Issues

### PracticeClient cap gate timeout (fixed Session 88)

File: `components/game/__tests__/tutorial-system.test.tsx`
Test: "renders cap card and does not mount practice hooks when guest is over 30m"
Root cause: `KotobaGameWindow` was not mocked, so the dynamic import of
`practice-client.tsx` loaded the full word bank (~1.2MB) through the
`useKotobaPracticeSession` import chain. This took >5s to parse.
Fix: Added mocks for `GameWindow`, `KotobaGameWindow`, `DistanceCounter`,
and `PracticeBanner` to cut off heavy import chains. Test now runs in ~300ms.

---

## 7. Verification Results (G1-G4)

_To be filled after Phase G verification tasks are completed. Will contain
post-optimization measurements compared against this baseline._

---

## Version History

| Version | Date | Session | Changes |
|---|---|---|---|
| 1.0 | 2026-05-05 | 88 | Initial baseline from A1: route sizes, chunk breakdown, static assets, key findings |
| 1.1 | 2026-05-05 | 88 | A2 Lighthouse cold-load metrics, long task breakdown, optimization targets updated |
| 1.2 | 2026-05-05 | 88 | Post-D bundle results: practice 552->188 kB, home 169->117 kB. Phase E route restructure. Blocking: game screen not rendering, needs investigation. |
| 1.3 | 2026-05-05 | 89 | Blank game screen resolved: Strict Mode double-fire left auth/guest-usage loading gates stuck. Added `useStuckLoadingWarning` dev watchdog, visible loading card, and `test-utils/async-gate.tsx` regression pattern. |
