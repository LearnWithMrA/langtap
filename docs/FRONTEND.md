# LangTap - Frontend

Version 1.0 | April 2026
Domain: UI components, layout rules, Tailwind conventions, design tokens,
responsive behaviour, accessibility, heatmap system, animation.
Reference: LangTap_Planning.md Sections 5.6, 5.7, 5.8, 6.
Owner document: CLAUDE.md
Related: docs/ARCHITECTURE.md (component rules, folder structure)

Read this document before working in `components/`, `app/`, or `theme/`.

---

## 1. Design Intent

LangTap should feel like a calm, focused place to practise. The visual language
reinforces this at every level: soft colours, generous whitespace, smooth but
unhurried transitions, and nothing that demands attention beyond the current prompt.

Three principles govern every UI decision:

**Calm over excitement.** Nothing flashes, pulses, or demands attention. Correct
answers are rewarding but quiet. Wrong answers are corrective but not alarming.
Progress is always visible but never intrusive.

**Clarity over decoration.** Japanese characters are the content. Everything else
is support. The character being practised is always the most prominent element on
screen. UI chrome should recede.

**Consistency over cleverness.** Every screen uses the same spacing scale, the same
colour tokens, the same component primitives. A user who understands one screen
understands all of them.

---

## 2. Colour System

### 2.1 Palette

LangTap uses a soft pastel palette built around greens, with warm neutrals and
carefully chosen accent colours. All colours are defined as Tailwind v4 theme
variables in `app/globals.css` using the `@theme` directive.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Base palette - zen greens */
  --color-sage-50:   #f4f7f2;
  --color-sage-100:  #e6ede3;
  --color-sage-200:  #ccdcc6;
  --color-sage-300:  #a8c4a0;
  --color-sage-400:  #7da873;
  --color-sage-500:  #5a8a50;
  --color-sage-600:  #456e3d;

  /* Warm neutrals */
  --color-cream:     #faf8f4;
  --color-warm-100:  #f5f0e8;
  --color-warm-200:  #e8ddd0;
  --color-warm-400:  #b8a898;
  --color-warm-600:  #7a6a5a;
  --color-warm-800:  #3d3028;

  /* Mint accent */
  --color-mint-100:  #e8f5f0;
  --color-mint-300:  #90d4bc;
  --color-mint-500:  #3db891;

  /* Blush accent */
  --color-blush-100: #faeef0;
  --color-blush-300: #f0a8b4;

  /* Feedback colours */
  --color-feedback-wrong:   #f59e60;  /* orange - wrong answer highlight */
  --color-feedback-correct: #7da873;  /* sage-400 - correct answer confirm */

  /* Heatmap colours (mastery progress) */
  --color-heat-0:  #e6ede3;  /* score 0 - same as sage-100, cool and pale */
  --color-heat-1:  #ccdcc6;  /* score 1-4 */
  --color-heat-2:  #a8c4a0;  /* score 5-9 */
  --color-heat-3:  #7da873;  /* score 10-19 */
  --color-heat-4:  #5a8a50;  /* score 20-39 */
  --color-heat-5:  #456e3d;  /* score 40+ */

  /* Profile page theme (sunny yellow) */
  --color-profile-bg:          #f5edd4;
  --color-profile-accent:      #d4b85a;
  --color-profile-accent-dark: #b89c3e;

  /* Surface and text */
  --color-surface:       var(--color-cream);
  --color-surface-raised: #ffffff;
  --color-border:        var(--color-warm-200);
  --color-text-primary:  var(--color-warm-800);
  --color-text-secondary: var(--color-warm-600);
  --color-text-muted:    var(--color-warm-400);
}
```

### 2.2 Usage Rules

- Never hardcode a hex value in a component. Always use a token class.
- Background colour for all screens: `bg-surface` (maps to `--color-surface`).
- Raised surfaces (cards, modals): `bg-surface-raised`.
- Primary text: `text-text-primary`.
- Secondary text (subtitles, captions): `text-text-secondary`.
- Muted text (placeholders, hints): `text-text-muted`.
- Wrong answer highlight: `bg-feedback-wrong` or `text-feedback-wrong`.
- Correct answer confirm: `text-feedback-correct`.
- Borders: `border-border`.

### 2.3 Scene Theme Tokens

The parallax landscape has four selectable themes. Each theme defines a set of
CSS custom properties applied to the root scene container. All scene layers
(sky, hills, ground, clouds) read from these properties.

Themes are defined in `theme/scene-themes.ts` and applied as a class on the
scene root element: `theme-day`, `theme-sunrise`, `theme-sunset`, `theme-night`.

```css
/* app/globals.css - scene theme definitions */

