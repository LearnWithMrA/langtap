# LangTap - Game Design

Version 1.1 | May 2026
Domain: Engine logic, mastery system, unlocking, word counters, input modes, feedback,
tutorial system, demo mode, special character hints.
Reference: LangTap_Planning.md Sections 5.2 – 5.8, 5.13.
Owner document: CLAUDE.md

Read this document before working in `engine/`, `stores/`, or any game loop component.

---

## 1. Design Intent

LangTap is a typing fluency app, not a flashcard app. The game never tests the user.
It practises with them. The distinction is important for every design decision below.

- There is no failure state. A wrong answer is a prompt, not a penalty.
- There is no level to complete. The loop is endless and self-balancing.
- There is no due date. Characters appear based on need, not a calendar.
- Progress is always visible. Nothing is hidden from the player except word counters
  (which are an implementation detail, not a score).

The mastery system is inspired by spaced repetition but is deliberately simpler.
It is a frequency-weighted loop, not an interval scheduling system.

---

## 2. Mastery System

### 2.1 Character Mastery Score

Every kana character has one mastery score. It is a non-negative integer starting at 0.

```
type MasteryScore = number  // integer >= 0, no upper bound
```

Rules:
- A correct first-attempt input for a character increments that character's score by 1.
- An incorrect first-attempt input awards nothing to that character.
- A correct input during a reattempt awards nothing. Reattempts are progression
  only, not scoring opportunities.
- The score has no ceiling. It grows indefinitely with correct first attempts.
- The score is stored per user per character in Supabase (logged-in users)
  or localStorage (guests).

### 2.2 Per-Character Evaluation Within a Word

Characters within a word are evaluated one at a time as the user types, taps,
or swipes through the word. Each character is an independent scoring event.

Example: the word あか, typed as A then BA:
- あ: user types "a" - correct first attempt - 1 point added to あ mastery
- か: user types "b" - incorrect first attempt - 0 points, reattempt triggered
- か reattempt: user types "a" - correct, but this is a reattempt - 0 points
- Word complete. Prompt advances.

Net result: あ gains 1 point, か gains 0 points.

This means the mastery score reflects first-attempt accuracy, not total correct
inputs. A high mastery score genuinely means the character is well known. This
keeps the frequency weighting honest: characters that need more practice appear
more often, based on real first-attempt performance.

### 2.3 What Counts as a Correct First Attempt

A correct first attempt is any of the following, on the first input for that
character in the current word:

- **Type mode:** the user types the correct romaji string before typing any
  incorrect character for that position.
- **Tap mode:** the user taps the correct character button on the first tap
  for that character position.
- **Swipe mode:** the user swipes the correct character on the first submission
  for that character position.

Any input other than the correct one on the first attempt is incorrect.
Subsequent correct inputs for that character in the same word are reattempts
and award no points.

### 2.4 Frequency Weighting

Characters with lower mastery scores must appear more frequently than characters
with higher scores. This is the core mechanic of the entire game loop.

The selection algorithm must implement this as a weighted random draw, not a strict
ordering. A character with score 0 should be far more likely to appear than one with
score 50, but score 50 should still occasionally appear.

**Recommended weighting formula:**

```
weight(score) = 1 / (score + 1)
```

Examples:
- Score 0  -> weight 1.0     (highest frequency)
- Score 1  -> weight 0.5
- Score 4  -> weight 0.2
- Score 9  -> weight 0.1
- Score 49 -> weight 0.02    (lowest frequency for a well-practised character)

The weight is a relative value. Normalise all weights in the eligible pool to
produce a probability distribution, then draw from it.

### 2.5 Word Mastery Score

Individual words have their own mastery score following identical rules to
character mastery. Word mastery is tracked separately from character mastery
in `stores/word-mastery.store.ts` (localStorage) and the `word_mastery`
Supabase table.

The selection algorithm (`engine/kotoba-selection.ts`) combines mastery weight
(`1 / (score + 1)`) with counter weight to prioritise low-mastery, recently
unseen words. Word mastery increments by 1 when all characters in the word
are correct on first attempt. Wrong attempts on any character result in no
mastery change for that word.

Word mastery is only relevant in Kotoba Mode. It does not affect Kana practice.

---

## 3. Word Counter System

### 3.1 Purpose

The word counter prevents the same word from being shown too many times in close
succession. It is a variety mechanism, not a scoring mechanism.
The counter is never shown to the user.

### 3.2 Rules

- Every word in the word bank has a counter starting at 0, capped at 5.
- When a word is selected and shown to the user, its counter increments by 1.
- When selecting a word to practise a given character, prefer words with a lower counter.
- When all words that contain the target character have reached counter 5, all counters
  for words containing that character reset to 0.
- Counter state is stored per user in Supabase (logged-in) or localStorage (guests).

### 3.3 Selection Priority

When selecting a word for a target character, apply priority in this order:

1. Words that contain the target character, pass isWordEligible(), are at the
   user's preferred JLPT level, and have counter < 5.
2. If none remain at the preferred level, expand to words at all other JLPT levels
   that contain the target character, pass isWordEligible(), and have counter < 5.
3. If all words across all levels are at counter 5, reset all counters for that
   character's words, then restart from step 1.
