# LangTap UX/UI Design Specification

Version 2.1 | April 2026
Status: Active - Sprint 2B

This document is the visual and interaction design source of truth for LangTap.
No screen may be implemented until its spec here is marked Approved.
All colour tokens, type scale, and component rules defer to FRONTEND.md.
No em-dashes anywhere in this document or in any UI copy.

---

## 1. Core Philosophy and Aesthetic

**The Vibe:** A calm, slightly wistful journey. Think Studio Ghibli - a quiet
countryside road, unhurried but purposeful. Not fast-paced, not a game. Clean paper,
morning light, a quiet room.

**Key Principles:**
1. Calm over excitement. Progress is steady and quiet. Correct answers feel like a
   gentle nod. Wrong answers are a soft correction, never an alarm.
2. Clarity over decoration. The kana character at the centre of the screen is the
   undisputed hero. UI chrome should recede and strictly support the learning flow.
3. Journey metaphor. Visuals emphasise moving forward, one step or one push at a time.
   The distance counter complements this without feeling like a stressful gamified score.
4. Consistency over cleverness. Every screen uses the same tokens, the same components,
   the same patterns. A user who understands one screen understands all of them.

---

## 2. Global Visual Identity

### 2.1 Logo

**Full logo:** The word "LangTap" rendered in Zen Maru Gothic Bold inside a keyboard
key shape. The key uses the raised-surface 3D style described in Section 2.3. Colour:
sage-toned face with a warm-cream shadow edge.

**Compressed logo (LT):** The letters L and T stacked vertically inside the same key
shape. Used in:
- The in-app top bar at all times
- The landing page top bar on mobile (below md breakpoint)
- As the easter egg resolved state (see below)

**Easter egg - typing "langtap":**
- A global keydown listener tracks the last 7 characters typed.
- Trigger fires when "langtap" is matched in sequence.
- Does not trigger when focus is inside a game input field.
- On trigger: full logo animates to a scale-down (150ms ease-in), switches to the LT
  compressed version, plays the easter-egg-click sound, holds for 4 seconds, then
  reverts with a scale-up animation (150ms ease-out).
- On the landing page nav: reverting is delayed until after the animation plays fully.

### 2.2 Colour Palette

All tokens are defined in FRONTEND.md Section 2 and app/globals.css.
Additional colours used only on the marketing pages:

| Name | Value | Usage |
|---|---|---|
| sky-mid | #c9e8f5 | Sky background, upper region |
| sky-horizon | #e8f4fb | Sky background, horizon fade |
| grass-bright | #8bc34a | Ground strip and hills foreground |
| navy-deep | #1a3a5c | Log In button background |
| White | #ffffff | Footer and auth screen backgrounds |

### 2.3 Keyboard Key Button Style

All primary interactive buttons use a physical keyboard key aesthetic, as seen in
the CTrl and Shift key reference images.

**Visual anatomy:**
- Shape: rounded rectangle, `rounded-xl`
- Top face: slightly lighter than the edge to simulate the raised surface
- Bottom edge: a solid 4px shadow in a darker shade using `shadow-[0_4px_0_0_<shade>]`
- This creates a readable 3D lift effect
- Background colour varies by context (see per-screen specs)

**Interaction:**
- On hover: slight brightness lift, `hover:brightness-105`
- On press: translates down 2px and shadow collapses,
  `active:translate-y-[2px] active:shadow-none`
- On click: plays `key-click.wav` (short mechanical click, <100KB WAV)
- Transition: `transition-all duration-75`

**Applies to:**
- All CTA buttons on the landing page
- Log In and Sign Up nav buttons
- Character tap buttons in Tap mode
- Any explicitly key-shaped UI element

Social media footer icons and nav links play `key-click-soft.wav` on interaction.

### 2.4 Typography

Font: Zen Maru Gothic, loaded via Google Fonts.
Weights: 400 body, 500 labels and UI, 700 headings and logo.
Full size scale is defined in FRONTEND.md Section 3.2.

### 2.5 Sound Assets

All sounds are in `public/sounds/`. They are on by default and muted when the user
disables audio in settings or when the OS silent mode is active.

| File | Description | Trigger |
|---|---|---|
| key-click.wav | Short mechanical key press | All key-style buttons |
| key-click-soft.wav | Lighter click | Nav links, social icons, secondary interactions |
| easter-egg-click.wav | Satisfying heavy clunk | Easter egg trigger only |

### 2.6 Mascot Character

A simple, bold flat-colour stick figure on a bicycle. Design language directly
inspired by the Chineasy walking character: thick black limbs, a solid round head
in a single accent colour (blush pink `#f0a8b4`), no outlines or gradients, no
facial features beyond the head shape. Flat SVG, two or three colours maximum.

The bicycle itself uses the same flat style: thick black frame, two circles for
wheels, no detail beyond what reads at small sizes.

The mascot is a single SVG file with CSS keyframe animation on the legs and wheels.
No external image assets. No JavaScript required for the animation.

Speed states (controlled by a `speed` prop on the React component):
- idle: 4s pedal cycle (landing page, game home)
- slow: 2.5s pedal cycle (early session, low correct-answer rate)
- medium: 1.5s pedal cycle (steady practice)
- fast: 0.8s pedal cycle (high correct-answer streak)