.theme-day {
  --scene-sky-top:    #c9e8f5;
  --scene-sky-bottom: #e8f4fb;
  --scene-ground:     #8bc34a;
  --scene-cloud:      #ffffff;
  --scene-hill:       #5a9e3a;
}

.theme-sunrise {
  --scene-sky-top:    #fde9c9;
  --scene-sky-bottom: #fcc97a;
  --scene-ground:     #7ab648;
  --scene-cloud:      #fde0c0;
  --scene-hill:       #4a8a2e;
}

.theme-sunset {
  --scene-sky-top:    #f4a261;
  --scene-sky-bottom: #264653;
  --scene-ground:     #4a7c59;
  --scene-cloud:      #c9b8d8;
  --scene-hill:       #2d5a42;
}

.theme-night {
  --scene-sky-top:    #0d1b2a;
  --scene-sky-bottom: #1b2a3b;
  --scene-ground:     #2d4a3e;
  --scene-cloud:      #8899aa;
  --scene-hill:       #1a3028;
}
```

Switching themes applies a 500ms cross-fade transition on the scene container only.
UI chrome (top bar, game window, tap grid) does not change colour with the theme.
The active theme is stored in `settings.store.ts` and persists across sessions.
Default: `theme-day`.

### 2.4 Heatmap Colouring
mastery progress per character or word. The colour is determined by the mastery
score and must always come from the heatmap token set.

The mapping function lives in `engine/mastery.ts` and returns a token name,
not a raw colour value:

```ts
// engine/mastery.ts
export function getMasteryHeatClass(score: MasteryScore): string {
  if (score === 0)       return 'bg-heat-0'
  if (score <= 4)        return 'bg-heat-1'
  if (score <= 9)        return 'bg-heat-2'
  if (score <= 19)       return 'bg-heat-3'
  if (score <= 39)       return 'bg-heat-4'
  return                        'bg-heat-5'
}
```

Components receive the class name and apply it. They never calculate colours
themselves.

---

## 3. Typography

### 3.1 Fonts

LangTap uses two fonts:

**UI font:** Noto Sans JP (or Zen Maru Gothic as an alternative).
Used for all body text, labels, and UI copy.
Noto Sans JP has excellent Japanese character coverage, is free via Google Fonts,
and has a calm, readable character at all sizes.

Zen Maru Gothic was used by kanadojo.com and has a rounder, friendlier quality.
Confirm licence before using. Both are acceptable. Decision to be made during
the Sprint 2 design system task.

**Character display font:** Same as UI font but rendered at a larger scale.
The kana characters being practised use the same font but at display sizes.
Do not use a separate "display" font. Consistency between what the user reads
and what they practise is important.

### 3.2 Size Scale

All font sizes are defined as theme tokens and used via Tailwind utility classes.
Never hardcode a pixel value for font size.

```css
@theme {
  --font-size-xs:   0.75rem;   /* 12px - mnemonic text, captions */
  --font-size-sm:   0.875rem;  /* 14px - secondary labels, metadata */
  --font-size-base: 1rem;      /* 16px - body text, UI copy */
  --font-size-lg:   1.125rem;  /* 18px - slightly prominent labels */
  --font-size-xl:   1.25rem;   /* 20px - card headings */
  --font-size-2xl:  1.5rem;    /* 24px - section headings */
  --font-size-3xl:  1.875rem;  /* 30px - practice word display */
  --font-size-4xl:  2.25rem;   /* 36px - main character prompt */
  --font-size-5xl:  3rem;      /* 48px - large character prompt (early unlock) */
}
```

### 3.3 Font Size Linked to Mastery (Later Feature)

When the font-size-linked-to-mastery setting is enabled (Phase 1 later sprint):
- Starting size for a character with score 0: 30pt (maps to approximately `text-4xl`).
- Decreases by 2pt for every correct first-attempt answer.
- Minimum size: 14pt (maps to approximately `text-sm`).
- This is a display setting only. It does not affect scoring or selection.
- The calculation lives in `engine/mastery.ts`, not in the component.

---

## 4. Spacing

All spacing uses Tailwind's default spacing scale extended with a few project-specific
values. Never hardcode pixel values for margin, padding, or gap.

Key values used throughout the app:

| Token | Value | Common use |
|---|---|---|
| `p-2` | 8px | Tight internal padding |
| `p-3` | 12px | Standard small padding |
| `p-4` | 16px | Standard padding (most common) |
| `p-6` | 24px | Card and section padding |
| `p-8` | 32px | Page-level padding |
| `gap-2` | 8px | Tight component gaps |
| `gap-4` | 16px | Standard component gaps |
| `gap-6` | 24px | Section-level gaps |

Touch targets: all interactive elements must have a minimum tap area of 44x44pt
(approximately `min-h-11 min-w-11` in Tailwind). This is an Apple HIG requirement
and applies on all platforms.

---

## 5. Layout

### 5.1 Screen Structure

Every main app screen follows this structure:

```
+--------------------------------------------------+
| TopBar (logo left, mode icon right)              |  h-14 (56px), sticky
+--------------------------------------------------+
|                                                  |
|  Page content area                               |  flex-1, overflow-y-auto
|  (scrollable)                                    |
|                                                  |
+--------------------------------------------------+
| BottomNav (Profile, Dojo, Library, Settings)     |  h-16 (64px), sticky
+--------------------------------------------------+
| [Mobile only: empty space for native keyboard]   |
+--------------------------------------------------+
```

The `PageShell` component in `components/layout/page-shell.tsx` wraps every
main screen and applies this structure consistently.

### 5.2 Top Bar

- Height: `h-14` (56px).
- Position: `fixed top-0 left-0 right-0 z-50`.
- Left: LangTap logo. LogoLt on compact viewports, LogoFull on desktop.
- Centre (desktop 768px+): in-app nav links (Home, Kana Dojo, Kotoba Dojo, Leaderboard).
- Right: Settings and Profile icons. On viewports under 425px the nav
  collapses behind a hamburger.
- Background: transparent at the top of the page, frosted
  `bg-white/80 backdrop-blur-sm border-b border-border` once the user has
  scrolled past a small threshold (16px in-app, 80px on the landing page).
  Transition runs over 200ms. See `components/layout/app-top-bar.tsx` and
  `components/layout/landing-nav.tsx` for the reference implementation.

### 5.3 Bottom Navigation

- Height: `h-16` (64px).
- Four items: Profile, Dojo, Library, Settings.
- Each item: icon above label, minimum tap area 44x44pt.
- Active item: `text-sage-500`, inactive: `text-text-muted`.
- Background: `bg-surface-raised` with a top border `border-t border-border`.
- Position: sticky bottom.
- Library shows a "under construction" state in Phase 1 (tapping shows a toast).

### 5.4 Mobile Keyboard Layout

The layout adapts based on input mode, not by detecting keyboard state dynamically.
Input mode already encodes the device context:

| Mode | Device | Native keyboard | Layout preset |
|---|---|---|---|
| Type | Desktop | Never opens | Full layout |
| Tap | Any | Never opens | Full layout |
| Swipe | Mobile | Always opens | Compact layout |

Swipe mode gets a compact layout preset applied immediately when the mode is
active. There is no keyboard detection, no threshold, no resize listener.
This eliminates false positives (e.g. a browser window being resized small
on desktop) and removes all runtime complexity.

**The compact layout design target:**
Design Swipe mode to work within a 360x300px content area. This represents the
smallest realistic phone width (360px, the industry-standard mobile baseline)
with the bottom half consumed by the native Japanese swipe keyboard. If the
layout works here, it works on every mobile device. Larger phones simply have
more breathing room.

**Swipe mode layout (compact preset):**
- Cycling animation: hidden
- Bottom nav: hidden
- Character prompt: full size, centred
- Word display: compact, single line where possible
- Input field: positioned at the bottom of the available space
- Distance counter: hidden

**Type and Tap mode layout (full layout):**
- Cycling animation: visible
- Bottom nav: visible
- All elements at standard sizes and positions

Implementation: the `PageShell` component reads the current input mode from
`useSettings()` and applies a `data-mode` attribute. Child components use this
attribute to conditionally render or hide elements via Tailwind variants.

No keyboard detection hook is needed.

### 5.5 Max Content Width

On large screens, content is centred with a max width to avoid extremely wide
reading lines and maintain a phone-like feel (appropriate for a typing app):

- Max content width: `max-w-md` (448px) for the practice screen and Dojo.
- Max content width: `max-w-2xl` (672px) for the leaderboard and profile.
- Always centred: `mx-auto`.

---

## 6. Components

### 6.1 Primitive Components (`components/ui/`)

These are the building blocks. They have no knowledge of game logic.

**Button**

```tsx
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}
```

Variants:
- `primary`: `bg-sage-500 text-white hover:bg-sage-600`
- `secondary`: `bg-sage-100 text-sage-600 hover:bg-sage-200`
- `ghost`: `bg-transparent text-text-secondary hover:bg-warm-100`
- `danger`: `bg-blush-100 text-blush-300 hover:bg-blush-300 hover:text-white`

All buttons: `rounded-xl font-medium transition-colors duration-150`
Minimum size: `min-h-11 min-w-11` (44pt touch target)

**Input**

```tsx
type InputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  autoFocus?: boolean
}
```

Style: `border border-border rounded-xl px-4 py-3 bg-surface-raised
        focus:outline-none focus:ring-2 focus:ring-sage-300`

Error state: `border-feedback-wrong focus:ring-feedback-wrong`

**ProgressBar**

Used in the Dojo for character mastery display.

```tsx
type ProgressBarProps = {
  score: number          // mastery score
  heatClass: string      // from getMasteryHeatClass(), e.g. 'bg-heat-3'
  isLocked: boolean
}
```

Style: `h-2 rounded-full` with the heatClass applied to the filled portion.
Locked state: `bg-heat-0 opacity-50`.

**Modal**

Two-step confirmation modals for destructive actions (unlock, reset).
First step: explain what will happen. Second step: final confirm.
Never show both steps at once.

### 6.2 Game Components (`components/game/`)

**CharacterDisplay**

Shows the kana character being practised. The largest element on the practice
screen. Font size is either fixed (`text-4xl`) or linked to mastery score if
that setting is enabled.

```tsx
type CharacterDisplayProps = {
  character: string      // e.g. "あ"
  fontSize?: string      // optional override for mastery-linked sizing
}
```

**TypeInput**

Text field for Type mode. Accepts romaji keyboard input. Inserts a zero-width
space (`U+200B`) after each hiragana so the Japanese IME treats each kana as
separate and does not offer kanji suggestions (see `docs/UX_DESIGN.md` section
7.3 for detail). When the current word is katakana, the real `<input>` has
transparent text and a katakana overlay `<div>` renders the converted display
value on top. Auto-focuses on mount and after each word advance.

**SwipeInput**

Text field for Swipe mode. Accepts raw mobile-swipe-keyboard input with no
zero-width-space manipulation (that trick doubles characters, breaks backspace,
and can crash the page on iOS because swipe keyboards commit multi-character
batches rather than one keystroke at a time). Keeps the same katakana overlay
as TypeInput for katakana words.

**TapInput**

On-screen character button grid for Tap mode. Shows only unlocked characters.
Buttons are sized for touch. The correct button highlights green on correct tap.
The wrong button highlights orange briefly before resetting.

Layout: CSS Grid, responsive columns. On mobile: `grid-cols-5`. On desktop: `grid-cols-8`.

Each tap button: minimum `h-11 w-11`, `rounded-lg`, `text-base`.

**FeedbackOverlay**

Shown on a wrong answer. Contains:
- Orange highlight applied to the correct character position.
- Mnemonic text (if enabled): `text-xs text-text-secondary text-center`.
- This component does not contain the audio trigger. Audio is handled by the hook.

### 6.3 Dojo Components (`components/dojo/`)

**CharacterGroup**

Top-level collapsible group for one script (Hiragana or Katakana). When open,
nests three `StageBlock` sub-sections (Seion, Dakuon, Yoon), each with its
own `GroupBar` and `CharacterGrid`. Every `GroupBar` (script and stage)
exposes label, progress bar, percentage, and a tiered unlock action: dark
blue for the script bar, medium/light blue for stage bars, grey when every
character in that scope is already unlocked (at which point the action
becomes "reset progress" and opens `BulkResetPrompt`).

Collapsed by default for scripts the user has not reached. Open by default
for the current active script; the earliest stage within that script with
locked characters auto-opens as the current stage.

**CharacterTile**

Individual character cell in the Dojo grid. Shows:
- The kana character.
- A mastery progress bar below it (using `ProgressBar` with the heat class).
- A lock icon overlay if the character is locked.
- Tapping a locked tile opens `UnlockPrompt`.
- Tapping the progress bar of an unlocked tile opens `BulkUnlockPrompt` (if in
  the same group as locked tiles).

---

## 7. Animation

### 7.1 Cycling Character

The cycling girl animation is the centrepiece of the landing page and the
practice screen. It runs continuously in the background.

- Asset: SVG or CSS animation (to be sourced or generated during Sprint 2).
- Cycling speed: controlled by a `speed` prop, ranging from `slow` to `fast`.
  Speed is set by the session hook based on recent correct-answer rate.
- Position: bottom-left of the screen on desktop, bottom-centre on mobile.
- The animation must never overlap the character prompt area.
- It must not cause layout shift when it starts or stops.
- Implementation: a React component in `components/animation/cycling-character.tsx`
  that accepts a `speed` prop and maps it to an animation duration CSS variable.

```tsx
type CyclingCharacterProps = {
  speed: 'idle' | 'slow' | 'medium' | 'fast'
}