4. Within the eligible set at any step, prefer words with lower counters (secondary
   weighting).
5. Words containing locked characters must never be selected (see Section 4).

---

## 4. Kana Unlocking System

### 4.1 Lock State

Every kana character starts locked. A locked character:
- Cannot be shown as a practice target.
- Cannot appear in any word that is shown during practice.
- Is visible in the Dojo as locked (greyed out or padlocked icon).

### 4.2 Unlocking via Practice

A character is unlocked when the user has answered it correctly 5 times.
The 5-correct-answer threshold applies to the guided progression only.
Early unlock (see 4.4) bypasses this threshold.

```
const UNLOCK_THRESHOLD = 5
```

### 4.3 Guided Progression Sequence

Characters unlock in a fixed sequence. This sequence cannot be changed by the user
except through early unlock (Section 4.4) or bulk unlock (Section 4.5).

The sequence is:

**Stage 1 - Seion**

Hiragana and katakana are interleaved in groups of 10.
Hiragana must be completed before the corresponding katakana group is introduced.

```
Group 1H:  あ い う え お か き く け こ  (first 10 hiragana)
Group 1K:  ア イ ウ エ オ カ キ ク ケ コ  (first 10 katakana)
Group 2H:  さ し す せ そ た ち つ て と  (next 10 hiragana)
Group 2K:  サ シ ス セ ソ タ チ ツ テ ト  (next 10 katakana)
Group 3H:  な に ぬ ね の は ひ ふ へ ほ
Group 3K:  ナ ニ ヌ ネ ノ ハ ヒ フ ヘ ホ
Group 4H:  ま み む め も や ゆ よ ら り
Group 4K:  マ ミ ム メ モ ヤ ユ ヨ ラ リ
Group 5H:  る れ ろ わ を ん
Group 5K:  ル レ ロ ワ ヲ ン
```

A group becomes active when all characters in the preceding group are unlocked.
Within a group, all characters become eligible simultaneously (not one at a time).

**Stage 2 - Dakuon**

Hiragana and katakana are interleaved in groups of 10, same pattern as Seion.

```
Group 1H:  が ぎ ぐ げ ご ざ じ ず ぜ ぞ  (first 10 dakuon hiragana)
Group 1K:  ガ ギ グ ゲ ゴ ザ ジ ズ ゼ ゾ  (first 10 dakuon katakana)
Group 2H:  だ ぢ づ で ど ば び ぶ べ ぼ
Group 2K:  ダ ヂ ヅ デ ド バ ビ ブ ベ ボ
Group 3H:  ぱ ぴ ぷ ぺ ぽ
Group 3K:  パ ピ プ ペ ポ
```

**Stage 3 - Combination (formerly Yoon)**

Hiragana and katakana are interleaved in groups, same pattern as Seion and Dakuon.

```
Group 1H:  きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ
Group 1K:  キャ キュ キョ シャ シュ ショ チャ チュ チョ ニャ
Group 2H:  にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ
Group 2K:  ニュ ニョ ヒャ ヒュ ヒョ ミャ ミュ ミョ リャ リュ
Group 3H:  りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ
Group 3K:  リョ ギャ ギュ ギョ ジャ ジュ ジョ ビャ ビュ ビョ
Group 4H:  ぴゃ ぴゅ ぴょ
Group 4K:  ピャ ピュ ピョ
```

### 4.4 Early Unlock (Onboarding)

During onboarding step 2, users can tap any character on the kana chart to unlock it
immediately, bypassing the 5-correct-answer threshold. This is optional and reversible
only by resetting all progress. It does not affect the guided progression sequence for
characters that have not been early-unlocked.

### 4.5 Individual Unlock (Dojo)

In the Dojo, a user can tap a locked character to unlock it immediately.
This requires a single confirmation step.
The unlock is permanent and cannot be undone without resetting all progress.

### 4.6 Bulk Unlock (Dojo)

In the Dojo, clicking a progress bar shows an "Unlock All" option.
This unlocks all characters in that group simultaneously.
This requires two confirmation steps with a clear "cannot be undone" warning.

### 4.7 Word Filtering

At all times, the word selection algorithm must filter out any word that contains
one or more locked characters. This is a hard constraint - no locked characters may
ever appear in a word shown during practice.

```
isWordEligible(word, unlockedCharacters): boolean
  → true only if every character in the word is in the unlockedCharacters set
```

### 4.8 Inline Kana Learning Phase

The kana learning phase uses two separate scoring dimensions:

- **Learning scores (0-5):** tracked per character, incremented by single-character
  drills. Learning scores unlock characters through progression steps. They are
  separate from mastery scores and serve only the unlock gate.
- **Mastery scores (0-40+):** tracked per character, incremented only by word
  practice (correct first-attempt within a word). Mastery scores drive the heatmap
  and frequency weighting. They are never affected by character drills.

This separation means a character can have a learning score of 5 (unlocked) but a
mastery score of 0 (never seen in a word). The heatmap only reflects word-level
performance.

#### Three character sets

The learning phase produces three character sets, computed by pure functions in
`engine/practice-eligibility.ts`:

