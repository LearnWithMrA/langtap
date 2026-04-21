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

**Direction alternation:**
The game alternates between two directions with each new word:
- **Kana-to-romaji:** Word displays in kana (hiragana or katakana). User types romaji
  (Type/Swipe) or taps romaji buttons (Tap). Hint shows romaji on wrong.
- **Romaji-to-kana:** Word displays in romaji. User types hiragana on their Japanese
  keyboard. For katakana words, the input field displays the typed hiragana as katakana
  in real time (see Section 7.3 katakana display). For hiragana words, input displays
  as-is. Tap mode shows kana buttons matching the word's script. Hint shows the
  expected kana on wrong.

The direction flips automatically on each word advance.

**Hiragana and katakana words:**
The word bank contains both hiragana words (e.g. いぬ, あおい) and katakana words
(e.g. ネコ, テレビ, コーヒー). The game detects the script of each word by checking
the first character's Unicode range (katakana: U+30A0-U+30FF). This determines:
- Which tap grid to show (hiragana-only or katakana-only, 10 buttons each)
- Whether to apply the katakana display conversion on the input field
- Which characters to use for the answer hint on wrong attempts

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

**Answer hint (floating above current character):**
Hidden by default. After 3 wrong attempts on a character, the answer hint
appears floating above that specific character using absolute positioning.
The hint content depends on the direction:
- **Kana-to-romaji:** Shows the romaji (`-top-5 text-lg`)
- **Romaji-to-kana:** Shows the kana character (`-top-4 text-2xl`)

The hint persists until the user types the correct answer. Positioned with
`absolute left-1/2 -translate-x-1/2 font-medium text-warm-400 whitespace-nowrap`.

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
Wrong input is not auto-cleared. The player backspaces to correct their own
input. This is intentional: it avoids fighting with the Japanese IME and gives
the player direct control.

Each typed letter plays its matching keyboard sound from the audio sprite
(e.g. typing "a" plays the A key sample).

**Katakana display conversion (romaji-to-kana direction, katakana words):**
When the current word is katakana and the direction is romaji-to-kana, the user
types hiragana on their Japanese keyboard but the input field displays katakana.
This is achieved by overlaying a visual div on top of the real input:
- The real `<input>` has `text-transparent caret-warm-800` (invisible text, visible cursor)
- An absolutely positioned `<div>` overlays it, showing the value converted to katakana
- Conversion uses a fixed Unicode offset: hiragana (U+3040-U+309F) + 0x60 = katakana
- The evaluation logic also converts the hiragana input to katakana before comparing
  against the expected katakana answer
- The user sees katakana as they type, reinforcing the visual association between
  the hiragana they know and the katakana they are learning

**Japanese IME handling (zero-width space technique):**
When the user types hiragana using a Japanese keyboard, the IME normally tries
to compose multiple kana into kanji. To prevent this, TypeInput inserts a
zero-width space (`U+200B`) after each hiragana character. The IME sees each
kana as a separate "word" and does not offer kanji suggestions. This technique
is Type-mode-only — SwipeInput deliberately skips it, because mobile swipe
keyboards commit multi-character batches and the invisible spaces caused
doubled characters, broken backspace, and page crashes on iPhone.

Implementation details:
- On input change, if the last character is in the hiragana range (U+3040-U+309F),
  append `\u200B` after it
- On backspace, strip the trailing zero-width space and the kana together so one
  backspace deletes one visible character
- The game evaluation logic strips all `\u200B` characters before comparing input
  against the expected answer
- This is invisible to the user. They see normal hiragana in the field.

### 7.4 Tap Mode

A grid of buttons inside the game window below the word prompt. The button
content and the matching logic depend on the direction and word script:

| Direction | Word script | Buttons show | User taps | Match against |
|---|---|---|---|---|
| Kana-to-romaji | Hiragana | Romaji | Romaji for current char | `char.romaji` |
| Kana-to-romaji | Katakana | Romaji | Romaji for current char | `char.romaji` |
| Romaji-to-kana | Hiragana | Hiragana | Kana for current char | `char.kana` |
| Romaji-to-kana | Katakana | Katakana | Kana for current char | `char.kana` |

**Script-specific grids:**
Two separate tap character arrays are maintained: `HIRAGANA_TAP` (10 hiragana
characters) and `KATAKANA_TAP` (10 katakana characters). The grid shown is
selected by detecting the word's script via `isKatakanaWord()`. This ensures
the user only sees characters from the relevant script, not a mixed set.

**Button style:**
- Rounded rectangle, `rounded-xl`, sage-100 background
- Shadow: `shadow-[0_3px_0_0_var(--color-sage-300)]`
- Active press: `translate-y-[3px]`, shadow collapse
- Content: `text-lg font-medium text-warm-800`
- Correct tap: face flashes sage-400
- Wrong tap: face flashes feedback-wrong orange

All taps play alternating key sounds from the audio sprite.

Grid: `grid-cols-5` at all breakpoints. Each button minimum 44x44.
Only unlocked characters appear. Locked characters are excluded.

### 7.5 Swipe Mode