// Maps to animation durations:
// idle:   4s
// slow:   2.5s
// medium: 1.5s
// fast:   0.8s
```

### 7.2 Transition Rules

- Page transitions: none. Instant navigation. Speed matters more than decoration.
- Wrong answer feedback: immediate. Orange highlight appears instantly.
- Correct answer reveal: meaning fades in over `150ms`.
- Modal open/close: `200ms` ease-in-out opacity and scale.
- Progress bar fill: `300ms` ease-out on mastery score change.
- All transitions use `transition-` Tailwind utilities, not custom CSS.
- No animations that exceed `300ms` in the main game loop.

---

## 8. Responsive Behaviour

LangTap is designed mobile-first. The smallest screen is designed first, then
larger screens receive more breathing room around the same layout. This is
industry-standard practice and the correct approach for an app where the primary
use case is mobile swipe input.

**Design baseline:** 320px wide, 568px tall. This is a hard floor, not an
aspiration. It covers the narrowest viewports still in the wild (iPhone 5/SE,
older Android compacts, folded foldables mid-unfold) as well as the standard
360x640 and 375x667 profiles. Every page must render cleanly at 320px with no
horizontal scroll and every touch target still at or above 44x44pt. If the
layout works here, it works on every device. The Kana Dojo is the reference
screen for this baseline; its fluid-scaling stack (see §8.1) is the pattern
to follow when content would otherwise squish or overflow on narrow viewports.

**Swipe mode compact target:** 320px wide, 300px tall content area (keyboard
open). This is the hardest constraint in the entire app. It must be tested
first.

**Font size minimum:** 16px for all body text. Below this, iOS Safari auto-zooms
the page when an input field is focused, which breaks the layout.

| Breakpoint | Tailwind prefix | Target device | Notes |
|---|---|---|---|
| 320px+ (default) | none | Compact phones, folded foldables | Base styles. Single-column layout. Must fit without horizontal scroll. |
| 480px+ | `xs:` (custom) | Large phones | Minor spacing increases. |
| 768px+ | `md:` | Tablets | Wider tap grid, more padding. |
| 1024px+ | `lg:` | Desktop | Max-width container centred on screen. |

Mobile-first means: write base styles for the smallest screen, then use `md:`
and `lg:` to add space and layout adjustments for larger screens. Never write
desktop styles first and shrink down.

The `max-w-md` (448px) container on the practice screen and Dojo means the
layout never stretches uncomfortably wide on desktop. It simply sits centred
with neutral background on either side.

### 8.1 Fluid Component Scaling

Some components need to scale their contents smoothly between the 320px
baseline and a larger max size, rather than snap at breakpoints. Two
patterns apply, used together where needed.

**Page-level fluid sizing (`clamp()` + `vw`).** Use when a component's size
should track the viewport width.

```css
width:     clamp(44px, calc(20vw - 20px), 76px);
font-size: clamp(12px, 3.5vw,  24px);
```

The `calc()` inside the middle argument is optional; it lets you bias the
scaling rate away from a pure linear vw mapping (for example, to subtract a
fixed gutter). Always include both a floor and a ceiling so the value pins at
the extremes.

**Component-internal fluid sizing (container queries + `cqw`).** Use when a
component's internal elements should scale with the *component's own width*,
not the viewport. Set the component as a width container, then use `cqw`
(container-query width) units for its children.

```ts
// Component root
style={{ containerType: 'inline-size', width: '100%', maxWidth: '76px' }}