| Set | Purpose | Criteria |
|---|---|---|
| `practiceAvailable` | Characters the player can drill (solo and in words) | All characters in the current and previous `UNLOCK_STEPS`, plus manual unlocks, plus always-unlocked special characters |
| `wordEligible` | Characters that can appear in word prompts | Learning score >= `KANA_WORD_ELIGIBLE_THRESHOLD` (5), or manually unlocked, or always-unlocked |
| `dojoUnlocked` | Characters shown as unlocked in the Dojo | Same as `wordEligible` |

#### Progression through UNLOCK_STEPS

Characters unlock in step groups defined in `data/kana/progression-groups.ts` as
`UNLOCK_STEPS`. Each step is an array of group indexes. A step becomes available
when all characters in the previous step have reached the learning threshold (5)
or been manually unlocked.

Manual unlocks (from onboarding or dojo) bypass the 5-answer gate entirely. The
character is immediately added to all three sets.

#### Special characters

Three characters are always unlocked and always word-eligible but are excluded
from solo drills:

| Character | ID | Reason |
|---|---|---|
| っ (hiragana sokuon) | `h-sokuon` | Doubles the following consonant, never pronounced alone |
| ッ (katakana sokuon) | `k-sokuon` | Same as above, katakana variant |
| ー (long vowel mark) | `k-longvowel` | Extends the previous vowel, never standalone |

These are defined in `ALWAYS_UNLOCKED` and `SOLO_DRILL_EXCLUDED` sets in
`engine/practice-eligibility.ts`.

#### Word/character mixing

When 10 or more words are eligible (`MIN_ELIGIBLE_WORDS_FOR_MIXING`), the selection
algorithm mixes word prompts and character drills at a 60/40 ratio
(`WORD_PROMPT_RATIO = 0.6`). Below 10 eligible words, only character drills are
shown (with occasional word fallback if any words are eligible). Characters that
still need learning (score < 5) are always prioritised for drills.

---

## 5. Character Selection Algorithm

This is the core function of the game. It runs every time a new character prompt
is needed.

### 5.1 Inputs

- The full set of kana characters with their mastery scores
- The set of currently unlocked characters
- The full word bank across all JLPT levels, with word counters
- The user's preferred JLPT level (from `jlpt_level` on their profile) — used
  as a starting preference for word selection in Kana Mode, not as a hard filter.
  This is the same field used in Kotoba Mode, keeping the profile simple and consistent.

### 5.2 Steps

```
1. Filter to eligible characters:
   characters where isUnlocked = true

2. Apply frequency weighting:
   weight = 1 / (masteryScore + 1) for each eligible character

3. Weighted random draw:
   Select one character using the weights as a probability distribution.

4. Select a word for that character:
   a. Filter words that contain the selected character AND pass isWordEligible().
   b. Among those, prefer words at the user's preferred JLPT level with counter < 5.
   c. If no eligible words remain at the preferred level (all at counter 5 or none
      pass isWordEligible()), expand to words at all other JLPT levels with counter < 5.
   d. If all words across all levels are at counter 5, reset all counters for that
      character's words, then restart from step b.
   e. Among eligible words, apply secondary weighting by counter value:
      lower counter = higher probability.
   f. Draw one word.

5. Return:
   { character, word, reading, meaning }
```

### 5.3 Edge Cases

| Situation | Behaviour |
|---|---|
| Only one character unlocked | That character is always selected. No weighting needed. |
| No words available for a character | Skip that character. Select the next weighted draw. Log a warning. This should not happen if word bank is complete. |
| All characters at very high mastery | Weighting still applies. Highest-score characters still appear, just rarely. |
| All words at counter 5 across all levels | Reset all counters for that character's words and restart selection from the preferred level. |

### 5.4 Purity Requirement

The selection algorithm must be a pure function.
No side effects. No state mutations. No API calls.
It takes inputs and returns a result. Tests must be able to call it directly.

```ts
// engine/selection.ts
selectNextPrompt(
  characters: CharacterWithMastery[],
  wordBank: WordBankEntry[],        // full bank across all JLPT levels combined
  unlockedIds: Set<string>,
  preferredLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'  // from kanji_jlpt_level on profile
): PromptResult
```

### 5.5 Kanji Distractor Filtering (Kotoba)

When generating tap-mode distractors for Kotoba kanji input,
`generateKotobaDistractors` in `engine/kotoba-selection.ts` filters candidates
by matching kanji character length. Single-kanji words (e.g. 水) get
single-kanji distractors. Multi-kanji words get multi-kanji distractors of the
same length. If not enough same-length candidates exist, the function falls back
to other lengths to fill the remaining slots.

```ts
generateKotobaDistractors(
  correctKanji: string,
  count: number,
  wordBank: readonly WordBankEntry[],
  rng?: () => number,
): string[]
```

---

## 6. Feedback on Wrong Answers

Characters within a word are evaluated one at a time as the user types, taps, or
swipes. When the user inputs an incorrect character at any position in the word:

1. The correct character is highlighted orange on the input field or tap grid.
2. The full practice word is played as audio. The user hears the whole word, not
   the isolated character sound. This provides phonetic context: hearing "aka" when
   prompted with "あ" is more useful than hearing "a" on its own, because it shows
   how the character sounds in natural speech and reinforces the word as a unit.
