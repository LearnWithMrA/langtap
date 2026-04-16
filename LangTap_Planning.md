# LangTap - Planning Document

Version 1.2 | April 2026
Status: Active

---

## 1. Vision

LangTap is a web-based typing fluency app for Japanese learners.

The goal is not to teach the language. The goal is to build comfort, familiarity, and speed
with typing Japanese on a physical keyboard or a mobile swipe keyboard. Learning happens
as a side effect of repetition and pattern recognition, not from explicit instruction.

The experience should feel calm, focused, and rewarding. A soft pastel aesthetic, a looping
cycling animation, and optional lo-fi audio create an environment that encourages long
sessions without stress or overwhelm.

The tagline: **"A journey of a thousand miles begins with a single step... or a single push."**

Progress during a session is measured in metres (or feet, based on locale). The distance
accumulates as the user types correctly. The cycling animation speed and the distance
counter are directly tied to typing speed and accuracy. This makes progress feel physical
and rewarding without being competitive in a stressful way.

---

## 2. Core Philosophy

- Typing fluency first. Vocabulary and character knowledge are a by-product, not the aim.
- Mastery through repetition, not memorisation drills.
- Characters and words with lower mastery scores appear more frequently. Higher mastery
  means less frequent appearance. This creates an endless, self-balancing practice loop.
- Nothing is hidden from the player. Progress is always visible in the Dojo.
- Mistakes are silent teachers. Wrong answers show a mnemonic and the correct key,
  then move on without penalty or shame.
- Quality over speed. Every feature should be complete, stable, and intentional before
  the next one begins.

---

## 3. Target User

- Japanese learners who want to build typing speed and muscle memory with kana.
- People who want to type faster in Japanese, not just recognise characters.
- Learners who study with Anki, Pimsleur, or other tools and want a complementary
  typing practice environment.
- Mobile users who want to improve their swipe keyboard fluency.
- Desktop users building muscle memory on a physical Japanese keyboard layout.

LangTap is a practice tool, not a teaching tool. It works best for learners who
have at least a basic awareness of the kana system. Complete beginners are welcome,
but they will get more out of LangTap if they spend a little time with a structured
introduction first.

**Recommended starting points for complete beginners:**
- Tofugu's Hiragana and Katakana guides (https://www.tofugu.com/japanese/learn-hiragana/)
  are widely considered the best free introduction to kana. They use mnemonics and
  take most people just a few hours to complete.