// Inner text scales with the container, not the page.
style={{ fontSize: 'clamp(12px, 37cqw, 28px)' }}
```

This is the reference pattern for grids of tiles where each tile is itself
fluid. The Kana Dojo's `CharacterTile` uses this pattern so kana, romaji,
and the mastery pill all scale proportionally with the tile box.

**Cross-row alignment with `border-box` + `min-width` + internal padding.**
When a heading button must visually indent (sub-bullet hierarchy) while all
progress bars across rows still start at the same x-coordinate, pin the
heading's outer width with `min-width` on a `border-box` and apply the
indent as internal `padding-left`. The padding moves the label but leaves
the outer width (and therefore the bar start) untouched.

```ts
// Script row: pins the heading area at 145px max.
// Stage row: same min-width, adds padding-left so the stage label sits
// visually indented but the bar after the heading still starts at the
// same x as the script bar above it.
style={{
  boxSizing:   'border-box',
  minWidth:    'clamp(95px, calc(31.25vw - 5px), 145px)',
  paddingLeft: 'clamp(16px, 5vw, 24px)', // stage only
}}
```

**Responsive orientation flip at a content-fit breakpoint.** When a grid
layout needs to change orientation (e.g. horizontal on desktop, vertical on
mobile), pick the breakpoint at which the horizontal form stops fitting
rather than a default Tailwind size. The Kana Dojo flips at
`min-[1028px]:` because that is where its 988px content grid plus 40px of
outer padding first fits; other components may flip elsewhere. Use a single
tuned arbitrary breakpoint per component, not a chain of default breakpoints.

**Inline style is the accepted expression for these values.** Tailwind v4's
arbitrary-value syntax supports `clamp()` but is awkward with `calc()` that
contains commas and with container-query units. Inline `style={}` is
clearer at the call site for fluid expressions only. Hardcoded colours,
font sizes, and discrete spacing still use theme classes (see §13).

---

## 9. Accessibility

Every interactive element must meet these requirements before a screen is
considered complete:

- `aria-label` or visible label on all buttons, inputs, and controls.
- `role` attribute where the semantic HTML element is not self-describing.
- Keyboard navigation: tab order must be logical and complete.
- Focus styles: never remove outline. Use `focus:ring-2 focus:ring-sage-300`.
- Colour contrast: text must meet WCAG AA contrast ratios against its background.
  The sage palette has been chosen to meet this. Verify with a contrast checker
  before finalising colour assignments.
- Touch targets: minimum 44x44pt on all interactive elements.
- The cycling animation must have `aria-hidden="true"`. It is decorative.
- The lo-fi audio player must have accessible play/pause controls.

---

## 10. Screen States

Every screen must handle all three states. A screen that only handles the happy
path is not complete and must not be marked Done.

**Loading state:**
Use skeleton screens, not spinners where possible. The skeleton should match the
rough shape of the content that will appear.

```tsx
// Skeleton pattern
<div className="animate-pulse">
  <div className="h-8 w-32 bg-warm-200 rounded-lg" />
  <div className="h-4 w-full bg-warm-200 rounded mt-3" />