3. A short mnemonic appears below the prompt for the specific incorrect character
   (if mnemonics are enabled in settings).
4. The English meaning of the word stays hidden. It is not revealed on a wrong answer.
5. No mastery points are awarded for this character. The score does not change.
6. The user enters reattempt mode for that character position. They must input the
   correct character to continue. Any correct input during reattempt awards zero
   points. Reattempt is progression only, not scoring.
7. Once the reattempt is resolved correctly, the word resumes from that position.
8. The user is not forced to wait. They can input immediately.

**Hint threshold per mode:** the answer hint appears after a different number
of wrong attempts depending on the game mode. Kana shows the hint after 3
wrong attempts on a character (`MAX_WRONG_ATTEMPTS = 3` in
`components/game/game-window.tsx`). Kotoba shows it after 1 wrong attempt
(`MAX_WRONG_ATTEMPTS = 1` in `components/game/kotoba-game-window.tsx`),
because whole-word prompts are harder to recover from by trial and error.
Both respect the hints toggle in Settings.

### 6.1 Mnemonic Display

LangTap uses dual mnemonics that link a hiragana and katakana pair through a
shared visual story. They are stored in `data/kana/mnemonics.ts`, keyed by
romaji sound (one entry per sound, covering both scripts).

Example:
```
a  → "あ is an a-pple with a stem, and ア is an a-xe cutting it."
ka → "か is a ka-ite with string, and カ is the kite's sharp frame."
```

**On learning cards (character drills):** the dual mnemonic is shown immediately
in the meaning area in dark orange (`text-feedback-mnemonic`). When the user answers
correctly, the text turns green (`text-feedback-correct`), giving time to read
the mnemonic before the prompt auto-advances. Lookup: `getDualMnemonic(romaji)`
in `data/kana/mnemonics.ts`.

**First-time banner:** the first time a dual mnemonic appears, a banner explains
the concept and recommends writing them down. Tracked via `useDialogueSeen` with
trigger `'dual-mnemonic-hint'`.

Mnemonics can be turned off in the Settings screen (Memory hints toggle).
When off, the learning card meaning area stays blank. The hints toggle also
controls the romaji/kana hint on wrong answers. It does not affect the English
meaning shown on word prompts.

### 6.2 English Meaning Reveal and Progression

The English meaning of the practice word is hidden until all characters in the
word have been input correctly (first attempt or reattempt). Partial completion
does not reveal the meaning.

On full word completion:
- The meaning appears below the character in a calm, small font.
- It is not celebrated or amplified - it is informational.
- A tap anywhere on the screen, or pressing any key, immediately advances to the
  next prompt.
- If the user does not interact, the prompt auto-advances after `MEANING_DISPLAY_MS`
  (default 1500ms, see Section 13).

**Tap-to-progress reminder:**

A small, unobtrusive hint ("Tap anywhere to continue") is shown below the meaning
on the first few correct answers of the user's lifetime (suggested: first 5 times).
After the threshold is reached, the reminder is never shown again.
The threshold count is stored in the user's profile (or localStorage for guests).

The reminder must not appear on every correct answer - only when the user has not yet
learned the interaction. If the user taps before the reminder would appear (i.e. they
already know to tap), the reminder counter still increments so the threshold is reached
faster.

---

## 7. Input Modes

### 7.1 Tap Mode

On-screen kana character buttons are displayed in a grid.
The user taps the button matching the prompted character.

- Works on all devices (desktop and mobile).
- Buttons are sized for touch (minimum 44x44pt per Apple HIG).
- Correct tap: immediate feedback, next prompt.
- Wrong tap: wrong answer feedback sequence (Section 6).
- The grid shows only unlocked characters.

### 7.2 Type Mode

The user types the romaji equivalent of the prompted kana character
using a physical keyboard. The app compares the typed romaji to the
expected reading and evaluates correctness.

Example: prompt shows `あ`, user types `a`. Correct.
Example: prompt shows `し`, user types `shi`. Correct.

LangTap uses Hepburn romanization exclusively (shi, chi, tsu, fu). No variant
romanizations are accepted. Each character has a single accepted romaji input
from the `romaji` field in `data/kana/characters.ts`.

### 7.3 Swipe Mode

Designed for mobile users using a native swipe keyboard (e.g. Japanese keyboard on iOS
or Android). The user swipes to type the romaji of the prompted character, then submits.
The app evaluates the input the same way as Type mode.

Mobile layout considerations:
- Empty space must be reserved at the bottom of the screen when the native keyboard
  is open, so the prompt and character are not obscured.
- The keyboard open/close state must be detected and the layout must respond.
- The mode switcher icon (top right) allows quick switching between modes.

### 7.4 Mode Persistence

The user's selected input mode is saved to their profile in Supabase (or localStorage
for guests) and restored at the start of each session.

Mode can be changed at any time via the top-right icon during practice.
Changing mode mid-session does not reset the current prompt or mastery scores.

---

## 8. Distance and Progress Mechanic

### 8.1 Concept

During a session, the user accumulates distance (metres or feet, based on locale).
Distance is a feel-good metric - it represents the journey metaphor in the tagline.
It is not a competitive score. It does not appear on leaderboards.