Position: bottom-left of the scene layer on desktop. Bottom-centre on mobile.
The mascot must never overlap the game window or the top bar.
On mobile in Tap mode, the tap grid extends below the game window. The mascot
rides behind the tap grid visually (lower z-index) and is partially or fully
obscured. This is acceptable - the mascot is decorative.
On mobile in Swipe mode, when the native keyboard is open, the mascot is hidden
entirely (display:none via the swipe-keyboard-open state). No layout shift.

### 2.7 Parallax Landscape

Used on the landing page and all game screens. The scene layers are:

| Layer | Contents | Scroll / animation rate |
|---|---|---|
| Sky | Gradient background, clouds | Clouds drift right-to-left continuously at idle rate |
| Far hills | Two or three rounded green hill silhouettes | Parallax at 10% scroll rate (landing only) |
| Hill details | Kanji 木 (tree), 林 (grove), 森 (forest) as charcoal stroke icons | Same as far hills |
| Ground strip | Bright green band, subtle grass texture | Parallax at 20% scroll rate (landing only) |
| Mascot | Cycling character | Rides on top of ground strip |
| Game window | Rounded card panel | Fixed above ground, no parallax |

On game screens (non-scrollable): the clouds drift continuously at idle speed.
The hills do not move. The ground strip is static.

### 2.8 Scene Themes

The parallax landscape scene has four visual themes. The active theme is set by
the user in Settings and persists across sessions.

| Theme | Time feel | Sky colours | Ground colour | Cloud colour | Notes |
|---|---|---|---|---|---|
| Day | Mid-morning, clear | `#c9e8f5` to `#e8f4fb` | `#8bc34a` bright green | White `#ffffff` | Default theme |
| Sunrise | Golden morning | `#fde9c9` to `#fcc97a` warm amber | `#7ab648` | Soft peach `#fde0c0` | Low sun implied by warm gradient |
| Sunset | Dusk, warm orange | `#f4a261` to `#e76f51` to `#264653` deep blue | `#4a7c59` deeper green | Lilac `#c9b8d8` | Darker, more dramatic |
| Night | Clear night sky | `#0d1b2a` to `#1b2a3b` deep navy | `#2d4a3e` very dark green | Pale grey `#8899aa` translucent | Stars as small white dots scattered in sky layer |

Theme colours are defined as Tailwind CSS custom tokens grouped under a `theme-`
prefix. The active theme class is applied to the root scene container and all
child layers inherit from it via CSS custom properties.

Switching themes in Settings takes effect immediately with a 500ms cross-fade
on the scene background only. Character tile colours and UI chrome do not change.

---

## 3. Landing Page Spec

**Status:** In Progress
**Route:** `/` (shown only to logged-out users)
**Scrollable:** Yes
**Layout:** Single continuous vertical page

### 3.1 Top Navigation Bar

Height: 64px, sticky.
At top of page: fully transparent over the sky background.
After scrolling 80px: transitions to `bg-white/80 backdrop-blur-sm border-b border-border`.
Transition: `transition-all duration-200`.

**Desktop layout (md and above):**
- Left: Full LangTap logo (key style, clickable, plays key-click sound, routes to `/`)
- Centre: Text links - About, Pricing, Leaderboard
  - Zen Maru Gothic base size
  - On hover: soft underline fade-in (`transition-all duration-150`)
- Right: Log In button (navy-deep key style) and Sign Up button (mint-500 key style)
  - Both play key-click sound on press

**Mobile layout (below md):**
- Left: Compressed LT logo
- Right: Hamburger icon (three horizontal lines, 24x24, charcoal)
- On tap: full-screen menu overlay opens
  - Background: sage-50
  - Links stacked vertically in Zen Maru Gothic text-2xl with generous padding
  - Order: About, Pricing, Leaderboard, Sign Up (mint-500 key button), Log In (navy key button)
  - Closes with an X button top-right or swipe-up gesture

### 3.2 Hero Section

Full viewport height. The parallax scene (Section 2.7) fills this area.

**Copy block, centred in the sky:**

Heading (text-4xl md:text-5xl, Zen Maru Gothic Bold, warm-800):
"A journey of a thousand miles begins with a single tap."

Subheading (text-base md:text-lg, warm-600, max-w-sm centred):
"Build real Japanese typing speed through calm, focused repetition."

CTA button below: "Try it now" - mint-500 key style, large, routes to `/practice?guest=true`.
Second link below that: "Create a free account" - plain text link, warm-600.

**Clouds:**
- Desktop: 5 to 7 white SVG cloud shapes at varying sizes and heights across the sky
- Mobile: 3 to 4 clouds
- All clouds drift slowly right-to-left on a CSS animation loop, staggered timing
- No interaction with the user

**Ground and mascot:**
- Bright green ground strip occupies the bottom 15% of the hero viewport
- Mascot rides at idle speed from left, loops continuously
- Two rounded green hill silhouettes at the horizon, partially behind ground strip
- Charcoal 木, 林, 森 icons on the hills as decorative details

### 3.3 Scroll Behaviour on Landing Page

The page starts fully static. On scroll, CSS scroll-driven animations activate:
- Clouds and ground strip: translate upward at 20% of scroll distance
- Far hills: translate upward at 10% of scroll distance
- All foreground content (copy, buttons): scroll at full rate (normal document flow)

As the user scrolls below the hero, the landscape recedes upward and the content
sections below rise into view.

### 3.4 Content Sections (Below the Hero)

These sections sit below the hero on a white or cream background and scroll normally.