</div>
```

**Error state:**
Show a human-readable message. Never show a raw error string from Supabase.
Always offer a recovery action (retry button, go back, reload).

```tsx
<div className="text-center p-8">
  <p className="text-text-secondary">Something went wrong loading your progress.</p>
  <Button variant="secondary" onClick={retry} className="mt-4">Try again</Button>
</div>
```

**Empty state:**
Explain why there is nothing to show and offer a next action.

```tsx
// Example: leaderboard with no entries yet
<div className="text-center p-8">
  <p className="text-text-secondary">No scores yet. Start practising to appear here.</p>
  <Button variant="primary" onClick={goToPractice} className="mt-4">Start practising</Button>
</div>
```

---

## 11. Guest Mode Banner

Shown persistently on every screen for guest users until they create an account
or dismiss it for the session.

Style: a thin banner at the top of the content area, below the TopBar.
- Background: `bg-warm-100 border-b border-border`.
- Text: `text-sm text-text-secondary`.
- Copy: "Your progress will be lost when you close this tab."
- Action: "Create an account" link (navigates to sign-up).
- Dismiss: an X button that hides the banner for the current session only.
  Dismissal is stored in session state, not persisted to localStorage.

---

## 12. No Em-Dashes Rule

Em-dashes must not appear anywhere in UI copy, labels, button text, error messages,
mnemonic strings, or any other user-facing text. Use a plain hyphen, a colon, or
rewrite the sentence. See CLAUDE.md Section 15 for the full rule.

---

## 13. What the AI Must Not Do

- Never add inline styles for colour, discrete spacing, or font size.
  Always use theme tokens and Tailwind utility classes for these. Inline
  `style={}` is only permitted for fluid-scaling expressions (`clamp()` with
  `vw` or `cqw`, `container-type: inline-size`, `border-box` `min-width` +
  `padding-left` alignment) where Tailwind arbitrary-value syntax is awkward.
  See §8.1 for the sanctioned patterns.
- Never hardcode a colour value. Always use a token class.
- Never hardcode a font size in pixels. Always use a type scale class.
- Never hardcode a spacing value. Always use the spacing scale.
- Never skip a loading, error, or empty state on a screen component.
- Never remove focus styles from an interactive element.
- Never make a component import from `services/` directly. Go through hooks.
- Never put business logic in a component. It belongs in hooks, stores, or engine.
- Never use `any` in a component's TypeScript.

---

*This document is the authoritative reference for all frontend decisions.*
*If a component conflicts with this document, the document wins.*
*Update this document before introducing any new pattern, token, or layout rule.*