### 8.2 Accumulation Rules

- Each correct answer contributes a distance increment.
- The increment is proportional to answer speed: faster answer = more distance.
- Wrong answers contribute zero distance.
- Distance resets at the start of each new session.

**Suggested formula:**
```
baseIncrement = 10 metres
speedBonus = max(0, (MAX_RESPONSE_TIME_MS - responseTimeMs) / MAX_RESPONSE_TIME_MS)
increment = baseIncrement * (1 + speedBonus)

MAX_RESPONSE_TIME_MS = 5000  // 5 seconds = no speed bonus
```

This means:
- A 1-second response → increment ~18m
- A 3-second response → increment ~14m
- A 5-second response → increment 10m (base only)
- Over 5 seconds → increment 10m (no penalty)

### 8.3 Animation Coupling

The cycling animation speed must be coupled to the rate of correct answers in the
current window (suggested: last 10 answers). More correct answers recently = faster
cycling. This is a visual correlation, not an exact mathematical binding.

The animation speed has a minimum (gentle cycling) and a maximum (fast cycling).
It must never stop completely unless the user has stopped answering.

### 8.4 Locale

Detect locale at app start. Display metres for metric locales, feet for US locale.
The conversion is: 1 metre = 3.281 feet.
Store the raw value in metres internally. Convert for display only.

---

## 8.5 Streak Mechanic

### 8.5.1 Overview

A streak represents consecutive days of practice. It is a motivational
metric, not a scoring mechanism. Streaks are independent of mastery
scores. A grace-day rule prevents a single missed day from breaking a
streak.

### 8.5.2 3-Day Start Rule

A streak does not begin until 3 consecutive days of practice have been
completed. Until then, the streak counter shows 0. Practiced days before
the streak starts are shown as gold circles on the calendar but without
flame icons.

### 8.5.3 Grace Day Rule

Once a streak is active, missing one day does not break it. That day
becomes a "grace day" shown with a blue flame. However, after using a
grace day, the user must practice on the following day before another
grace day can be used. Missing two consecutive days, or missing the day
immediately after a grace day, breaks the streak.

### 8.5.4 State Machine

```
States: ACTIVE | GRACE | BROKEN

On day end:
  if user practiced today (>= 1 character answered):
    state = ACTIVE, streak continues, grace re-enabled

  if user did NOT practice today:
    if previous day state == ACTIVE:
      state = GRACE (streak preserved, grace consumed)
    if previous day state == GRACE:
      state = BROKEN (streak resets to 0)
    if previous day state == BROKEN:
      state = BROKEN (remains broken)
```

### 8.5.5 Tracked Values

```ts
type StreakState = {
  streakChainDays: number   // consecutive days including grace days
  practiceDays: number      // days with actual practice within the chain
  todayState: 'active' | 'grace' | 'broken'
}
```

`streakChainDays` is the number shown to the user. `practiceDays` is
used for analytics and potential future rewards.

### 8.5.6 Display

- Red/orange flame: user practiced that day
- Blue flame: grace day (user did not practice, streak preserved)
- Gold circle (no flame): practiced but not part of a streak
- Grey circle: no practice
- Highlight band: wraps consecutive current-streak days only (not
  past streaks)

See UX_DESIGN.md Section 6.3 for the dashboard streak display and
Section 6.4 for the calendar widget.

### 8.5.7 Schema and Persistence

Streak state is derived from the `practice_sessions` table (see
docs/BACKEND.md Section 2.7). Canonical date is user-local, not UTC.
Server stores `event_at_utc`, `user_tz` (IANA identifier), and
`local_date` (derived). Streak evaluation runs server-side from
derived local dates. Client never computes streak state.

---

## 8.6 Demo Mode (Sprint 14)

### 8.6.1 Overview

Visitors try the app via curated demo routes (`/demo/kana`, `/demo/kotoba`,
`/demo/dojo/kana`, `/demo/dojo/kotoba`). Demo mode replaced the guest trial
cap system in Sprint 14. No progress persists; no server interaction occurs.

### 8.6.2 Demo practice

- 18 kana prompts and 8 kotoba prompts in `data/demo/demo-prompts.ts`.
- Deterministic sequence (no weighted selection).
- Custom hooks (`useDemoKanaPracticeSession`, `useDemoKotobaPracticeSession`)
  return the same interface as real practice hooks.
- No mastery, counter, or session store writes.

### 8.6.3 Demo dojo

- `KanaDojoClient` and `KotobaDojoClient` accept a `demo` prop.
- When `demo=true`, mastery data comes from `data/demo/demo-mastery.ts` via
  local `useState`. All interactions write to component state only.
- Practice links point to `/demo/kana` or `/demo/kotoba` in demo mode.

---

## 9. Session Score

A session score tracks the current session's statistics.
It resets at the start of every new session.
It is displayed to the user at the end of a session (end-of-session summary screen,
Phase 1 later sprint - not in the first practice screen build).

```ts
type SessionScore = {
  correctAnswers: number
  wrongAnswers: number
  distanceMetres: number
  durationSeconds: number
  charactersEncountered: string[]  // unique characters seen this session
}
```

---

## 10. Leaderboard Score

