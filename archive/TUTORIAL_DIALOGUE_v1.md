# Tutorial Dialogue Scripts

Version 1.0 | May 2026

These are the dialogue scripts for Sprint 7B's tutorial and guidance system.
Each section is a trigger point with its messages. Messages are delivered via
the Pokemon-style typewriter overlay with the mascot character.

Edit the wording here. The implementation will read from this document.

---

## 1. First Kana Practice Session

Trigger: Player lands on the kana practice screen for the first time.

- "Welcome to LangTap, an app built to help you master typing and using a keyboard in a new language."
- "Japanese has two phonetic alphabets: hiragana and katakana. Same sounds, different characters. You'll learn both."
- "We'll start with hiragana, then introduce the katakana version of each group, so you learn them side by side."
- "Characters are unlocked in consonant groups. You'll start with just a five."
- "Get it right on the first try to earn distnace (mastery points). The more you master a character, the less you see it."
- "Characters you struggle with show up more often. The game adapts to your learning."
- "You need to get the correct answer before you can move on. If you're stuck, we'll show you the answer after three attempts."
- "You won't earn points for a corrected answer, but you're still learning."
- "Once enough characters are unlocked, they'll start appearing in real Japanese words, which builds your reading skill."
- "The English meaning appears after each word. Tap anywhere to continue, or wait and it'll advance for you."
- "The course progresses for you. All you need to do is play and be gently persistent."

## 1A. Mode Introduction (second dialogue, immediately after section 1)

Trigger: Plays as a separate dialogue screen right after the intro dismisses.
Content varies by the player's selected input mode.

### Tap Mode

- "Tap the matching character on the grid to answer. Simple as that!"
- "Let's do a trial. We'll show you three hiragana characters and then one word they appear in, so you can give this a try. After that, you start for real."

### Swipe Mode

- "Swipe mode uses the Japanese swipe keyboard."
- "Turn off auto-suggestion in your keyboard settings."
- "The keyboard only shows hiragana. To answer in katakana, just type the hiragana equivalent."
- "For example, if the screen shows カ (katakana ka), swipe か (hiragana ka) and the keyboard will suggest the katakana."
- "Let's do a trial. We'll show you three hiragana characters and then one word they appear in, so you can give this a try. After that, you start for real."

### Type Mode

- "Type mode uses your physical keyboard."
- "Type the romaji (English letters) for each character. For example, あ is 'a', き is 'ki', し is 'shi'."
- "Some characters use Hepburn spelling: し is 'shi' (not 'si'), ち is 'chi' (not 'ti'), つ is 'tsu' (not 'tu')."
- "Let's do a trial. We'll show you three hiragana characters and then one word they appear in, so you can give this a try. After that, you start for real."

## 1B. After First Kana Practice (second dialogue, after trial round completes)

Trigger: Plays after the tutorial trial round finishes.

- "Before you dive in, here are a few things you can change in Settings."
- "You can change how prompts are shown in Settings: alternate between kana and romaji, or stick to kana only."
- "You can also turn off auto-speaking the word, change the pacing, turn hints off, or turn on click sounds to mimic a keyboard."
- "In your Profile, you'll be able to change the theme and font style (coming soon)."

---

## 2. First Kotoba Practice Session

Trigger: Player lands on the kotoba practice screen for the first time.
Note: No need to repeat general game mechanics since onboarding sends players to kana first.

### Tap Mode

- "Welcome to Kotoba. Here you practise real Japanese words."
- "You can answer in kana by tapping the correct reading on the grid."
- "Or you can select the correct kanji word from the options we show you."
- "Kanji answers earn 4x the mastery points, so you'll progress faster if you recognise the kanji."

### Type Mode

- "Welcome to Kotoba. Here you practise real Japanese words."
- "You can answer in kana by typing the reading with your keyboard."
- "Or you can type the reading and select the kanji from the auto-suggestions on your Japanese keyboard."
- "Kanji answers earn 4x the mastery points, so you'll progress faster if you recognise the kanji."

### Swipe Mode

- "Welcome to Kotoba. Here you practise real Japanese words."
- "You can answer in kana by swiping the reading on your keyboard."
- "Or you can swipe the reading and select the kanji from the auto-suggestions on your Japanese keyboard."
- "Kanji answers earn 4x the mastery points, so you'll progress faster if you recognise the kanji."

### General (all modes, continues after the mode-specific messages above)

- "Words are unlocked in sets of 6."
- "Once you answer enough correctly, the next set will unlock automatically."

---

## 3. First Time in Kana Dojo

Trigger: Player opens the Kana Dojo for the first time.
Format: Banner tips (shown gradually, not all at once).

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

- "New characters unlocked! Your character pool is growing. Keep going and you'll start seeing them in words soon."

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
- The trial round (3 characters + 1 word) runs immediately after the 1A dialogue dismisses
- Section 1B plays after the trial round completes, before real practice begins
