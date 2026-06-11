# Tutorial Dialogue Scripts

Version 2.0 | June 2026

These are the dialogue scripts for the tutorial and guidance system.
Each section is a trigger point with its messages. Messages are delivered via
the Pokemon-style typewriter overlay with the mascot character.

v2.0 (Session 118): all scripts rewritten to be roughly half their original
length. Principles: one idea per message, the trial round teaches mechanics
better than text, never explain what the next screen will demonstrate anyway.

Edit the wording here AND in `data/tutorial/dialogue-scripts.ts` together.
The implementation reads from the TypeScript file; this document is the
editorial source. The two must stay in sync.

---

## 1. First Kana Practice Session

Trigger: Player lands on the kana practice screen for the first time.

- "Welcome to LangTap! This game builds one skill: typing Japanese without thinking."
- "Japanese has two phonetic alphabets, hiragana and katakana. Same sounds, different shapes. You'll learn them side by side."
- "We start with hiragana, adding the katakana versions group by group as you go."
- "Answer on the first try to earn distance points. Tricky characters come back more often and easy ones fade away, just until you need them again."
- "Wrong answers cost nothing. After three tries we show the answer and move on."
- "Once you've learned enough characters, they start appearing in real Japanese words."
- "That's everything. The game handles the rest, just keep pedalling."

## 1A. Mode Introduction (second dialogue, immediately after section 1)

Trigger: Plays as a separate dialogue screen right after the intro dismisses.
Content varies by the player's selected input mode.

### Tap Mode

- "Tap mode: tap the matching character on the grid. That's it."
- "Let's warm up with a quick trial round, then you start for real."
- "Prefer your phone keyboard? Try Swipe. On a computer? Try Type. Switch any time from the mode icon."

### Swipe Mode

- "Swipe mode uses your phone's Japanese keyboard. Add one in your phone settings if you haven't yet."
- "The keyboard shows hiragana only. For katakana, swipe the hiragana and pick the katakana suggestion."
- "Let's warm up with a quick trial round, then you start for real."

### Type Mode

- "Type mode: type the romaji for each character. あ is 'a', き is 'ki', し is 'shi'."
- "Katakana works the same way: same romaji, matched automatically."
- "Let's warm up with a quick trial round, then you start for real."

## 1B. After First Kana Practice (after the trial round completes)

Trigger: Plays after the tutorial trial round finishes.

- "Nice! One last thing: the gear icon opens Settings."
- "There you can fix the prompt direction, change the pacing, and toggle hints, audio, and key clicks."

---

## 2. First Kotoba Practice Session

Trigger: Player lands on the kotoba practice screen for the first time.
Note: No need to repeat general game mechanics since onboarding sends players to kana first.
The first message and last two messages are shared; only the second message varies by mode.

Shared opener:

- "Welcome to Kotoba: where you learn how to type Japanese words."

Mode-specific second message:

- Tap: "Answer in kana on the grid, or pick the matching kanji from the options."
- Type: "Type the reading in kana, or answer in kanji using your Japanese keyboard's suggestions."
- Swipe: "Swipe the reading in kana, or answer in kanji using your keyboard's suggestions."

Shared closing:

- "Kanji answers earn 4x the distance. Words unlock in small sets as you master them."
- "Let's try a few."

---

## 3. First Time in Kana Dojo

Trigger: Player opens the Kana Dojo for the first time.
Format: Banner tips (shown gradually, not all at once). Implemented in the
dojo help-card system, not the dialogue overlay.

- "Already know a character? Tap to unlock it, then tap again to mark it as mastered, so it won't appear as often."
- "Forgotten one? Tap to reset it and it'll start showing up again."

---

## 4. First Time in Kotoba Dojo

Trigger: Player opens the Kotoba Dojo for the first time.
Format: Banner tips (shown gradually, not all at once).

- "Words unlock as you learn their characters. Keep practising kana and new words will appear here."
- "Tap a word to see its reading and meaning. Mastered words have a gold bar."

---

## 5. First Unlock Milestone

Trigger: Player unlocks enough characters that words become available for the first time.

- "New characters unlocked! Keep going and they'll start showing up in words."

---

## 6. Demo Mode

Trigger: Guest visits the demo dojo or home screens.

### Demo Kana Dojo

- "This is the Kana Dojo: your progress map for every character. Warmer colours mean stronger mastery."
- "Poke around freely, nothing is saved in the demo."

### Demo Kotoba Dojo

- "The Kotoba Dojo tracks words by JLPT level. They unlock as you practise."
- "Explore freely, this is just a preview."

### Demo Home

- "This is your dashboard. Your streak calendar, stats, and leaderboard spot will live here once you have an account."

---

## 7. Home Flame Prompt

Trigger: Signed-in user on the home screen before lighting today's flame.

- "Practise at least 10m today to light a flame on your calendar. Miss a day? We'll save your streak!"

---

## Notes

- All dialogue screens use the mascot character in the bottom-left
- Text types out character-by-character (typewriter animation)
- Player can scroll up if text overflows
- Player dismisses with a "Got it" button
- Banner tips (sections 3 and 4) are simple UI banners, not dialogue overlays
- Kana first play flow: 1 (intro) then 1A (mode) then trial round then 1B (settings) then real practice
- Kotoba first play has one dialogue screen: section 2
- If the player switches mode later, the new mode's 1A dialogue plays once at that point
- The trial round runs immediately after the 1A dialogue dismisses
- Section 1B plays after the trial round completes, before real practice begins
- Word-set sizes are deliberately described as "small sets" in dialogue so the
  copy stays true if level sizes change in the data