**Section A - How it works:**
Three short columns (stacked on mobile, side-by-side on desktop):
1. "Choose your characters" - brief description of the unlock system
2. "Type, tap, or swipe" - brief description of the three input modes
3. "Watch your progress" - brief description of the Dojo and mastery heatmap

Each column has a small SVG illustration (to be designed - placeholder for now).

**Section B - Pricing:**
This section corresponds to the Pricing nav link.
Three pricing tier cards, displayed side-by-side on desktop, stacked on mobile.

| Tier | Price | Distance limit | Style |
|---|---|---|---|
| Free | $0 / month | 50m per day | Sage-100 background, warm-800 text |
| Regular | $3 / month | 300m per day | Sage-500 background, white text |
| Unlimited | $5 / month | No limit | Warm-800 background (near black), white text, gold accent border |

Each card: tier name, price, distance allowance, and a CTA button.
Free tier CTA: "Start for free" (routes to sign-up).
Paid tier CTAs: "Get started" (routes to sign-up, Stripe wired in Phase 2 - stub in Phase 1).
Paid tier cards show "Coming soon" badge in Phase 1 with buttons disabled.

Note: distance limits and exact pricing are illustrative for Phase 1 display purposes.
Final pricing confirmed when Stripe is activated in Sprint 11.

**Section C - Leaderboard preview:**
This section corresponds to the Leaderboard nav link.
Shows a live or static preview of the global leaderboard top 10.
Same visual style as the full leaderboard screen (see Section 9).

**Section D - Promo space:**
Blank white area reserved for future promotions, app store badges, or marketing copy.
Leave completely empty in v1. Dimensions: full-width, 240px height.

### 3.5 Footer

A smooth gradient transition from the last content section background into white.
The ground strip from the hero does not appear in the footer. The footer is plain white.

**Footer layout:**
- Left column: About Us, Contact Us, FAQ links
- Centre column: Legal - Privacy Policy, Terms of Service
- Right: Follow Us - social media icons (Twitter/X, Instagram, YouTube, TikTok)
  - Each icon plays key-click-soft.wav on click
- Far right: Follow Us label

Social icon style: charcoal, 24px, rounded square shape. No colour fill.
Footer text: Zen Maru Gothic text-sm, warm-600.

---

## 4. Auth Screens Spec

**Status:** To Do
**Routes:** `/sign-up`, `/log-in`
**Scrollable:** No
**Layout:** Single centred card on a plain background

### 4.1 Background

A plain gradient, not the landscape scene.
Gradient: `from-blue-900 via-blue-700 to-blue-500`, diagonal, covering the full viewport.
No clouds, no mascot, no parallax.

### 4.2 Sign-Up Screen

Centred card (`bg-surface-raised rounded-2xl p-8 shadow-xl max-w-sm w-full`):

- LangTap logo at top, centred
- Heading: "Create your account" (text-xl, warm-800)
- Username field (label: "Username") - helper text: "This is what appears on the leaderboard. No real name needed."
- Email field
- Password field with strength indicator below (four-segment bar, grey to mint-500)
- Sign Up button (mint-500 key style, full-width)
- Divider: "or"
- Google sign-in button (white key style, charcoal text, Google icon) - Phase 1 stub, disabled with "Coming soon" tooltip
- Apple sign-in button (black key style, white text, Apple icon) - Phase 1 stub, disabled with "Coming soon" tooltip
- Footer link: "Already have an account? Log in"

### 4.3 Log-In Screen

Same card style as sign-up.

- LangTap logo at top, centred
- Heading: "Welcome back" (text-xl, warm-800)
- Email field
- Password field
- "Forgot your password?" link below password field (text-sm, mint-500)
- Log In button (navy-deep key style, full-width)
- Divider: "or"
- Google and Apple buttons (same stub state as sign-up)
- Footer link: "No account? Sign up for free"

### 4.4 Guest Mode Entry

Not a screen. A text link on the landing page hero: "Continue without an account".
Routes to `/practice?guest=true`.
Guest banner is shown persistently on all screens once in guest mode (see FRONTEND.md Section 11).

---

## 5. Onboarding Flow Spec

**Status:** To Do
**Routes:** `/onboarding/step-1` through `/step-4`
**Scrollable:** No per step
**Layout:** Same blue gradient background as auth screens

A persistent step indicator at the top of the card shows: Step 1 of 4, Step 2 of 4, etc.
Progress dots, not numbers. Four dots, the current step filled in mint-500.

Back button (text link, top-left of card) on steps 2 onwards.
Skip button (text link, top-right of card) on steps where skipping is valid.

### 5.1 Step 1 - JLPT Self-Assessment

Heading: "How much Japanese do you know?"
Subheading: "This helps us choose the right vocabulary for you. You can change this later in Settings."

Five buttons stacked vertically, each describing a JLPT level:
- N5: "I'm just starting out"
- N4: "I know some basics"
- N3: "I'm getting comfortable"
- N2: "I'm approaching fluency"
- N1: "I'm near native level"

Selecting one highlights it in sage-200 and enables the Next button (mint-500 key style).
Default: N5 is pre-selected.

This single selection (`kotoba_jlpt_level`) controls word selection in both Kotoba Mode
(hard filter) and Kana Mode (soft preference for word draws). Words below the selected
level are marked as mastered. The user is shown: "Words below this level will be marked
as mastered. To reset, change your level in Profile settings."

### 5.2 Step 2 - Early Character Unlock