- JapanesePod101 (https://www.japanesepod101.com) offers structured beginner audio
  lessons that pair well with typing practice.

Once a learner can recognise most kana, LangTap is the natural next step to build
the speed and automaticity that makes reading and typing feel effortless.

---

## 4. Scope and Phases

LangTap is built in phases. Each phase must be stable and complete before the
next begins. No phase 2 features are built during phase 1.

### Phase 1 - Kana (MVP)

The only scope for initial development.

- User accounts (email and password, with Google and Apple sign-in as later additions)
- Guest mode with local progress, with a persistent reminder that progress will be lost
  on tab close
- Onboarding self-assessment: user selects their Kotoba JLPT level and Kanji JLPT level
  (N5-N1) on first login. The Kanji JLPT level determines the preferred starting level
  for word selection in Kana Mode. Both levels can be changed later in Profile settings.
- Early character unlock on sign-up: user can select characters they already know to
  unlock them immediately before the guided progression begins
- Kana typing practice (hiragana and katakana together)
- Guided unlocking: Seion first, then Dakuon, then Yoon
- Mastery scoring per character
- Word counter system (max 5 per word before reset)
- Three input modes: Tap (on-screen buttons), Type (physical keyboard), Swipe (mobile)
- Global leaderboards per input mode and overall
- Dojo screen with collapsible character progress bars
- Cycling character animation
- Optional lo-fi audio (can be toggled off in settings)
- Pastel zen visual theme (greens and soft pastels)
- Mobile-aware layout (empty space reserved for native keyboard)
- Payments infrastructure in place but not activated (free during phase 1)

### Phase 2 - Kana with Kotoba

- Library screen (word bank organised by JLPT N5-N1)
- Kotoba Mode: English word shown, user types the correct kana
- Word mastery tracking (separate from character mastery)
- Kotoba leaderboards
- Requires full Kana mastery to unlock

---

## 5. Feature Details

### 5.1 Authentication and Onboarding

**Landing page blurb:**

Before the sign-up CTA, the landing page includes a short, warm note for complete
beginners. This is not a gate or a warning. It is friendly guidance that positions
LangTap as the natural next step after learning the basics:

> "New to kana? We recommend spending an hour with Tofugu's free hiragana guide
> before you start. Once you can recognise the characters, LangTap will help you
> type them without thinking."

Links: https://www.tofugu.com/japanese/learn-hiragana/ and optionally
https://www.japanesepod101.com for audio-first learners.

This copy should be small and unobtrusive, below the hero animation and above the
sign-up button. It must never feel like a barrier. The sign-up and guest entry
buttons are always the most prominent elements on the page.

- Sign up and log in via email and password
- Username required (not a real name - this is stated clearly during sign-up with a
  friendly explanation of why anonymity is encouraged for leaderboards)
- Password strength reminder shown during sign-up (encourage a randomised password)
- Guest mode allowed: local progress only, banner reminder shown persistently on every
  screen until the user creates an account or dismisses it for the session
- Google Sign-In and Apple Sign-In are planned for a later sprint, not Phase 1

**Onboarding flow (first login only):**

Step 1 - JLPT self-assessment. The user is shown the five vocabulary levels N5 through
N1 with a brief description of each. They select their Kotoba JLPT level, which controls
word selection in both Kotoba Mode (hard filter) and Kana Mode (soft preference). It
defaults to N5 for new learners. A clear message is shown: "Words below your selected
level will be marked as mastered. To reset, change your level in Profile settings."
This selection can be changed later in Profile.

Step 2 - Early character unlock. The user is shown the full kana chart with all characters
listed. Characters they already know can be individually tapped or clicked to unlock them
immediately, bypassing the standard 5-correct-answer requirement. This is optional.
A "Skip" button is clearly visible. A note explains this can also be done later in the Dojo.

Step 3 - Notification preferences. Opt in or out of any future push or email
notifications. In Phase 1 this screen is minimal since notifications are not yet active.

Step 4 - Input mode selection. Choose Tap, Type, or Swipe. This can be changed at
any time from the top-right icon during practice.

### 5.2 Mastery System

- Every kana character has its own mastery score, starting at 0
- A correct answer adds 1 point
- A wrong answer adds nothing and does not subtract
- Characters with lower scores appear more frequently
- Characters with higher scores appear less frequently
- This is not SRS. There are no intervals or due dates. It is a frequency-weighted loop.

### 5.3 Word Counter System

- Each word in the word bank has a hidden counter, starting at 0, capped at 5
- When a word is shown, its counter increments
- When selecting a word to practise a character, prefer words with a lower counter
- When all words for a character have reached 5, all counters for that character reset
- This prevents the same word from repeating too often

### 5.4 Kana Unlocking Progression

- Characters start locked
- Words containing locked characters are never shown
- Unlocking order: Seion (first 10 hiragana, then first 10 katakana, alternating until
  all seion done), then Dakuon, then Yoon
- To unlock a character, the user must answer it correctly 5 times
- Characters can be individually unlocked early by clicking them in the Dojo
- Bulk unlock available via the Dojo with a confirmation warning (cannot be undone)

### 5.5 Feedback on Wrong Answers

- The correct character is highlighted in orange on the input field
- A short mnemonic appears below (can be turned off in settings)
- No score penalty
- The prompt moves on after a brief moment
- The English meaning stays hidden until the correct answer is given

### 5.6 Input Modes

- **Tap**: On-screen character buttons. Works on all devices.
- **Type**: Physical keyboard input. Desktop primary.
- **Swipe**: Mobile swipe keyboard. Mobile primary.
- The active mode is shown as an icon in the top-right corner
- The user can switch mode quickly from that icon
- Mode preference is saved to the user profile

### 5.7 Leaderboards

- Global leaderboard for each input mode: Tap, Type, Swipe
- One overall leaderboard combining all three modes
- Input mode is self-selected by the user during onboarding and remembered in their
  profile. Users can update this at any time in Settings. The selected mode is shown
  as a small indicator on their leaderboard entry so others can see what they use.
- All vocabulary levels are ranked equally. An N5 learner and an N1 learner compete
  on the same board. The breadth of vocabulary selected does not affect ranking.
- Leaderboard scores are based on cumulative mastery points
- Phase 2 will add Kotoba leaderboards (separate from the main Kana boards)
- Each mode has its own board; they are never merged across modes

### 5.8 Dojo Screen

- Shows all characters grouped by category: Kana (heading), Seion (subheading), etc.
- Each group is collapsible via an arrow toggle
- Each character shows its individual progress bar
- Heatmap-style colouring: low mastery is cool/pale, high mastery is warm/saturated
- Clicking a locked character prompts individual unlock
- A progress bar click shows an "Unlock All" option with a cannot-be-undone warning

### 5.9 Library Screen (Phase 2)

- Shown as "Under Construction" with a calm placeholder illustration in Phase 1
- Will contain JLPT N5-N1 word banks when built, organised by level and set following
  the same structure as kanadojo.com
- Each word has its own mastery score, tracked separately from character mastery
- Word mastery uses the same heatmap colouring system as the Dojo:
  cool/pale for low mastery, warm/saturated for high mastery
- Word frequency during Kotoba Mode is weighted by mastery score, same logic as kana:
  lower mastery words appear more frequently
- Words also carry a hidden counter (same cap-at-5 logic as the kana word counter system)
  to prevent the same word repeating too often within a session

### 5.10 Animation

- A girl cycling on screen during practice
- Cycling speed correlates with typing speed
- Purely decorative. No gameplay function.
- Animation asset: to be sourced with an open licence (SVG or pixel art preferred).
  AI image generation prompts to be created separately when this sprint is reached.

### 5.11 Lo-Fi Audio

- Optional background music during practice
- Source: free, open-licence lo-fi audio (to be sourced)
- Toggle: on/off in Settings
- Default: on

### 5.12 Profile Screen

- Username display
- Language selection (Japanese only in Phase 1; architecture should support others later)
- Kotoba JLPT level selection: sets the word level for Kotoba Mode and the preferred
  starting level for word selection in Kana Mode. Words below the selected level are
  marked as mastered. Changing to a lower level does not un-master previously mastered
  words. A warning is shown: "To reset mastery, use Reset Progress."
- Font selection (Japanese-friendly fonts only; see Section 6 for font guidance)
- Font size selection (manual slider or preset sizes)
- Font size linked to mastery (later feature - planned but not in Phase 1):
  When enabled, font size starts at 30pt for a character with 0 mastery and decreases
  by 2pt for every correct answer, down to a defined minimum size (to be decided,
  suggested: 12pt). This creates a subtle visual reward as characters become more
  familiar. This setting must not affect readability below the minimum.
- Lo-fi audio toggle
- Reset all progress: requires two confirmations, clearly states this cannot be undone,
  and resets all mastery scores, counters, and unlocked characters to zero

### 5.13 Settings Screen (Game Settings)

- Input mode selection: Tap, Type, or Swipe
- Mode-specific settings:
  - Type mode: choose between reading romaji and typing kana, or reading kana and
    typing romaji
  - Swipe mode: same options as Type
  - Tap mode: no directional options needed
- Mnemonic display toggle

### 5.14 Audio Assets

Audio in LangTap is word-level only. There are no isolated character sound files.

**Audio design principle:**
When a user answers incorrectly, the full practice word is played. Hearing "aka"
when prompted with "あ" is more natural and more useful than hearing "a" in
isolation. It provides real phonetic context and reinforces the word as a unit.
This means only one audio source is needed across the whole app.

**Word pronunciation audio**

Source: VOICEVOX, generated locally on the developer's Mac and committed to the
repo as static files. The app serves them directly with no runtime API calls and
no cost per user. VOICEVOX covers all words including pure kana words, so there
are no coverage gaps regardless of JLPT level.

No external audio dataset is needed. Kanji Alive was evaluated and set aside;
VOICEVOX provides full coverage with a simpler pipeline and no attribution
complexity. See CONTENT.md Section 2.2 for full details.

**Background lo-fi music**

Source: to be sourced from Free Music Archive or a compatible CC licence repository.
Licence required: CC BY or CC0 (public domain). CC BY-NC is not suitable if the app
ever activates paid membership.
Action required: Curate a short playlist (3-5 tracks) before the audio sprint.
Toggle: on by default. Can be turned off in Profile and Settings.

### 5.15 Payments (Infrastructure Only in Phase 1)

- Stripe integration to be wired in but not activated during Phase 1
- Membership model planned: details to be defined in Phase 2
- All Phase 1 features are free and open to all users
- No paywalls or locked content in Phase 1

---

## 6. Design Principles

### Visual

- Soft pastel colour palette: greens, sage, mint, warm cream, blush
- Zen, calm, and uncluttered
- Nothing should feel urgent or alarming
- Heatmap colouring used in the Dojo and Library for progress visualisation
- Typography: clean, legible, Japanese-friendly font (similar to Zen Maru Gothic used
  by kanadojo.com - confirm licence before use)

### Layout

- Bottom navigation bar: Profile, Dojo, Library, Settings
- Top bar: logo only (left), input mode icon (right, tappable)
- Mobile layout: space reserved at bottom for native keyboard when active
- Desktop layout: full screen, centred content area

### Interaction

- Transitions should be smooth but not slow
- Errors should be quiet, not alarming
- Progress should be visible but not intrusive
- The cycling animation should never block content

---

## 7. Technical Direction

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State management**: Zustand
- **Backend and auth**: Supabase (auth, database, real-time)
- **Payments**: Stripe (infrastructure only in Phase 1)
- **Deployment**: Vercel
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

This stack is standard, well-documented, and matches the kanadojo.com open-source
reference project closely enough to use as a structural reference without copying code.

### Licence Note

kanadojo.com is licensed under AGPL-3.0. LangTap does not copy its code. The stack
choices (Next.js, Tailwind, TypeScript, Zustand) are industry-standard and not
proprietary to that project. Inspiration is taken from its structure and content
organisation only.

---

## 8. AI Coding Rules (Summary)

Full rules live in CLAUDE.md. Summary here for reference:

- The AI must never delete any file or database record. Deletions must be flagged to
  the owner, who performs them manually.
- The AI must estimate token cost before beginning any task and wait for approval if
  the task is large.
- Sprints are small and focused. One task per session where possible.
- All code is modular and decoupled. No section should depend on another unless it
  comes from the core.
- Every file is labelled and described. Code reads like a well-structured publication.
- Edits are surgical. Change the specific line in the specific section, not the whole file.
- The CHANGELOG.md is updated by the AI at the end of each session. The owner
  copies and pastes the entry manually.

---

## 9. Document Map

| Document | Purpose |
|---|---|
| `LangTap_Planning.md` | This file. Vision, scope, and feature detail. |
| `LangTap_Sprints.md` | Sprint board and backlog. |
| `CLAUDE.md` | AI coding rules, safeguards, and session protocol. |
| `docs/FRONTEND.md` | UI components, layout rules, styling conventions. |
| `docs/BACKEND.md` | Supabase schema, API design, data flow. |
| `docs/AUTH.md` | Authentication flow, guest mode, account rules. |
| `docs/SECURITY.md` | RLS policies, key handling, data protection. |
| `docs/GAME_DESIGN.md` | Mastery system, unlocking logic, word counters, modes. |
| `docs/CONTENT.md` | Kana sets, word banks, JLPT structure, mnemonics. |
| `docs/DEVOPS.md` | Deployment, environments, Vercel config, CI. |
| `CHANGELOG.md` | Session-by-session record of all changes. |

---

## 10. Reference Projects and Resources

### Apps and Platforms

| Project | URL | Notes |
|---|---|---|
| kanadojo.com | https://kanadojo.com | Primary UX and content structure reference. AGPL-3.0. |
| kana-dojo GitHub | https://github.com/lingdojo/kana-dojo | Open source repo. Reference for structure only. |
| Monkeytype | https://monkeytype.com | Gold standard for typing flow, minimal UX, and speed metrics. Open source. |
| Keybr | https://keybr.com | Character-frequency-weighted typing practice. Directly relevant to the mastery loop. |
| Duolingo | https://duolingo.com | Progression, unlock flow, and onboarding reference. |
| WaniKani | https://wanikani.com | Benchmark for kanji/vocabulary level progression and spaced review. |
| studykana.com | https://studykana.com/practice-reading | Minimal kana typing test. Good reference for lean UX. |
| Kanji Alive | https://app.kanjialive.com | Source of the CC BY 4.0 audio dataset used for word pronunciation. |

### Audio Sources

| Source | URL | Licence | Use |
|---|---|---|---|
| VOICEVOX | https://voicevox.hiroshiba.jp | Free and open source (per voice character terms) | Word pronunciation audio - all phases |
| Free Music Archive | https://freemusicarchive.org | CC BY / CC0 | Lo-fi background music |
| Kanji Alive audio dataset | https://github.com/kanjialive/kanji-data-media | CC BY 4.0 | Evaluated and not used. VOICEVOX provides full coverage. |

---

*This document is the source of truth for product vision and scope.*
*All other documents reference this one.*
*Update this document whenever a major scope or design decision changes.*