The leaderboard score is the user's total cumulative mastery points across all characters.
It is the sum of all individual character mastery scores.

```
leaderboardScore = sum(masteryScore for each character)
```

This score increases over time and never decreases (wrong answers do not subtract).
It is synced to Supabase after each session ends, not after each individual answer.
Syncing on every keypress would generate excessive API traffic.

Leaderboard scores are equal regardless of JLPT level selected. A user practising
N5 vocabulary and a user practising N1 vocabulary are on the same leaderboard.

---

## 11. Kotoba Mode

### 11.1 Overview

In Kotoba Mode, the user practises vocabulary rather than individual
kana characters. An English word is shown and the user provides the
Japanese equivalent. The input system varies by input mode and by
the Kotoba input setting.

Word selection uses `engine/kotoba-selection.ts` with mastery-weighted
frequency: low-mastery, recently unseen words appear more often. Words
unlock in steps of 6 via `engine/kotoba-progression.ts`. The practice
hook `hooks/useKotobaPracticeSession.ts` bridges selection, progression,
and the word mastery store.

Step 0 of a level is not unconditionally unlocked (changed in Session
114): `isKotobaStepUnlocked` takes a `step0Unlocked` parameter, and the
dojo client only sets it true for JLPT levels at or below the user's
selected level. Levels above the user's selection start fully locked
and require manual unlocks.

Kotoba Mode is available from the start. There is no kana mastery gate.
Users can practise vocabulary immediately after onboarding. It has its
own leaderboard, separate from the Kana boards.

### 11.2 Kotoba Input Setting

A "Kotoba Input" section in the Settings dialog controls what the user
is expected to produce. Two options:

- **Readings**: the user types/taps/swipes the kana reading of the word.
  This uses the same input system as the Kana game screens. Scoring is
  at the standard 1x rate.
- **Kanji**: the user types the kanji form of the word. They use their
  keyboard's auto-suggestion to select the correct kanji (the same
  process as natural Japanese typing). Scoring is at a 4x multiplier
  because kanji recall is significantly harder.

Default: Readings.
The multiplier constant is defined in `engine/constants.ts`:

```ts
export const KANJI_INPUT_MULTIPLIER = 4
```

### 11.3 Kotoba Game Flow by Input Mode

**Tap mode (two-stage flow):**
1. Stage 1: English word shown. The user selects the correct kana
   reading from the on-screen tap grid (same grid as Kana mode).
2. Stage 2 (Kanji input only): if Kanji input is selected, a second
   prompt appears showing kanji options. The user taps the correct
   kanji. This stage is skipped entirely when Readings input is
   selected.
3. Scoring: Stage 1 awards standard points. Stage 2 awards points
   at the 4x multiplier. Both stages must be correct for the word
   to count as mastered.

**Type mode:**
- Single input field.
- Readings input: user types romaji, the app converts to kana (same
  IME handling as Kana mode with zero-width-space trick).
- Kanji input: user types romaji, uses the keyboard's kanji
  auto-suggestion to select the correct kanji. Plain text input with
  no zero-width-space manipulation (the IME needs to offer kanji
  candidates naturally).
- Scoring: Readings at 1x, Kanji at 4x.

**Swipe mode:**
- Single input field, same as Type mode.
- Readings input: user swipes kana on the mobile keyboard.
- Kanji input: user swipes and selects kanji from suggestions.
- Scoring: Readings at 1x, Kanji at 4x.

### 11.4 Kotoba Scoring

- Correct first-attempt answer: word mastery score increments by 1
  (Readings) or 4 (Kanji). The multiplier is `KANJI_INPUT_MULTIPLIER`
  in `engine/constants.ts`, passed via `recordWordComplete(wasClean, 4)`.
- Wrong first-attempt answer: no points. Same feedback pattern as
  Kana mode (orange highlight, audio, mnemonic if enabled).
- Reattempt: awards no points regardless of input type.
- Word frequency is weighted by word mastery score using the same
  formula: `weight = 1 / (score + 1)`.
- Word counter system applies identically to Kana mode.
- Distance mechanic applies identically: base increment per correct
  answer, speed bonus, no penalty for wrong.

### 11.5 Kotoba JLPT Level

- The user selects a Kotoba JLPT level during onboarding (and can
  change it in Profile).
- Word selection in Kotoba Mode is strictly filtered to the selected
  level. Unlike Kana Mode, this is a hard filter, not a preference.
- When the user completes onboarding (or changes their JLPT level),
  all words at levels below the selected level are automatically set
  to mastered (score set to KOTOBA_MASTERY_THRESHOLD). This is
  implemented via `buildAutoMasteryScores()` in
  `engine/kotoba-progression.ts`, called from onboarding step 3.
- N5 selected: nothing auto-mastered, first 6 words unlocked.
  N4 selected: all N5 words mastered, first 6 N4 words unlocked.
  N3 selected: all N5 + N4 words mastered, first 6 N3 unlocked. Etc.
- The user is shown a clear message when setting this level:
  "Words below this level will be marked as mastered."
- Changing the level to a lower value does not un-master previously
  mastered words. Resetting progress from Profile is the only way to
  clear mastery scores.

### 11.6 Kotoba Leaderboard