Heading: "Which characters do you already know?"
Subheading: "Tap any character you can already recognise. These will be unlocked immediately so you can get straight to practising them."

Displays the full kana chart: hiragana seion, then katakana seion, as a scrollable grid inside the card.
Each character is a small tap button. Tapped = selected (sage-300 background with a tick).
All characters start unselected.

At the bottom:
- Character count: "12 characters selected"
- "Unlock these" button (mint-500 key style, enabled when at least 1 selected)
- "Skip" link (no early unlock, start from the beginning of the sequence)

Confirmation before applying: a modal with "Unlock 12 characters?" and Confirm / Cancel.

### 5.3 Step 3 - Notification Preferences

Heading: "Practice reminders"
Subheading: "We can remind you to practise. You can change this any time."

Single toggle: "Send me practice reminders" - off by default.
If toggled on: "Great - we will remind you to practise each day." (placeholder text, actual push notification wiring is Phase 1 later sprint).

Next button always enabled.

### 5.4 Step 4 - Input Mode Selection

Heading: "How do you want to practise?"
Subheading: "Choose the input style that suits you. You can switch at any time."

Three large option cards stacked vertically:
- Type: "Type the romaji on your keyboard" - shows a keyboard icon
- Tap: "Tap the correct character on screen" - shows a tap/touch icon
- Swipe: "Use your phone's swipe keyboard" - shows a swipe gesture icon

Selecting one highlights the card (sage-100 border + sage-500 left accent bar).
Default: Type is pre-selected.

"Start practising" button (mint-500 key style) completes onboarding and routes to `/practice`.

---

## 6. Game Home Screen Spec

**Status:** Done
**Route:** `/home` (logged-in users only)
**Scrollable:** No
**Layout:** Full-screen landscape scene

This is the mode selection hub for logged-in users. Guests are redirected
to `/practice` (see Section 6.5).

### 6.1 Layout

The full parallax landscape fills the viewport (`overflow: hidden`, no scroll).
The user's selected scene theme class is applied to the scene root. Default: `theme-day`.
Clouds drift continuously. The mascot cycles at idle speed on the ground strip.

No distance counter on this screen. The counter appears only on the practice screen.

### 6.2 In-App Top Bar (All Game Screens)

This top bar replaces the marketing nav on all screens inside the app.
Fully transparent (no background colour), matching the landing page nav style.

Height: 56px (`h-14`), fixed, `z-50`.

**Desktop layout (md and above):**
- Left: Full LangTap logo (`LogoFull`). Plays key sound on click. Easter egg on "langtap" typed.
- Centre: Text links: Home, Kana Dojo, Kotoba Dojo, Leaderboard
  - Active link: `text-sage-500 font-bold`
  - Inactive: `text-warm-800 font-medium hover:text-sage-400`
  - All links have `hover:bg-white/10` translucent box on hover
- Right: Settings (gear icon), Profile (avatar icon)
  - `hover:text-sage-400 hover:bg-white/10`

**Mobile layout (below md):**
- Left: Compressed LT logo (`LogoLt`)
- Centre: Icons: Home (house), Kana Dojo (あ), Kotoba Dojo (言), Leaderboard (trophy)
  - Active: `text-sage-500`, Inactive: `text-warm-800 hover:text-sage-400`
  - All icons have `hover:bg-white/10` translucent box
- Right: Settings gear, Profile avatar (same hover behaviour)

All icons are inline SVGs using `currentColor` for theme support.
Minimum touch target 44x44pt. No labels on mobile.

### 6.3 Mode Selection Buttons

Two large keyboard-key-style buttons in the sky area. 180x100px at all breakpoints.
Stacked vertically on mobile, side-by-side on desktop (`flex-col md:flex-row`).

**Practice Kana button:**
- `bg-sage-500`, white text "Practice Kana"
- Shadow: `shadow-[0_6px_0_0_#456e3d]`
- Hover: `brightness-110`. Active: translateY + shadow collapse.
- Click: plays `ui-mode-kana` sound, navigates to `/practice?mode=kana`

**Practice Kotoba button (locked state):**
- `bg-warm-200`, `text-warm-400`
- Shadow: `shadow-[0_6px_0_0_#b8a898]`
- Inline lock SVG (`strokeWidth={3}`, `currentColor`) positioned at bottom-quarter
  of button via absolute positioning (does not affect text centering)
- `aria-disabled="true"`, `cursor-not-allowed`
- On click: shows tooltip "Complete Kana to unlock" (3s auto-dismiss)

**Practice Kotoba button (unlocked state):**
- `bg-blush-300`, `text-warm-800`
- Same interaction as Kana button, navigates to `/practice?mode=kotoba`

### 6.4 Guest Behaviour

Guests bypass this screen entirely. Middleware redirects `/home` to `/practice?mode=kana`.

### 6.5 Accessibility

- Mode buttons: `aria-label` describes mode and state
- Top bar icons: each has `aria-label`
- Mascot and clouds: `aria-hidden="true"`
- `prefers-reduced-motion`: `speed="stopped"` passed to landscape and cyclist

---

## 7. Practice Screen Spec

**Status:** Done
**Route:** `/practice`
**Scrollable:** No
**Layout:** Full-screen landscape scene with game window overlay

### 7.1 Layout Zones

