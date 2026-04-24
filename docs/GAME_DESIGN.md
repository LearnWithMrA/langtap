# LangTap - Game Design

Version 1.0 | April 2026
Domain: Engine logic, mastery system, unlocking, word counters, input modes, feedback.
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

### 2.5 Word Mastery Score (Phase 2+)

In Phase 2, individual words gain their own mastery score following identical rules.
Word mastery is tracked separately from character mastery.
The selection algorithm for words follows the same frequency weighting formula.
Word mastery is only relevant in Kotoba Mode. It does not affect Phase 1.

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

**Stage 3 - Yoon**

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

---

## 5. Character Selection Algorithm

This is the core function of the game. It runs every time a new character prompt
is needed.

### 5.1 Inputs

- The full set of kana characters with their mastery scores
- The set of currently unlocked characters
- The full word bank across all JLPT levels, with word counters
- The user's preferred JLPT level (from `kotoba_jlpt_level` on their profile) — used
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

### 6.1 Mnemonic Display

Mnemonics are short memory aids for remembering a kana character's sound.
They are stored in `data/kana/mnemonics.ts`, one per character.

Example:
```
あ (a)  → "An apple with a bite taken out - あ looks like an A"
か (ka) → "A crow calling KA - the stroke looks like a bird"
```

Mnemonics can be turned off in the Settings screen (mnemonic toggle).
When off, the wrong answer feedback shows only the orange highlight, no text below.

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
Example: prompt shows `し`, user types `shi`. Correct. (`si` is also accepted.)

Multiple valid romaji inputs must be accepted for characters with variant spellings:

| Character | Accepted inputs |
|---|---|
| し | shi, si |
| ち | chi, ti |
| つ | tsu, tu |
| じ | ji, zi |
| ふ | fu, hu |

This list must be complete and stored in `data/kana/romajiVariants.ts`.

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

## 11. Kotoba Mode (Phase 2)

### 11.1 Overview

In Kotoba Mode, the user practises vocabulary rather than individual
kana characters. An English word is shown and the user provides the
Japanese equivalent. The input system varies by input mode and by
the Kotoba input setting.

Kotoba Mode is gated behind full Kana mastery (all characters unlocked
and practised). It has its own leaderboard, separate from the Kana
boards.

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
  (Readings) or 4 (Kanji).
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
  level and above. Unlike Kana Mode, this is a hard filter, not a
  preference.
- When the user sets or changes their Kotoba JLPT level, all words
  at levels below the selected level are automatically set to mastered
  (score set to a high value). This allows experienced users to skip
  vocabulary they already know.
- The user is shown a clear message when setting this level:
  "Words below this level will be marked as mastered. To reset,
  change your level in Profile settings."
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
// engine/constants.ts

export const UNLOCK_THRESHOLD = 5          // correct answers to unlock a character
export const WORD_COUNTER_CAP = 5          // max times a word is shown before reset
export const MAX_RESPONSE_TIME_MS = 5000   // response time ceiling for speed bonus
export const BASE_DISTANCE_INCREMENT = 10  // metres per correct answer (base)
export const WRONG_ANSWER_DELAY_MS = 800   // ms before auto-advancing after wrong answer
export const MEANING_DISPLAY_MS = 1500     // ms meaning is shown after correct answer
export const TAP_REMINDER_THRESHOLD = 5    // correct answers before reminder is hidden
export const ANIMATION_WINDOW_SIZE = 10    // recent answers used for animation speed
export const METRES_TO_FEET = 3.281        // conversion factor for US locale display
export const KANJI_INPUT_MULTIPLIER = 4   // scoring multiplier for Kotoba kanji input
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

*This document is the authoritative reference for all game engine logic.*
*If code conflicts with this document, the document wins.*
*Update this document before changing any engine behaviour.*