Same layout as Type and Tap modes (full landscape, top bar, mascot visible).
Uses SwipeInput (a separate component from Type's TypeInput) with a banner
below: "This mode is for the mobile swipe keyboard".

SwipeInput accepts raw input from the mobile swipe keyboard without the
zero-width-space IME trick used by TypeInput. The trick breaks on swipe
keyboards because they commit whole multi-character batches rather than one
keystroke at a time; on iPhone this caused doubled characters, broken
backspace, and page crashes. The katakana visual overlay (hiragana input,
katakana display for katakana words) is still applied, same as TypeInput.

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

Wrong answers use a **progressive 3-attempt system** with per-character state:

1. **First wrong:** Current character turns light orange (`#f5c490`).
   User backspaces to correct their input and retries.
2. **Second wrong:** Character turns medium orange (`#f5ac6a`).
   User backspaces and retries.
3. **Third wrong:** Character turns full orange (`text-feedback-wrong`).
   Answer hint appears floating above the character.
   Hint and orange persist until the user types the correct answer.

**No auto-clear.** Input is never automatically removed. The player backspaces
to fix their own mistakes. This avoids fighting with the Japanese IME and
gives the player direct control over the input field.

**Per-character wrong state.** Wrong attempt counts are stored per character
index in an array (`wrongAttemptsMap`), not as a single global counter.
This means:
- Backspacing to a previous character restores that character's original state
- If character 3 had 2 wrong attempts, backspacing to character 2 and returning
  to character 3 still shows 2 wrong attempts
- Each character's wrong count is independent and persists for the word

No sound effect for wrong answers. Calm and silent.

### 7.9 Correct Answer Feedback

**Per-character (within a word):**
Completed character turns green (`text-feedback-correct`). Next character
becomes the active target. Input continues accumulating (Type/Swipe) or
user taps the next romaji/kana (Tap).

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

**Status:** Built and iterating (Sprint 2B, Sessions 41-42). Source of truth
for behaviour is the shipped page; this spec is kept in sync so future work
has an accurate starting point.
**Route:** `/dojo/kana` (logged-in users and guests)
**Scrollable:** Yes (content exceeds one screen at all breakpoints)
**Layout:** In-app top bar (see Section 6.2) over a scrollable content column.
The top bar is transparent at the top of the page and frosts to
`bg-white/80 backdrop-blur-sm border-b border-border` after ~16px of scroll.

### 8.1 Overview

The Kana Dojo is the user's complete mastery picture for kana characters.
It is a progress screen, not a game screen: no practice input occurs here.
Its jobs, in order of priority:
1. Show at a glance how much of the kana chart the user has mastered.
2. Let the user jump into practice on a character they want to target.
3. Let the user unlock characters ahead of the guided sequence.

No distance counter, no mascot, no cycling animation on this screen.
Background matches the current scene theme token (default `theme-day`) but
without the parallax landscape: a flat scene colour only, so the grid reads cleanly.

### 8.2 Route and Navigation

Route: `/dojo/kana`. Reached via the "Kana Dojo" link in the top bar (Section 6.2)
or the Kana mastery CTA on the game home screen.

Kotoba has its own route (`/dojo/kotoba`, Section 9). The two dojos are separate
pages: there is no in-screen toggle between them.

Back navigation: browser back. No in-page back button; the top bar is the
primary navigation affordance on every in-app screen.

### 8.3 Chart Layout

All characters are organised into the progression stages defined in
GAME_DESIGN.md Section 4.3:
- Stage 1: Seion (hiragana then katakana)
- Stage 2: Dakuon
- Stage 3: Yoon

The chart flips orientation at a content-fit breakpoint (`min-[1028px]:`) -
the width at which the full gojuon grid plus outer padding first fits on
screen without squeezing. There is no intermediate layout between these two
forms; one or the other is active.

**Desktop (`min-[1028px]:` and above):** Gojuon-style grid with rows for each
consonant group (a, k-, s-, t-, n-, h-, m-, y-, r-, w-) and columns for each
vowel (a, i, u, e, o). Tiles fixed at 76x76px. Grid is centred in the content
column.

**Mobile (below 1028px):** The grid rotates 90 degrees. Columns become the
vowels (a, i, u, e, o) and rows become the consonant groups, so the page
scrolls vertically (never horizontally) as the user moves through a stage.
Tiles and text scale fluidly via `clamp()` + container queries (see
FRONTEND.md §8.1); tile size is `clamp(44px, calc(20vw - 20px), 76px)` so the
chart holds up at the 320px baseline without squish.

Row label gutter: 20px fixed on both orientations, so headings and tiles
share a consistent left edge.

Grid gap: `gap-2` on mobile, `gap-3` on desktop.

Row labels show the consonant in hyphenated form (`k-`, `s-`, `t-`) rather
than `ka`/`sa`/`ta` - these are visual row headers, not pronunciations. The
`a` row is blank (the bare vowel row), and the standalone `n` label stays
as `n`.

### 8.4 Script and Stage Sections

The shipped structure nests by script first, then by stage. The outer group
is the script (Hiragana, Katakana); inside each open script are three stage
sub-sections (Seion, Dakuon, Yoon). This matches the user's mental model of
"which script am I working in" being the higher-level choice.

**Script-level `GroupBar`:**
- Heading (`text-xl`, `text-warm-800`, Zen Maru Gothic): e.g. "Hiragana"
- Progress bar: average mastery across every character in the script
- Percentage readout to the right of the bar
- Tiered unlock button: dark blue when any characters remain locked; grey
  "unlocked" icon when every character is already unlocked, which opens the
  reset-progress flow (Section 8.9)
- Toggle chevron, `text-warm-600`, 44x44pt touch target
- Collapsed by default for scripts the user has not reached; open by
  default for the current active script

**Stage-level `GroupBar`:** same shape as the script bar but one visual
level down:
- Heading (`text-lg`, `text-warm-700`): "Seion", "Dakuon", "Yoon"
- Progress bar and percentage for the stage only
- Tiered unlock button: medium blue (Seion) / light blue (Dakuon, Yoon), or
  grey when the stage is fully unlocked
- Heading indents visually (sub-bullet hierarchy) but the progress bar still
  starts at the same x-coordinate as the script bar above it. This is
  achieved with `border-box` + `min-width` + internal `padding-left` on the
  heading button (see FRONTEND.md §8.1).

Collapse/expand animation: height transition, 200ms, `ease-out`.
Respects `prefers-reduced-motion: reduce`: instant toggle with no transition.

### 8.5 Character Tiles

Each character is a tile in the grid.

**Dimensions:**
- Desktop (`min-[1028px]:` and above): 76x76px fixed.
- Mobile (below 1028px): fluid
  `clamp(44px, calc(20vw - 20px), 76px)` square. Tile contents (kana glyph,
  romaji, mastery pill) scale proportionally via container queries and `cqw`
  units, so nothing squishes at 320px - see FRONTEND.md §8.1.
- Height decouples slightly from width at the smallest sizes to protect
  vertical content: `clamp(54px, calc(20vw - 10px), 86px)`. Minimum 44x44pt
  touch target preserved at every breakpoint.
- Rounded: `rounded-lg`
- Border: `border border-warm-200` at rest, `border-warm-400` on hover

**Content stacked inside the tile:**
- Kana character: centred, `text-xl` Zen Maru Gothic, colour depends on state
  (see locked state below)
- Romaji below: `text-xs`, `text-warm-400`
- Mini progress bar at bottom of tile, 2px tall, full width of tile,
  coloured with the heatmap value for that score

**Locked state:**
- Background: `bg-warm-100`
- Kana character: `text-warm-300`, slightly dimmed
- Padlock icon overlay: inline SVG, `text-warm-400`, centred over the character
  at 40% opacity so the character is still readable
- Mini progress bar hidden (no mastery to show)
- Cursor: `cursor-pointer` (it is tappable to unlock, see Section 8.9)

**Unlocked, unpractised state (score 0):**
- Background: `bg-sage-100`
- Kana character: `text-warm-800` full strength
- Mini progress bar: empty (0%)

**Hover (desktop only):**
- Slight lift: `translate-y-[-1px]`, subtle shadow `shadow-sm`
- No sound cue on hover

**Active (pressed):**
- `translate-y-[0.5px]`, shadow reduced

### 8.6 Heatmap Colour Scale

Tile background colour is driven by the existing heat contract defined in
`engine/mastery.ts` (`getMasteryHeatClass`) and documented in
`docs/FRONTEND.md` §2.1. Bands and tokens:

| Score | Token | Notes |
|---|---|---|
| 0 (unlocked) | `bg-heat-0` | Unlocked but unpractised |
| 1-4 | `bg-heat-1` | Early practice, building toward unlock threshold (5) |
| 5-9 | `bg-heat-2` | Unlock threshold crossed; building comfort |
| 10-19 | `bg-heat-3` | Comfortable |
| 20-39 | `bg-heat-4` | Strong |
| 40+ | `bg-heat-5` | Mastered (see below) |

The same classes drive the stage and sub-section progress bars, applied to
the average mastery score of the characters in that group via `ProgressBar`.

Locked tiles render on `bg-warm-100` with a padlock overlay; the mini
progress bar is suppressed because there is no mastery to visualise yet.

**Mastered visual (score >= `MASTERY_THRESHOLD`, 40+):** a 1px gold ring
using `--color-heat-gold` (`#D4AF37`) plus a soft diagonal shimmer animation
applied above the heat fill. The animation is gated behind
`prefers-reduced-motion: no-preference`; under reduced motion the ring stays,
the sweep does not. Ring contrast is measured against the page's cream
surface, not the heat fill.

This contract is intentionally shared with the progress bar. Do not introduce
a parallel palette for the Dojo; any future re-palette must update the engine
helper and the CSS tokens together so every heat surface stays in sync.

### 8.7 Tile Detail Popover

Tapping an unlocked tile opens a detail popover anchored to the tile
(desktop) or a bottom sheet (mobile, below `md`).

**Contents:**
- Character: large, `text-4xl` Zen Maru Gothic, centred
- Romaji: `text-lg`, `text-warm-600`
- Mastery score: "Mastery: [n]" (`text-sm`, `text-warm-500`)
- Mnemonic: shown only if mnemonics are enabled in Settings. `text-sm`,
  `text-warm-700`, max-width 28ch for readability.
- Two buttons (key-button style, stacked on mobile, side-by-side desktop):
  - "Practise this" - navigates to `/practice?mode=kana&focus=[character]`
    (focus param biases selection toward that character; selection algorithm
    details in GAME_DESIGN.md Section 5)
  - "Close" - dismisses the popover

**Dismiss behaviour:**
- Tap outside the popover / bottom sheet
- ESC key (desktop)
- Swipe down on the sheet (mobile)
- Close button

Animation: fade + scale 150ms on desktop popover, slide-up 200ms on mobile
sheet. Reduced-motion: instant.

Only one detail popover can be open at a time. Opening a second tile closes
the first.

### 8.8 Active Stage Indicator

The "active stage" is the earliest stage (within the active script) that
still has locked characters. It is visually emphasised so the user knows
where the guided sequence is currently positioned.

- Active stage is expanded by default on page load. The script above it is
  also expanded by default.
- No "Current" badge on the bar. (An earlier spec included a mint `Current`
  pill; removed in Session 41 because the default-open behaviour already
  communicates the active stage and the badge added visual noise.)
- Completed stages (no locked characters): chevron state persists from last
  session (default collapsed); the tiered unlock button on the bar switches
  to the grey unlocked-icon reset affordance (see Section 8.9).
- Future stages (all characters still locked from guided progression, no
  early-unlocks): collapsed by default, muted heading `text-warm-400`.

### 8.9 Unlock and Reset Interactions

**Individual unlock (tap a locked tile):**
Opens `UnlockPrompt`, a single-step modal:
- Title: "Unlock [character]?"
- Body: "You can practise this character straight away. This cannot be undone
  without resetting all progress."
- Buttons: "Unlock" (`bg-mint-500`, `text-white`) and "Cancel"
  (`bg-warm-100`, `text-warm-800`).
- Single confirmation tap is sufficient per GAME_DESIGN.md Section 4.5.

**Tap an unlocked tile:** opens the two-step reset-this-character flow
(GAME_DESIGN.md 4.6). The detail popover described in §8.7 is deferred to a
follow-up pass; the current direct-reset behaviour is intentional for now.

**Group unlock (tiered unlock buttons in each `GroupBar`):**
Every `GroupBar` carries a single tiered action button that changes state
based on whether any characters in that scope are still locked.

- Any locked remaining: the button is a blue lock icon, colour-ranked by
  level. Script bar uses dark blue, Seion uses medium blue, Dakuon and Yoon
  use light blue. Tapping it opens `BulkUnlockPrompt`, a two-step modal:
  - Step 1: "Unlock all [n] characters in [Label]?" with Yes/No.
  - Step 2: "Are you sure? This can't be undone." with Yes/No.
  - Confirm completes the bulk unlock (GAME_DESIGN.md 4.6).
- Nothing locked in that scope: the button flips to a grey unlocked icon.
  Tapping it opens `BulkResetPrompt`, a two-step modal that clears mastery
  scores back to 0 while keeping every character in the manually-unlocked
  set (so they stay visible as unlocked-at-0 tiles):
  - Step 1: "Reset progress on all characters in [Label]?" with Yes/No.
  - Step 2: "Are you sure? This can't be undone." with Yes/No.

All colours on the unlock/reset button carry `/85` translucency so the
action reads as a secondary affordance, not a primary call to action.

The earlier draft in this section specified a three-option group-unlock
modal ("stage", "sub-section", "select characters"). That was replaced by
the tiered per-bar buttons because (a) the selection is implicit in which
bar you tap, and (b) swapping the same button between unlock and reset
flows kept the bar density low. The deferred multi-select view is still
flagged for a follow-up pass.

Progress bars with no characters in scope are not rendered (impossible
state in practice). Bars where the action is inapplicable fall back to the
grey reset affordance described above, never disappear.

### 8.10 Sound Cues

This screen is a progress view, not a keyboard surface. Sound cues are minimal:
- Tile tap (unlocked): soft UI click, `ui-tap.ogg` (see Section 14.2).
  Consistent with other non-practice taps in the app.
- Locked tile tap (opens unlock modal): same `ui-tap.ogg`, plus the modal's
  own open sound.
- Unlock confirmation: `ui-unlock.ogg` (see Section 14.2) plays once on
  successful unlock.
- Stage collapse/expand: no sound.
- Popover / modal open and close: default modal sounds (Section 14.2).

Key-press sounds (the sprite from `data/audio/key-sound-map.ts`) are not used
on the Dojo. Those are reserved for practice input surfaces.

### 8.11 Loading, Error, and Empty States

**Loading:**
On first paint, the stage scaffolding renders immediately with skeleton tiles
(`bg-warm-100` pulse animation). Mastery scores and unlock state are fetched
from the mastery store (Zustand, hydrated from Supabase or localStorage).
Skeleton resolves to real tiles within one frame on guests (localStorage is
synchronous) and within ~200ms on logged-in users (Supabase fetch).

No top-level spinner. The stage sections themselves are the skeleton.

**Error (mastery fetch fails for logged-in users):**
Inline banner at the top of the content column: `bg-blush-100`, `text-warm-800`.
Text: "We could not load your progress. Check your connection and try again."
Button: "Retry" (`bg-sage-500`, `text-white`).
Grid below the banner falls back to the last-known state from localStorage if
present, otherwise renders all characters as locked and suppresses all unlock
actions (read-only fallback).

**Empty (0 characters unlocked, post-skip onboarding):**
All tiles render in locked state. A small help card sits above the Seion
section:
- Icon: mascot SVG, 48px
- Headline: "Start your journey" (`text-lg`, `text-warm-800`)
- Body: "Tap any character to unlock it, or jump into practice and unlock
  as you go." (`text-sm`, `text-warm-600`)
- Button: "Start practice" (`bg-sage-500`, `text-white`) - navigates to
  `/practice?mode=kana`

The help card is dismissible; once dismissed it does not return. Dismissal
state is per-user and persisted to the profile (logged-in) or localStorage
(guest).

### 8.12 Accessibility

- Every tile: `button` element, `aria-label` of the form "Character [kana], romaji [romaji], mastery [n], [locked|unlocked]"
- Locked tile `aria-label` additionally includes "tap to unlock"
- Stage headings: `<h2>`, sub-section headings: `<h3>`
- Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="10"` (10 reads as the mastery ceiling for screen readers; beyond 10 the value caps at 10 for a11y semantics but the visual gold shimmer signals "mastered")
- Progress bars with locked characters: `aria-label` includes "tap to unlock characters in [group]"
- Popover: focus trap, `aria-modal="true"`, focus returns to the originating tile on close
- Keyboard navigation: tab cycles tiles left-to-right, top-to-bottom within a section, then to the next section's heading
- All touch targets minimum 44x44pt (mobile tile size + padding)
- `prefers-reduced-motion`: disables tile hover lift, collapse/expand transitions, popover fade/slide

---

## 9. Dojo Screen Spec - Kotoba

**Status:** Built and iterating (Sprint 2B). Parallel sibling to the Kana Dojo
(§8). The shipped page is the source of truth for behaviour; this spec is kept
in sync.
**Route:** `/dojo/kotoba` (logged-in users and guests)
**Scrollable:** Yes (content exceeds one screen at all breakpoints)
**Layout:** In-app top bar (Section 6.2) over a scrollable content column on a
flat green page background. The top bar is transparent at the top of the page
and frosts to `bg-white/80 backdrop-blur-sm border-b border-border` after ~16px
of scroll, exactly as on `/dojo/kana`.

### 9.1 Overview

The Kotoba Dojo is the user's complete mastery picture for Kotoba (vocabulary).
It mirrors the Kana Dojo's role: a progress screen, not a game screen, with no
practice input on the page itself. Its jobs, in priority order:
1. Show at a glance how much of each JLPT level the user has covered.
2. Let the user drill into any level group to see their per-word mastery.
3. Let the user jump into focused practice on a specific word.

No distance counter, no mascot, no cycling animation. Background is a flat
pale-green wash (`--color-kotoba-dojo-bg`, new token) so the grid and tiles
read cleanly. The Kana Dojo's blue wash (`--color-dojo-bg`) remains its own.

### 9.2 Route and Navigation

Route: `/dojo/kotoba`. Reached via the "Kotoba Dojo" link in the in-app top bar
(Section 6.2) from any practice screen, regardless of the mode the user entered
through, or via the Kotoba mastery CTA on the game home screen.

The two dojos are separate pages: there is no in-screen toggle between them.
Mode selection lives on the game home screen (Section 6.3); the dojos are
destination screens, not mode-scoped dashboards.

Back navigation: browser back. No in-page back button; the top bar is the
primary navigation affordance on every in-app screen.

Bare `/dojo` is intentionally unhandled: Next.js renders the default
`app/not-found.tsx` for that URL. Nothing in the UI links to it.

### 9.3 JLPT Level Tabs

A horizontal row of five key-style buttons sits under the page heading:
`N5`, `N4`, `N3`, `N2`, `N1`. The row behaves as a single-select tab group.

**Visuals:**
- Active tab: `bg-mint-500` fill, `text-white`, one-step-darker bottom border
  for the 3D key effect, consistent with the key-button style in §2.3.
- Inactive tab: `bg-sage-100` fill, `text-warm-700`. Hover raises slightly.
- Disabled tabs (no data): never used in v1; every N level renders the tab
  and shows placeholder content on select.
- Row scrolls horizontally on mobile under 480px (`overflow-x-auto`,
  scroll-snap per tab so a tap always lands on a whole key).

**Behaviour:**
- Selecting a tab swaps the unit grid beneath with a 150ms fade. Reduced
  motion: instant.
- URL sync (`?level=n5` deep-links) is a Sprint 4 follow-up once persistence
  lands. v1 keeps the active level in local state with `n5` as the default.

**Sizing:**
- Tabs use `flex-1 min-w-0` so all five share the content column evenly.
  Internal padding steps up with viewport (`px-2` under 380px,
  `px-3` up to `sm:`, `px-4` above). No horizontal scroll — five tabs
  always fit even at the 320px mobile floor.

**Page-level unlock:** the `Kotoba Dojo` heading is paired with a
large `green-dark` `UnlockButton` (Section 2.3 key style, green tier)
whenever at least one word at the active JLPT level is locked.
Tapping it opens a single-confirmation prompt asking to unlock every
remaining locked word at that level. When nothing is locked at the
active level, the button is not rendered (a grey reset swap is a
Sprint 4 follow-up once persistence lands).

**Keyboard:**
- Roving tabindex across the five buttons (only the active one is focusable).
- `ArrowLeft` / `ArrowRight`: move selection one tab, wraps at the ends.
- `Home` / `End`: jump to first / last tab.
- `Enter` / `Space`: redundant with the selection change but supported.

### 9.4 Unit Card Layout

Under the tabs, the selected JLPT level renders a grid of unit cards.
Each card represents a chunk of level groups within that JLPT level.

**Dimensions:**
- Desktop (`md:` and above): minimum card width 240px, auto-fill grid via
  `grid-cols-[repeat(auto-fill,minmax(240px,1fr))]`, `gap-4`. Cards expand to
  fill each row.
- Mobile: single column, full-width cards, `gap-3`.
- Card inner padding: `p-4`. Border radius: `rounded-xl`.

**Contents (stacked):**
- Unit title (`text-lg`, `text-warm-800`, Zen Maru Gothic): e.g. "Unit 1".
- Level range (`text-sm`, `text-warm-600`): e.g. "Levels 1-2".
- Unit-average progress bar: same `ProgressBar` primitive the Kana Dojo uses,
  driven by the same heatmap scale from §8.6 applied to the unit's mean word
  mastery.
- Percentage readout right of the bar (`text-xs`, `text-warm-600`).

**Variants:**
- Default (active or in-progress, matches the Kana `active` / `in-progress`
  semantics): `bg-sage-50`, `border border-sage-200`. Hover lifts
  `translate-y-[-1px]` with `shadow-sm`.
- Completed (every word in the unit at or above `MASTERY_THRESHOLD`):
  `bg-mint-100`, `border border-mint-300`, a small mint check glyph in the
  top-right corner. Same hover.
- Locked (JLPT level's earlier units not yet cleared, or content not yet
  released): `bg-warm-100`, `border border-warm-200`, all text `text-warm-400`,
  progress bar suppressed. Copy under the level range line: `Locked` next to
  an inline padlock SVG. See Section 9.5 for expansion behaviour. See
  Section 9.11 for the full non-interactive contract.

Cards themselves are both summary and trigger: clicking the main body
expands that unit's level-group accordion beneath the grid (Section 9.5).
Locked cards never expand.

**Unit-level unlock:** when the unit has at least one locked word, a
`medium` `green-medium` `UnlockButton` sits in the card's bottom-right
corner. Tapping it opens the bulk-unlock prompt for every locked word
in that unit. The unlock button sits outside the toggle `<button>`
(not nested) so the two controls never conflict: the rest of the card
toggles the accordion, the small corner button opens the prompt. The
locked variant never shows this button - the whole unit is gated.

### 9.5 Level Group Accordion

Below the unit grid, the selected unit's level groups render as a vertical
accordion.

**Structure:**
- Only one unit is expanded at a time. Opening Unit 2 collapses Unit 1.
  This keeps the top-level view tidy and limits the scroll length. The
  accordion is single-open by contract, not by emergent behaviour.
- Within a unit, level-group rows are multi-open: opening "Levels 3-4"
  while "Levels 1-2" is open leaves both open. This lets the user compare
  adjacent groups without re-expanding.

**Row visual (closed):**
- Row height: 52px.
- Left cluster: chevron (`text-warm-600`, 44x44pt touch target, rotates 90deg
  when open), level-group title (`text-base`, `text-warm-800`).
- Right cluster: mini progress bar for the group, percentage readout,
  `text-xs`, `text-warm-600`.

**Row visual (open):**
- Animates height 200ms `ease-out`. Reduced motion: instant.
- Reveals a word-tile grid (Section 9.6) below the row.

**Empty state (unlocked group with no content in v1):**
- Expanded body renders a single centred line: `Coming soon`
  (`text-sm`, `text-warm-500`), 48px vertical padding.
- Progress bar on the closed row reads 0% with muted text.

**Group-level unlock:** when the group has at least one locked word,
a `small` `green-light` `UnlockButton` sits on the row to the right
of the percentage. Tapping it opens the bulk-unlock prompt for every
locked word in that group. Renders only when the group has words
(empty "Coming soon" groups never show an unlock button).

**Tile grid (expanded body):**
- Mobile (`max-[md]:`): `grid-cols-2`, `gap-3`. Two tiles per row at
  every breakpoint below `md`, which fixes the dead-space issue the
  previous single-column layout produced on 320-420px phones.
- Desktop (`md:` and above): `grid-cols-[repeat(auto-fill,minmax(144px,1fr))]`,
  `gap-4`. Tiles self-fill the available width.
- Tiles themselves cap at 180px wide via `max-w-[180px]` so the grid
  can flow a bit narrower without the cells stretching out of
  proportion. `justify-items-center` keeps tiles centred in their
  cell at the upper end of the clamp.

### 9.6 Word Tile

Every tile is a direct visual clone of the Kana `CharacterTile` (§8.5)
scaled up to hold three rows of text instead of two. Cream fill, a
3D keyboard-key border coloured by the heat palette, a mini progress
pill at the bottom edge, and a padlock badge when locked. This is a
shared-contract reuse, not a parallel implementation: the same
`progressBarBorderClass` + `progressBarFillClass` helpers drive both
dojos.

**Dimensions:**
- `containerType: inline-size` on the button so inner text and the
  progress pill scale proportionally with the tile width.
- Width: `100%` of its grid cell, capped at `max-w-[180px]`.
- Height: `clamp(96px, calc(30vw + 12px), 128px)` so the tile keeps a
  touch-friendly size at 320px and grows to a comfortable rectangle
  above `sm:`.
- Rounded `rounded-[12px]`, `rounded-[16px]` at `min-[1028px]:`.
- Border: asymmetric `border-[3px] border-b-[6px]` for the 3D key look.
  Colour ramps through the heatmap palette via `progressBarBorderClass`
  and switches to the gold accent at or above `MASTERY_THRESHOLD`.

**Content stacked inside the tile (top to bottom):**
- Row 1 - Glyph slot: kanji if the word has a kanji form, otherwise
  the kana reading is promoted into this slot. `clamp(20px, 17cqw, 30px)`
  font size (`cqw` scales with the tile's own width). Colour:
  `text-[#3e312e]`, switches to gold when mastered and grey when locked.
- Row 2 - Reading slot: the kana reading when a kanji is present in
  Row 1, otherwise a blank-but-reserved non-breaking space so the
  tile keeps a consistent height. `clamp(10px, 8cqw, 14px)` font
  size, `text-warm-600` palette.
- Row 3 - English gloss: `clamp(9px, 6.5cqw, 12px)` font size,
  `text-warm-500`. Single line, truncated with `truncate`, full gloss
  attached via the native `title` attribute for hover-to-view on
  pointer devices.

**Mini progress pill:**
Same contract as `CharacterTile`. Absolutely positioned near the
bottom edge, fluid width (`clamp(36px, 55cqw, 80px)`), 3-4px tall.
`bg-[#e5e7eb]` track with a heat-coloured fill (`progressBarFillClass`).
Hidden entirely when the tile is locked.

**Mastered state (score >= `MASTERY_THRESHOLD`):**
- Tile fill swaps to `bg-[color:var(--color-heat-gold-fill)]`.
- Glyph, reading, and gloss text all swap to the gold accent.
- Border colour stays gold via `progressBarBorderClass`.

**Locked state:**
- Tile opacity drops to 70.
- Padlock badge in the top-right corner, fluid size via `cqw`.
- Progress pill is suppressed (no mastery to visualise).
- Glyph / reading / gloss render in `text-[#bdbdbd]`.
- Tapping a locked tile opens the single-step `KotobaUnlockPrompt`
  (copy: "Unlock {kanji (kana) | kana}?"). Does not open the detail
  popover. Mirrors the Kana `CharacterTile` + `UnlockPrompt` flow.

**Hover (pointer devices):** No lift; the 3D press effect provides
the tactile cue instead. `active:translate-y-[3px] active:border-b-[3px]`.

**Aria label:**
- Unlocked: "Word {kanji}, reading {kana}, meaning {english}, mastery {n}"
- Kana-only unlocked: "Word {kana}, meaning {english}, mastery {n}"
- Mastered: above string + "mastered"
- Locked: above string + "locked. Tap to unlock."

### 9.7 Heatmap Colour Scale

Identical to §8.6. The Kotoba Dojo does not introduce a parallel palette:
tile backgrounds, unit-card progress bars, and level-group mini bars all
pull from `engine/mastery.ts` (`getMasteryHeatClass`) using the same six
bands. Any future re-palette must update the engine helper and the CSS
tokens once, and every heat surface across both dojos must stay in sync.

### 9.8 Word Tile Popover

Tapping an unlocked word tile opens a detail popover anchored to the tile
(desktop) or a bottom sheet (mobile, below `md`). The popover reuses the
shared `Modal` primitive that powers the Kana tile flow in §8.7, not a forked
component.

**Contents:**
- Kanji (if present): `text-4xl` Zen Maru Gothic, centred.
- Kana: `text-xl`, `text-warm-600`, centred.
- English gloss: full text, `text-base`, `text-warm-700`, max-width 32ch
  for readability.
- "Mastery: [n]" readout (`text-sm`, `text-warm-500`).
- Two buttons (key-button style, stacked on mobile, side-by-side desktop):
  - "Practise this word" navigates to
    `/practice?mode=kotoba&focus=[wordId]` (biases selection, Sprint 5).
  - "Reset progress" opens the two-step reset confirmation flow, identical
    shape to §8.9 but scoped to the word.

**Dismiss behaviour, animation, focus trap, and mutual exclusion:** match
§8.7 verbatim. Reduced-motion: instant.

### 9.9 Active Level Indicator

The "active level" (equivalent to the Kana active stage in §8.8) is the
earliest JLPT level whose active unit still contains words below
`UNLOCK_THRESHOLD`. It is signalled, not badged.

- Active level tab: the default selection on first render. URL
  `?level=[id]` overrides.
- Active unit within that level: renders in the default sage card variant,
  expanded by default in the accordion.
- Completed levels: tab stays normal, the level-strip shows mint
  completed-unit cards inline.
- Future levels (all units locked, no user data): tab label muted
  `text-warm-400`. Selecting the tab still works and reveals the locked
  cards.

### 9.10 Sound Cues

This is a progress view, not a keyboard surface. Sound cues are minimal and
reuse the existing sprite exactly:
- Tab select: no sound (consistent with Kana stage collapse/expand).
- Unit card tap (unlocked): soft UI click, `ui-tap.ogg` (§14.2).
- Locked card tap: no sound (tap is absorbed silently; see §9.11).
- Word tile tap: `ui-tap.ogg`.
- Popover / modal open and close: default modal sounds (§14.2).

Key-press sounds from `data/audio/key-sound-map.ts` are never used on the
Dojo, same rule as §8.10.

### 9.11 Loading, Error, Empty, and Locked States

The client component accepts an explicit `state` prop with values
`'ready' | 'loading' | 'error' | 'empty'`. `'ready'` is the default and is
what the route passes in v1. The other values are deterministic triggers
for tests and future wiring; they never depend on timing. The Kana client
is retrofitted with the same prop for parity (no user-visible change).

**Loading (`state='loading'`):**
On first paint the tabs and unit grid scaffolding render immediately with
skeleton cards (`bg-warm-100` pulse animation). Real mastery arrives from
the store in Sprint 4; skeletons resolve within one frame on guests,
~200ms on logged-in users. No top-level spinner.

**Error (`state='error'`, mastery fetch fails for logged-in users):**
Inline banner at the top of the content column, `bg-blush-100`,
`text-warm-800`. Text: "We could not load your Kotoba progress. Check your
connection and try again." Retry button `bg-sage-500`, `text-white`. The
grid below falls back to the last-known state from localStorage if
present, otherwise renders every unit as locked and suppresses popovers.

**Empty (`state='empty'`, new user post-onboarding):**
Tabs render normally. Under the tabs, a centred help card:
- Icon: mascot SVG, 48px.
- Headline: "Start building your vocabulary" (`text-lg`, `text-warm-800`).
- Body: "Pick a unit to see the words inside, or jump straight into
  Kotoba practice." (`text-sm`, `text-warm-600`).
- Button: "Start practice" (`bg-sage-500`, `text-white`), navigates to
  `/practice?mode=kotoba`.

Help card is dismissible once per user; dismissal persists to profile
(logged-in) or localStorage (guest).

**Locked (per-card, independent of `state`):**
- Card container: `<div role="group" aria-disabled="true">`, no
  `tabindex`, no focus ring, `cursor-default`, no hover transform, no
  active transform.
- The unit title is read to screen readers as
  "Unit [n], levels [range], locked".
- Tap events on the container are suppressed at the card level; there is
  no trigger for an accordion row or popover.
- Visually distinct per §9.4 (warm-100 background, muted text, padlock).
- Locked cards do not block keyboard traversal of the tab row above.
- Locked cards never render the unit unlock button. Unlocking happens
  at the JLPT level scope (page-level button, §9.3) instead.

**Locked (per-word tile, independent of `state`):**
- Tile stays in the grid (visible, not hidden) with opacity 70, a
  padlock badge top-right, and dimmed text.
- Progress pill is suppressed.
- Tapping opens the single-step `KotobaUnlockPrompt` asking to
  unlock that word. Confirming adds the id to
  `manuallyUnlockedWords`; the tile then reveals its heat fill and
  progress pill.
- A word is considered unlocked when either `score >= UNLOCK_THRESHOLD`
  or the id is present in `manuallyUnlockedWords`. Mirrors the Kana
  model exactly.

### 9.12 Accessibility

- Tab row: `role="tablist"` with each button `role="tab"`,
  `aria-selected`, `aria-controls` targeting the unit-grid container.
  Unit-grid container is `role="tabpanel"` with matching `aria-labelledby`.
  Roving tabindex per §9.3.
- Unit cards (unlocked): `<button>` elements, `aria-expanded` reflects the
  accordion state, `aria-controls` points at the level-group container.
  `aria-label` reads "Unit [n], levels [range], [average mastery], [open
  or closed]".
- Unit cards (locked): non-focusable `<div role="group"
  aria-disabled="true">` per §9.11. Never a `<button disabled>` because
  that still receives focus on some browsers; the role change is
  deliberate.
- Level-group rows: `<button aria-expanded aria-controls>`. Chevron is
  decorative (`aria-hidden="true"`). On collapse, focus returns to the
  row trigger.
- Word tiles: `<button>` with `aria-label` "[kanji if present], [kana],
  [english], mastery [n]". No locked variant at tile level.
- Popover: focus trap, `aria-modal="true"`, focus returns to the
  originating tile on close. Reuses Kana popover behaviour.
- Keyboard navigation inside an expanded level-group tile grid: tab
  cycles left-to-right, top-to-bottom, then to the next open level-group
  row or unit card. Arrow-key traversal within the tile grid is
  deferred; tab order is sufficient for v1.
- Screen-reader announcements: tab change announces
  "[JLPT level] selected". Accordion expand announces "expanded,
  [n] level groups" and collapse announces "collapsed".
- Touch targets: minimum 44x44pt on every interactive element. Every
  clickable surface on mobile meets this via padding, even when the
  visible box is smaller.
- `prefers-reduced-motion`: disables tile hover lift, accordion height
  transition, popover fade/slide, and the gold-mastery sweep.

### 9.13 Sample Content (v1)

Content population in v1 is deliberately thin; Sprint 5 generates the real
bank from JMdict. The visual shell uses a hand-authored fixture with:
- `N5 Unit 1 Levels 1-2`: twelve real N5 words covering every heatmap
  band end-to-end, including two hiragana-only entries (`さようなら`,
  `おはよう`), two katakana-only entries (`テレビ`, `コーヒー`), one
  long English gloss on `さようなら` for truncation coverage, and two
  words (`学校`, `コーヒー`) left locked so the padlock tile variant
  renders. The kanji-bearing eight are `日本`, `学生`, `先生`, `水`,
  `本`, `人`, `車`, `学校`.
- `N5 Unit 1 Levels 3-4`: empty, renders "Coming soon".
- `N5 Unit 2`: unlocked but empty so the single-open unit accordion
  can be exercised end-to-end. Renders a single "Coming soon"
  level-group row.
- `N5 Unit 3` and all `N4`-`N1` units: locked placeholders, three
  units per level so the grid renders naturally.

The fixture lives at `samples/kotoba-dojo-fixtures.ts` with the same
shape contract as `samples/mastery-fixtures.ts` and is typed against the
forward-looking `types/kotoba.types.ts`. The `KotobaMasteryState`
includes both `manuallyUnlockedUnits` and `manuallyUnlockedWords` so the
word-level locking model maps cleanly onto future real data. Swapping
the fixture source for real data in Sprint 5 requires no component
changes.

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
- Every new scene-based screen must be tested at 320px, 375px, 768px, and 1440px widths before the task is marked Done. 320px is the hard mobile floor (iPhone 5/SE, folded foldables mid-unfold); anything that breaks there blocks the task. See FRONTEND.md §8 and §8.1 for the fluid-scaling stack (clamp + container queries) used to honour this baseline.

### 13.2 General Layout Rules

- Top bar: fixed, 56px height. Logo left, nav centre (desktop) or hamburger
  (mobile), settings and profile icons right. Transparent at the top of the
  page, frosts to `bg-white/80 backdrop-blur-sm border-b border-border` after
  a small scroll threshold (16px in-app, 80px on the landing page) with a
  200ms transition. See FRONTEND.md §5.2.
- Bottom nav (in-app): 64px height, 4 tabs. Active tab uses sage-500.
- Content max-width: `max-w-md` for practice and Dojo, `max-w-2xl` for reading-heavy screens.
- Swipe mode: hide bottom nav and cyclist when native keyboard is open. Maximise space for the character prompt.
- Micro-interactions: soft fade-ins and scale transitions, 150ms to 300ms. No harsh flashes or aggressive spring animations.
- Touch targets: minimum 44x44pt on all interactive elements, no exceptions.
- Mobile baseline: every page must render cleanly at 320px with no horizontal
  scroll. This is a binding rule, not an aspiration.

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
| Dojo - Kana | Done | No |
| Dojo - Kotoba | Built and iterating | No |
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