```
+--------------------------------------------------+
| In-App Top Bar (56px, fixed, transparent)        |
+--------------------------------------------------+
|  Sky / Landscape zone                            |
|  [Game window - centred floating card]           |
|    [Mode dropdown - top left inside card]        |
|    [Distance counter - top right inside card]    |
|    [Word prompt - centred]                       |
|    [Input area - below prompt]                   |
|                                                  |
|  [Mascot - bottom of landscape]                  |
|  [Ground strip]                                  |
+--------------------------------------------------+
|  [Audio player - bottom right]                   |
+--------------------------------------------------+
```

The game window is a rounded card floating in the landscape zone at `top-[35%]`.
The mascot moves beneath it. All three modes (Type, Tap, Swipe) share the same
full landscape layout with top bar, mascot, and ground visible.

### 7.2 Game Window

Visual style:
- Background: warm paper yellow (`#faf5e4`)
- Shape: `rounded-2xl`
- Shadow: keyboard-key style `shadow-[0_6px_0_0_#d4c9b0]`
- Width: `max-w-md` (448px), full-width on small mobile
- Padding: `p-6 md:p-8`

**Top row (inside the card):**
- Top left: Mode dropdown showing "Kana Tap", "Kana Type", or "Kana Swipe".
  Clicking opens a list with Tap, Type, Swipe options. Switching is instant.
  Bold dark text (`text-sm font-bold text-warm-800`).
- Top right: Distance counter showing `0m` (plain text, `text-base font-bold text-warm-800`).

**Word prompt (centred, below top row):**
The full word is displayed at `text-5xl md:text-6xl font-bold`. The user types
through the word character by character. Each character in the word is a separate
`<span>` with a colour that changes based on state:

| Character state | Colour |
|---|---|
| Upcoming (not yet reached) | `text-warm-800` (dark) |
| Completed correctly | `text-feedback-correct` (green) |
| Current, wrong attempt 1 | `text-[#f5c490]` (light orange) |
| Current, wrong attempt 2 | `text-[#f5ac6a]` (medium orange) |
| Current, wrong attempt 3+ | `text-feedback-wrong` (full orange) |
| All complete (word finished) | `text-feedback-correct` (all green) |

**Romaji hint (floating above current character):**
Hidden by default. After 3 wrong attempts on a character, the romaji hint
appears floating above that specific character using absolute positioning
(`absolute -top-5 left-1/2 -translate-x-1/2 text-lg font-medium text-warm-400`).
The hint persists until the user types the correct answer.

**English meaning (below word prompt):**
Hidden until the last character in the word is answered correctly. Fades in
over 150ms. Stays visible for MEANING_DISPLAY_MS (1500ms), then the next
word loads. `text-base text-warm-600 text-center`.

**Input area:** varies by mode (see Sections 7.3, 7.4, 7.5).

### 7.3 Type Mode

A single text field below the word prompt:
- Style: `rounded-xl border-2 border-border bg-surface-raised text-center text-xl`
- Placeholder: "Type here..." (warm-400)
- Auto-focused on mount and after each word advances

Input is cumulative across characters in a word. For the word "いぬ" (romaji "inu"):
the user types "i" (い turns green), then continues typing "nu" (full input is "inu",
ぬ turns green, meaning appears). The input field is not cleared between characters.

Border flashes green on correct character completion, orange on wrong input.
Wrong input resets the field to the last valid prefix.

Each typed letter plays its matching keyboard sound from the audio sprite
(e.g. typing "a" plays the A key sample).

### 7.4 Tap Mode

A grid of romaji buttons inside the game window below the word prompt.
The user reads the kana word and taps the matching romaji for each character.

**Button style:**
- Rounded rectangle, `rounded-xl`, sage-100 background
- Shadow: `shadow-[0_3px_0_0_var(--color-sage-300)]`
- Active press: `translate-y-[3px]`, shadow collapse
- Content: romaji text only (`text-base font-medium text-warm-800`)
- Correct tap: face flashes sage-400
- Wrong tap: face flashes feedback-wrong orange

Each tap plays the matching romaji key sound from the audio sprite.

Grid: `grid-cols-5` at all breakpoints. Each button minimum 44x44.
Only unlocked characters appear. Locked characters are excluded.

### 7.5 Swipe Mode

Same layout as Type and Tap modes (full landscape, top bar, mascot visible).
A text field for input (same as Type mode) with a banner below:
"This mode is for the mobile swipe keyboard"

Input evaluation: same as Type mode. The swipe keyboard produces romaji or kana
input which is evaluated against the expected romaji.

### 7.6 Audio Player

Positioned bottom-right of the screen at all breakpoints.

Visual style:
- Background: `bg-white/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5`
- Play/pause button: circular, `h-7 w-7`, `bg-white/50`, charcoal icon
- Label: "Lo-fi" (`text-xs text-warm-600`)

Phase 1 placeholder: button is present but plays nothing until lo-fi tracks
are sourced in Sprint 10. Plays `ui-audio-toggle` sound on press.

### 7.7 Sound System

**Current implementation (audio sprite):**
All game and UI sounds use a single audio sprite (`public/sounds/keys.ogg`)
loaded via the Web Audio API. The `useKeySound` hook initialises a shared
`AudioContext`, decodes the sprite into an `AudioBuffer`, and exposes
`playSound(id)` which plays a slice defined in `data/audio/key-sound-map.ts`.

Each key on a standard keyboard has a unique recorded sample in the sprite,
mapped by `[startMs, durationMs]`. Letter keys (a-z) are used for typing sounds.
Non-letter keys (Escape, F1-F12, Tab, CapsLock, etc.) are mapped to UI actions
(settings click, profile click, logo click, mode switch, etc.) for variety.