Kotoba has its own leaderboard, separate from the Kana boards. The
same ranking logic applies. Kanji input players accumulate points
faster due to the 4x multiplier, which reflects the higher difficulty.

---

## 12. Constants Reference

All constants must be defined in `engine/constants.ts` and imported where needed.
No magic numbers anywhere in the codebase.

```ts
// engine/constants.ts - all currently implemented

export const FEEDBACK_FLASH_MS = 300       // correct/wrong flash duration
export const WRONG_ANSWER_DELAY_MS = 800   // delay before romaji hint on wrong answer
export const MEANING_DISPLAY_MS = 1500     // ms meaning shown after correct (Kana)
export const KOTOBA_DISPLAY_MS = 3000      // ms result shown after correct (Kotoba)
export const MEANING_FADE_MS = 150         // fade-in duration for meaning reveal
export const TAP_REMINDER_THRESHOLD = 5    // correct answers before reminder hides
export const UNLOCK_THRESHOLD = 5          // correct answers to unlock a character
export const KOTOBA_UNLOCK_THRESHOLD = 3   // mastery score to unlock next Kotoba word step
export const KOTOBA_MASTERY_THRESHOLD = 15 // score for a word to be considered fully mastered
export const MAX_WORD_COUNTER = 5          // max times a word is shown before reset
export const KANJI_INPUT_MULTIPLIER = 4    // scoring multiplier for kanji input in Kotoba
export const MAX_RESPONSE_TIME_MS = 5000   // response time ceiling for speed bonus
export const BASE_DISTANCE_INCREMENT = 10  // metres per correct answer (base)
export const METRES_TO_FEET = 3.28084      // conversion factor for US locale
export const KANA_WORD_ELIGIBLE_THRESHOLD = 5   // learning score before character appears in words
export const MIN_ELIGIBLE_WORDS_FOR_MIXING = 10 // eligible words before word prompts mix in
export const WORD_PROMPT_RATIO = 0.6       // probability of word prompt when mixing is active
export const GUEST_TRIAL_DISTANCE_CAP = 30 // deprecated (Sprint 14, demo mode replaces guest trial)
export const FREE_DAILY_DISTANCE_CAP = 100 // max metres a free-tier user can practise per day
export const STREAK_START_THRESHOLD = 3    // consecutive practice days to start a streak
export const FLAME_DISTANCE_THRESHOLD = 10 // min metres in a day to earn a flame on the calendar

// Deferred to the sprint that implements their consumers:
// export const ANIMATION_WINDOW_SIZE = 10    // recent answers for animation speed
```

---

## 13. Testing Requirements

Every function in `engine/` must have full test coverage.
Tests live in `engine/__tests__/` or alongside the file as `filename.test.ts`.

Required test cases for the scoring logic:
- Correct first attempt on all characters in a word: every character gains 1 point.
- Correct first attempt on some characters, wrong on others: only correct characters
  gain points, wrong characters gain nothing.
- Reattempt resolved correctly: the reattempted character gains 0 points.
- Multiple reattempts on the same character: still 0 points total for that character.
- Word completes after a mix of first attempts and reattempts: scoring reflects
  only the first-attempt correct characters.

Required test cases for the selection algorithm:
- Single character unlocked: always returns that character.
- All characters at score 0: uniform probability (statistical test with large N).
- Mixed scores: lower-score characters selected more often (statistical test).
- All words for a character at counter 5 at preferred level: spills to other levels.
- All words for a character at counter 5 across all levels: counters reset, word still selected.
- Word containing locked character is never selected.

Required test cases for the distance mechanic:
- 1-second response: increment > base.
- 5-second response: increment = base.
- 10-second response: increment = base (no penalty beyond ceiling).
- Wrong answer: increment = 0.

Required test cases for unlock logic:
- Character at 4 correct answers: still locked.
- Character at 5 correct answers: unlocked.
- Locked character: never appears in word selection output.

---

## 14. Tutorial Dialogue System

### 14.1 Overview

A mascot character delivers tutorial messages via a themed dialogue card overlay.
The system introduces new players to each game mode and guides them through the
initial flow. All dialogue is non-blocking: the player can skip at any time.

### 14.2 Mascot

The mascot has three poses:

| Pose | Used for |
|---|---|
| `neutral` | Standard explanations, introductions |
| `encouraging` | Milestone celebrations, unlock notifications |
| `thinking` | Settings advice, post-trial tips |

### 14.3 Dialogue Card

The dialogue card is a themed overlay rendered by `components/game/dialogue-overlay.tsx`:

- **Green theme** for kana dialogues.
- **Blue theme** for kotoba dialogues.
- Text appears with a typewriter effect (character-by-character reveal).
- All messages in a script flow continuously: the next message begins automatically
  after the previous one finishes typing.
- A "Skip" button reveals the current paragraph instantly. Messages continue to
  auto-advance after the skipped paragraph is fully revealed.
- The card shows "Got it" after the final message has been fully displayed.

### 14.4 Dialogue Scripts

Scripts are stored in `data/tutorial/dialogue-scripts.ts` as a record keyed by
`DialogueScriptTrigger`. Each script contains an ordered array of message strings
and a mascot pose.