The sprite and mappings were sourced from the owner's Keyboard project.

**Legacy fallback (single file):**
The landing page components (`landing-nav.tsx`, `landing-footer.tsx`,
`key-button.tsx`) and `useEasterEgg.ts` still use the old single-file approach:
```ts
const audio = new Audio('/sounds/Keyboard%20Click.mp3')
audio.volume = 0.5
audio.play().catch(() => {})
```
This can be migrated to the sprite system in a future pass, or kept as a
lightweight fallback for pages that do not need the full sprite.

### 7.8 Wrong Answer Feedback

Wrong answers use a **progressive 3-attempt system**:

1. **First wrong:** Current character turns light orange (`#f5c490`).
   Input resets to last valid prefix. User retries.
2. **Second wrong:** Character turns medium orange (`#f5ac6a`).
   Input resets. User retries.
3. **Third wrong:** Character turns full orange (`text-feedback-wrong`).
   Romaji hint appears floating above the character.
   Hint and orange persist until the user types the correct answer.

Wrong attempt count resets when the user gets the character right and advances.
No sound effect for wrong answers. Calm and silent.

### 7.9 Correct Answer Feedback

**Per-character (within a word):**
Completed character turns green (`text-feedback-correct`). Next character
becomes the active target. Input continues accumulating (Type/Swipe) or
user taps the next romaji (Tap). Wrong attempt count resets.

**Word complete (last character correct):**
1. All characters turn green simultaneously
2. English meaning fades in below the word (150ms)
3. After MEANING_DISPLAY_MS (1500ms): next word loads

No sound effect. Calm and immediate.

### 7.10 Mode Switcher

The mode switcher is a text dropdown inside the game window card (top-left).
It displays the current mode as "Kana Tap", "Kana Type", or "Kana Swipe".
Clicking it opens a dropdown list with three options: Tap, Type, Swipe.
Selecting an option switches the mode instantly. Plays `ui-mode-switch` sound.

The dropdown closes on selection or outside click.

---

## 8. Dojo Screen Spec - Kana

**Status:** To Do
**Route:** `/dojo` (when in Kana mode)
**Scrollable:** Yes (content may exceed one screen)
**Layout:** Standard in-app layout with top bar, scrollable content area

### 8.1 Overview

The Dojo shows the user's complete mastery picture for kana characters.
It is a progress screen, not a game screen. No input occurs here.

### 8.2 Chart Layout

On the Dojo screen, all characters are organised into the progression stages
defined in GAME_DESIGN.md Section 4.3:
- Stage 1: Seion (hiragana then katakana)
- Stage 2: Dakuon
- Stage 3: Yoon

**Desktop:** Charts are displayed horizontally with rows for each consonant group
(a, ka, sa, ta, na, ha, ma, ya, ra, wa) and columns for each vowel (a, i, u, e, o).

**Mobile:** Charts are also horizontal (scrollable within the row), matching the
reference hiragana table image. The table scrolls horizontally within its container.

### 8.3 Stage Sections

Each stage (Seion, Dakuon, Yoon) is a collapsible section with:
- Section heading (text-xl, warm-800): e.g. "Seion"
- A total progress bar for the entire stage (using heatmap logic)
  showing average mastery across all characters in the stage
- Toggle arrow (chevron right / chevron down)
- Collapsed by default for stages the user has not reached
- Open by default for the current active stage

Within each stage, sub-sections by script (Hiragana, Katakana) each have:
- Sub-heading (text-lg, warm-600)
- Their own progress bar (average mastery for that sub-section)
- The character grid

### 8.4 Character Tiles

Each character is a tile in the grid:
- Background: heatmap colour based on mastery score using the colour scale:
  - 0 points: grey (locked visual) or sage-100 (unlocked but unpractised)
  - 1-3 points: blush pink `#F09EA7` to orange `#F6CA94`
  - 4-5 points: orange `#F6CA94` to yellow `#FAFABE`
  - 6-7 points: yellow `#FAFABE` to green `#C1EBC0`
  - 8-9 points: green `#C1EBC0`
  - 10+ points: green `#C1EBC0` with a gold shimmer accent `#D4AF37`
- Kana character: centred, text-xl Zen Maru Gothic
- Romaji below: text-xs, warm-400
- Mini progress bar at bottom of tile using the heatmap colour
- Locked state: grey background, padlock icon overlay, character slightly dimmed

Tapping a tile:
- If locked: opens the unlock prompt for that individual character
- If unlocked: opens a detail popover showing the character, its romaji, its mnemonic
  (if mnemonics are enabled in settings), and its current mastery score

### 8.5 Unlock Interaction

**Individual unlock:**
Tapping a locked character tile opens a modal:
"Unlock [character]?"
Subtext: "You can practise this character straight away."
Buttons: "Unlock" (mint-500) and "Cancel"

**Group unlock (via progress bar):**
Tapping the progress bar of any section (stage or sub-section) that contains locked
characters opens a modal with three options:
1. "Unlock all characters in [Stage name]"
2. "Unlock all characters in [Sub-section name]" (e.g. Hiragana Seion)
3. "Select characters to unlock" - opens a multi-select view of all locked characters
   in that section, with checkboxes. Confirm button: "Unlock [n] characters".

All unlock actions require a confirmation tap. No single-tap bulk unlocks.

---

## 9. Dojo Screen Spec - Kotoba

**Status:** To Do
**Route:** `/dojo` when Kotoba mode is active
**Scrollable:** Yes
**Layout:** Standard in-app layout

### 9.1 Overview

Kotoba has its own dojo, accessed by navigating to Dojo while Kotoba mode is active
(or by selecting from the game home screen).

Content population: placeholders only in v1. Full data to be populated in later sprints.
The first level of each N (N5 level 1, N4 level 1, etc.) should have sample content.

### 9.2 JLPT Level Navigation

At the top of the Kotoba Dojo: a horizontal row of five buttons:
N5, N4, N3, N2, N1

Style: key-style buttons. Active level: mint-500 background. Inactive: sage-100 background.
These are scrollable horizontally on mobile.

### 9.3 Level Set Browsing

Below the JLPT buttons, the selected level shows its sets of content.

Layout inspired by the WaniKani unit reference images:
- A horizontal row of unit cards (Unit 1, Unit 2, etc.)
- Each card shows the unit name and the level range it contains (e.g. "Levels 1-69")
- The active or available unit is highlighted (lighter background with border)
- Locked units are greyed out

Clicking a unit expands a list of level groups beneath it (accordion style):
- "Levels 1-2" (expandable row)
- "Levels 3-4" (expandable row)
Each level group, when expanded, shows a grid of word cards
with their mastery tile style (same heatmap as Kana dojo).

### 9.4 Sample Content (v1)

For implementation purposes, populate:
- Kotoba N5 Level 1: first 10 entries from the JMdict N5 word bank

All other sets are shown as empty or locked placeholders.

---

## 10. Profile Screen Spec

**Status:** To Do
**Route:** `/profile`
**Scrollable:** Yes
**Layout:** Standard in-app layout

### 10.1 Content

**Header section:**
- Avatar: a simple generated icon based on username initial (no photo upload in Phase 1)
- Username (text-xl, warm-800)
- "Member since [date]" (text-sm, warm-400)
- For guests: "Playing as guest" with a prominent "Save your progress" CTA button (mint-500 key style)

**Stats section:**
- Total mastery score (large number, sage-600)
- Total characters practised
- Total distance travelled (odometer-style display, metres or feet)
- Current streak (days in a row with at least one practice session) - Phase 1 later sprint

**Settings shortcuts:**
- Input mode (shows current, tap to change - routes to Settings)
- Notifications (shows on/off, tap to change - routes to Settings)
- Font size linked to mastery (toggle, directly editable here)

**Account actions:**
- "Change password" link
- "Sign out" link (text-sm, feedback-wrong colour to signal destructive)

### 10.2 Guest Conversion

Guests see a full-width banner at the top of the profile content area (below the guest banner):
"Your progress lives only in this browser. Create a free account to save it forever."
Button: "Create account" (mint-500 key style).

---

## 11. Settings Screen Spec

**Status:** To Do
**Route:** `/settings`
**Scrollable:** Yes
**Layout:** Standard in-app layout

### 11.1 Content

Settings are grouped into sections with subtle section headers (text-sm, warm-400, uppercase letter-spacing).

**Practice:**
- Input mode: Type / Tap / Swipe (segmented control or three small key buttons)
- JLPT level: N5 / N4 / N3 / N2 / N1 (same segmented control style)
- Mnemonics: toggle on/off - "Show memory hints on wrong answers"

**Display:**
- Scene theme: Day / Sunrise / Sunset / Night (four option selector, shows a colour swatch per option)
- Font size linked to mastery: toggle on/off
- Font family: Noto Sans JP / Zen Maru Gothic (toggle or select)

**Audio:**
- Lo-fi background music: toggle on/off
- Key click sounds: toggle on/off

**Account:**
- Username (display only, with an "Edit" link)
- Email (display only)
- Change password link
- Delete account link (text-xs, feedback-wrong, requires confirmation modal)

**About:**
- Credits and attributions link (routes to `/credits`)
- Privacy Policy link
- Terms of Service link
- Version number (text-xs, warm-400)

---

## 12. Leaderboard Screen Spec

**Status:** To Do
**Route:** `/leaderboard`
**Scrollable:** Yes within tabs
**Layout:** Standard in-app layout

### 12.1 Tabs

Three tabs at the top of the content area (below the top bar):
1. Kana - global leaderboard by total kana mastery score
2. Kotoba - global leaderboard by total Kotoba mastery score (Phase 2, shown but empty in Phase 1)
3. Friends - not in Phase 1, shown as "Coming soon"

Tab style: bottom-border active indicator in sage-500. Inactive tabs: warm-400 text.

### 12.2 Leaderboard List

Each row:
- Rank number (text-lg, warm-800) - left
- Username (text-base, warm-800)
- Total mastery score (text-base, sage-600) - right
- Rows are separated by a 1px border-border line

Current user row: highlighted with a sage-50 background and a left accent bar in sage-500.
If the current user is not in the top visible range, their row is pinned at the bottom of
the list with a separator above it.

**Empty state:**
"No scores yet. Start practising to appear here."
With a "Start practising" button (mint-500 key style).

**Loading state:**
Skeleton rows (animate-pulse warm-200 bars) matching the row layout.

### 12.3 Leaderboard on Landing Page

The Pricing nav link on the landing page scrolls to Section C (see Section 3.4).
The Leaderboard nav link scrolls to Section C which shows a live or static top 10 preview.
The full leaderboard is only accessible after logging in.