**Kana flow (first play):**
1. `kana-first-play` (neutral): welcome, explains kana alphabets, mastery, feedback
2. Settings prompt: explains direction, audio, pacing options
3. Mode-specific: `kana-mode-tap`, `kana-mode-swipe`, or `kana-mode-type`
4. Trial round (see Section 15)
5. `kana-post-trial` (thinking): settings advice before real practice

**Kotoba flow (first play per mode):**
1. Mode-specific: `kotoba-first-tap`, `kotoba-first-type`, or `kotoba-first-swipe`
2. Trial round (see Section 15)
3. Practice begins

Mode dialogues include a "Skip trial" option so experienced users can go straight
to practice.

### 14.5 Seen State

Each dialogue trigger is tracked independently in localStorage via the
`useDialogueSeen` hook (`hooks/useDialogueSeen.ts`). The hook uses
`useSyncExternalStore` for SSR-safe hydration.

Storage key: `langtap-dialogues-seen` (JSON array of trigger IDs).

The `DialogueTrigger` type includes all script triggers plus trial triggers, banner
triggers, and special character hint triggers (see Sections 15 and 17).

---

## 15. Tutorial Trial Round

### 15.1 Overview

After the tutorial dialogue, new players complete a short trial round to experience
the game mechanics in a sandboxed environment. No mastery scores or word counters
are written during the trial. The trial is per-mode: completing the kana tap trial
does not mark the kana swipe trial as seen.

### 15.2 Kana Trial

The kana trial uses fixed prompts from `data/tutorial/trial-prompts.ts`:

- 3 single-character drills (あ, い, う)
- 3 word prompts using only group 0+1 characters (会う, 家, 上)

The tap grid is restricted during the trial to only the characters in
`TRIAL_ALLOWED_IDS` (the a-row and ka-row: あ い う え お か き く け こ).
This prevents the grid from showing characters the player has not been introduced to.

### 15.3 Kotoba Trial

The kotoba trial uses 3 fixed N5 words defined in `hooks/useKotobaTrialSession.ts`:

- 水 (みず, Water)
- 犬 (いぬ, Dog)
- 猫 (ねこ, Cat)

The hook returns a `UseKotobaPracticeReturn`-shaped object so the game components
can treat the trial identically to a real session.

### 15.4 Sandbox Rules

- No mastery score writes (character or word).
- No word counter increments.
- No distance accumulation.
- Trial state is tracked per mode via `useDialogueSeen` (e.g. `kana-trial-tap`,
  `kotoba-trial-type`).
- Completing the trial marks the trigger as seen and transitions to real practice.

---

## 16. Dojo Banner Tips

### 16.1 Overview

The Kana Dojo and Kotoba Dojo each display sequential contextual tips in a banner
card at the top of the screen. Tips show one per visit and advance on dismiss.
Once all tips have been seen, the banner stops appearing.

### 16.2 Implementation

Tips are managed by `components/dojo/help-card.tsx` using localStorage with
`useSyncExternalStore`. Each dojo has its own storage key:

- Kana: `dojo.kana.tipIndex`
- Kotoba: `dojo.kotoba.tipIndex`

The `HelpCard` component renders a card with an icon, title, body text, and a
"Got it" dismiss button.

### 16.3 Tip Content

**Kana Dojo (2 tips):**

| # | Title | Content |
|---|---|---|
| 1 | Welcome to the Dojo | Already know a character? Tap to unlock it, then tap again to mark it as mastered, so it will not appear as often. |
| 2 | Need a refresher? | Forgotten one? Tap to reset it and it will start showing up again. |

**Kotoba Dojo (2 tips):**

| # | Title | Content |
|---|---|---|
| 1 | Welcome to Kotoba Dojo | Words unlock as you learn their characters. Keep practising kana and new words will appear here. |
| 2 | Explore your words | Tap a word to see its reading and meaning. Mastered words have a gold bar. |

---

## 17. Special Character Hints

### 17.1 Overview

Three special characters have teaching banners that appear above the game window
the first time the player encounters them in a word prompt. Each hint is tracked
independently via `useDialogueSeen` and appears only once per character.

### 17.2 Characters

| Character | Trigger ID | What it teaches |
|---|---|---|
| っ (hiragana sokuon) | `sokuon-hiragana-hint` | Doubles the following consonant sound. Typed by repeating the next consonant (e.g. って = tte). |
| ッ (katakana sokuon) | `sokuon-katakana-hint` | Same doubling rule in katakana. |
| ー (long vowel mark) | `longvowel-hint` | Extends the previous vowel. Used in katakana words (e.g. コーヒー = koohii). |

### 17.3 Display Rules

- The hint banner renders above the game window in `components/layout/practice-client.tsx`.
- It appears when the current prompt contains one of the special character IDs
  (`h-sokuon`, `k-sokuon`, `k-longvowel`) and the corresponding trigger has not
  been marked as seen.
- Only one hint shows at a time, even if the word contains multiple special characters.
- The banner auto-dismisses when the player starts typing or tapping.
- After dismissal, the trigger is marked as seen and the hint never reappears.

---

*This document is the authoritative reference for all game engine logic.*
*If code conflicts with this document, the document wins.*
*Update this document before changing any engine behaviour.*