---

## 13. Global Layout and Scaling Rules

These rules apply to every screen that uses the scene background (landing page,
game home, practice screen). Violating these rules is a bug, not a style choice.

### 13.1 Scene Viewport Rules

- The hero scene must always be exactly `100vh` tall at all viewport sizes. Never use a fixed pixel height.
- All scene layers (sky, hills, ground strip, clouds) must use percentage-based or viewport-relative (`vw`, `vh`, `%`) positioning and sizing. No fixed pixel values for layout or positioning of scene elements.
- The cyclist uses percentage-based `bottom` and `left` positioning relative to the scene container, not fixed pixels.
- Hero copy and CTA buttons use percentage-based vertical positioning within the sky area so they stay centred in the available sky space at any viewport height.
- Elements reposition gracefully as the viewport narrows. Nothing squishes, overlaps, or clips.
- Every new scene-based screen must be tested at 360px, 768px, and 1440px widths before the task is marked Done.

### 13.2 General Layout Rules

- Top bar: sticky, 56px height. Logo left, mode/action icons right.
- Bottom nav (in-app): 64px height, 4 tabs. Active tab uses sage-500.
- Content max-width: `max-w-md` for practice and Dojo, `max-w-2xl` for reading-heavy screens.
- Swipe mode: hide bottom nav and cyclist when native keyboard is open. Maximise space for the character prompt.
- Micro-interactions: soft fade-ins and scale transitions, 150ms to 300ms. No harsh flashes or aggressive spring animations.
- Touch targets: minimum 44x44pt on all interactive elements, no exceptions.

---

## 14. Asset Production Notes

This section documents every asset that needs to be created before implementation begins.
Claude builds all SVG and code-based assets. Gemini is used for image generation only
when photographic or painted assets are needed (none currently planned).

All assets are stored in `public/` in the appropriate subfolder.
File naming: lowercase, hyphens, descriptive. No spaces.

### 13.1 SVG Assets Needed

| Asset | File path | Description |
|---|---|---|
| Mascot cycling | `public/images/mascot-cycling.svg` | Bold flat-colour stick figure on bicycle. Chineasy style: thick black limbs, solid blush-pink round head, flat black bike. No outlines. CSS keyframe animation on legs and wheels. |
| Cloud shape (large) | `public/images/cloud-large.svg` | Soft fluffy white cloud, flat design |
| Cloud shape (small) | `public/images/cloud-small.svg` | Smaller variant of the cloud |
| Hill silhouette | `public/images/hill.svg` | Rounded green hill, flat, no outline |
| Tree kanji icon (木) | `public/images/icon-tree.svg` | Stylised 木 in charcoal stroke, decorative |
| Grove kanji icon (林) | `public/images/icon-grove.svg` | Stylised 林 in charcoal stroke, decorative |
| Forest kanji icon (森) | `public/images/icon-forest.svg` | Stylised 森 in charcoal stroke, decorative |
| Logo full | `public/images/logo-full.svg` | LangTap in key style, full word |
| Logo compressed | `public/images/logo-lt.svg` | LT stacked in key style |
| Keyboard icon | `public/images/icon-keyboard.svg` | Mode icon for Type mode |
| Tap icon | `public/images/icon-tap.svg` | Mode icon for Tap mode |
| Swipe icon | `public/images/icon-swipe.svg` | Mode icon for Swipe mode |
| House icon | `public/images/icon-home.svg` | Mobile nav home icon |
| Gear icon | `public/images/icon-settings.svg` | Settings gear |
| Profile icon | `public/images/icon-profile.svg` | Profile avatar placeholder |
| Padlock icon | `public/images/icon-lock.svg` | Locked character state |

### 13.2 Sound Assets Needed

| Asset | File path | Description |
|---|---|---|
| Key click | `public/sounds/key-click.wav` | Short mechanical keyboard click, <100KB |
| Soft click | `public/sounds/key-click-soft.wav` | Lighter version for nav/secondary interactions |
| Easter egg click | `public/sounds/easter-egg-click.wav` | Heavier satisfying clunk |

### 13.3 Sample Data Needed

| Asset | File path | Description |
|---|---|---|
| Sample game data | `samples/sample-game-state.ts` | Mock mastery scores and unlock states for UI testing |
| Sample leaderboard | `samples/sample-leaderboard.ts` | 10 mock leaderboard entries |
| Sample word bank (N5) | `samples/sample-words-n5.ts` | 20 N5 words for practice screen testing |

---

## 15. Screen Status Summary

| Screen | Spec status | Approved |
|---|---|---|
| Landing page | In Progress | No |
| Game home | To Do | No |
| Practice - Type mode | To Do | No |
| Practice - Tap mode | To Do | No |
| Practice - Swipe mode | To Do | No |
| Dojo - Kana | To Do | No |
| Dojo - Kotoba | To Do | No |
| Sign-up | To Do | No |
| Log-in | To Do | No |
| Onboarding steps 1-4 | To Do | No |
| Profile | To Do | No |
| Settings | To Do | No |
| Leaderboard | To Do | No |

---

*This document is the visual and interaction design source of truth for LangTap.*
*No screen may be built until its spec is marked Approved in the table above.*
*Update this document when a design decision changes. Do not update FRONTEND.md*
*directly from this document - wait for the Consolidation task in Sprint 2B.*
