# LangTap - Content

Version 1.0 | April 2026
Domain: Kana character data, word banks, mnemonics, audio assets, JLPT structure.
Reference: LangTap_Planning.md Sections 5.4, 5.14, 4.
Owner document: CLAUDE.md
Related: docs/GAME_DESIGN.md (how this data is used by the engine)

Read this document before working in `data/`, adding audio assets, or editing word banks.

---

## 1. Overview

LangTap's content layer has four components:

1. **Kana character data**: the full set of hiragana and katakana characters with
   their readings, romaji variants, and mnemonic strings.
2. **Word bank**: JLPT-levelled vocabulary words used during practice, each with
   kana reading, English meaning, and a list of which characters it contains.
3. **Audio assets**: pre-recorded pronunciation files for kana characters and words.
4. **Mnemonics**: short memory-aid strings shown on wrong answers.

All content is stored as static TypeScript data files in `data/`.
None of it is fetched from Supabase at runtime. It is bundled with the app.
Supabase stores only user state (mastery scores, word counters, profile).

---

## 2. Data Sources

### 2.1 Word Bank Source: Jisho JLPT Excel File

The word bank is sourced from a pre-existing Excel file exported from Jisho.org,
already owned by the project. No external download or third-party pipeline is needed.

**File:** `JLPT_Word_List____From_Jisho_org.xlsx`
**Location:** Committed to the repo at `scripts/source/jisho-jlpt-words.xlsx`

The file contains five sheets, one per JLPT level, with the following structure:

| Sheet | Columns | Word count |
|---|---|---|
| JLPT N5 | Word, Reading, Meaning | 658 |
| JLPT N4 | Word, Reading, JLPT, Meaning | 578 |
| JLPT N3 | Word, Reading, JLPT, Meaning | 1,780 |
| JLPT N2 | Word, Reading, JLPT, Meaning | 1,804 |
| JLPT N1 | Word, Reading, JLPT, Meaning | 3,444 |

**Total source words: 8,264 across all levels.**

**Known data characteristics:**
- The Meaning field contains full Jisho definitions including grammar tags, alternate
  forms, and notes (e.g. `[Godan verb] 1. to meet; to encounter...`). The build script
  must strip this to the first clean definition only.
- Some entries appear in multiple sheets (e.g. an N5 word also listed in N4).
  The build script must deduplicate, keeping each word at its lowest JLPT level.
- Katakana-only words (loanwords) are present across all levels but sparse at higher
  levels. See Section 7.3 for the relaxed filter rule that applies to these.

**Attribution:**
Data sourced from Jisho.org. Jisho is a free Japanese dictionary. No licence
restriction applies to use of vocabulary data for educational software.
No attribution is required on the credits screen for this source.

### 2.2 Word Audio: VOICEVOX (Pre-generated)

Audio files are generated locally using VOICEVOX on the developer's Mac and
committed to the repository as static files. The app serves them directly.
VOICEVOX never runs in production. No API calls at runtime. No cost per user.

VOICEVOX: https://voicevox.hiroshiba.jp
Licence: Free and open source. Each voice character has its own terms of use.
LangTap is currently free, so attribution-required characters are acceptable.

**How it works:**
1. Open VOICEVOX on the developer's Mac (runs local server on port 50021).
2. Run the build script: `scripts/generate-audio.ts`.
3. Script calls the local VOICEVOX API for every word in the word bank.
4. Audio files saved to `public/audio/words/` as MP3.
5. Commit the audio files to the repo.
6. Deployed app serves them as static files.

**Voice character selection (Sprint 10):**
Pick one consistent voice for all words. Choose a character whose terms permit
use in a free application with attribution. Attribution goes on the credits
screen. Confirm the specific character's terms before generating audio.

**Why this approach over Google TTS or Kanji Alive:**
- VOICEVOX voices are specifically designed for Japanese and sound more natural
  than WaveNet for the language.
- Pre-generation means zero runtime cost and zero latency on playback.
- Audio files are committed to the repo so the app has no external dependency.
- Kanji Alive only covers words attached to a kanji. Pure kana words get full
  coverage with VOICEVOX.

**Coverage gap resolution:**
The pure kana word gap identified in the Kanji Alive audit is fully solved.
VOICEVOX generates audio for any Japanese text including pure kana words.

**When this runs:** Sprint 10 - Audio Integration.

### 2.3 Lo-Fi Background Music: Free Music Archive

Source: https://freemusicarchive.org
Required licence: CC BY or CC0 only.
CC BY-NC is not suitable once the paid membership tier is activated.
Curate 3-5 tracks. Confirm licence on each track individually before use.
Document each track's title, artist, and licence in Section 8 of this document.

---

## 3. Folder Structure

```
data/
  kana/
    characters.ts         # Full kana character dataset (see Section 4)
    mnemonics.ts          # Mnemonic string per character (see Section 6)
    romajiVariants.ts     # All accepted romaji inputs per character (see Section 5)
    progressionGroups.ts  # Unlocking group definitions (see GAME_DESIGN.md Section 4.3)
  words/
    n5.ts                 # N5 word bank
    n4.ts                 # N4 word bank
    n3.ts                 # N3 word bank
    n2.ts                 # N2 word bank
    n1.ts                 # N1 word bank
    index.ts              # Re-exports all banks, keyed by JLPT level
  audio/
    word-manifest.ts      # Maps each word ID to its audio file path

public/
  audio/
    words/                # Word audio files (.ogg/.mp3)
    lofi/                 # Lo-fi background music files
```

---

## 4. Kana Character Data Schema

Every kana character is a typed object. The schema is the single source of truth
for character identity across the entire app.

```ts
// data/kana/characters.ts

type KanaCharacter = {
  id: string            // unique identifier, e.g. "hira-a", "kata-ka", "hira-shi"
  kana: string          // the character itself: "あ", "ア", "し"
  script: 'hiragana' | 'katakana'
  stage: 'seion' | 'dakuon' | 'yoon'
  groupIndex: number    // which group within the stage (1-based)
  romaji: string        // primary romaji, e.g. "a", "ka", "shi"
  audioFile: string     // filename in public/audio/kana/, e.g. "hira-a.ogg"
}
```

The `id` field is used as the key for mastery scores, word counter lookups,
unlock state, and audio manifest entries. It must be stable and never change
once assigned.

**Naming convention for IDs:**
- Hiragana seion: `hira-{romaji}` e.g. `hira-a`, `hira-ka`, `hira-shi`
- Katakana seion: `kata-{romaji}` e.g. `kata-a`, `kata-ka`, `kata-shi`
- Hiragana dakuon: `hira-d-{romaji}` e.g. `hira-d-ga`, `hira-d-ji`
- Katakana dakuon: `kata-d-{romaji}` e.g. `kata-d-ga`, `kata-d-ji`
- Hiragana yoon: `hira-y-{romaji}` e.g. `hira-y-kya`, `hira-y-shu`
- Katakana yoon: `kata-y-{romaji}` e.g. `kata-y-kya`, `kata-y-shu`
- Sokuon hiragana: `hira-sokuon`
- Sokuon katakana: `kata-sokuon`
- Long vowel mark: `kata-longvowel`

### 4.1 Special Characters: Sokuon and Long Vowel Mark

These two characters are full members of the character set. They appear in the
Dojo with their own progress bars, have individual mastery scores, go through the
same 5-correct-answer unlock threshold, and gate any word containing them until
unlocked.

**Sokuon (っ / ッ)**

The sokuon represents a geminate consonant (a doubled consonant). It is never
typed in isolation. In romaji input it manifests as a doubled consonant within
the surrounding word: "shitte" for しって (し + っ + て).

Because the sokuon has no standalone romaji, its mastery score is incremented
when the user correctly types the sokuon position in a word on the first attempt.
The engine tracks each character position in the word independently and awards
or withholds a point for the sokuon position using the same per-character
first-attempt scoring rules as every other character.

In Tap mode, the sokuon has its own button (っ or ッ depending on the word).
Tapping it at the correct position is a valid first-attempt correct answer.

IDs: `hira-sokuon`, `kata-sokuon`
Romaji input: no standalone input. Position is validated contextually via the
doubled consonant in the full word romaji string.
Progression stage: Seion (introduced with the final seion group, as it appears
in common early words like きって and ざっし).

**Long vowel mark (ー)**

Katakana only. Extends the preceding vowel sound. コーヒー (koohii) for "coffee".
Hiragana does not use this character; hiragana uses repeated vowel characters
instead (おおきい for "big").

Romaji input: the hyphen key "-". This is standard Japanese IME behaviour and
is familiar to anyone who has used a Japanese keyboard layout.

In Type and Swipe modes: user types "-" at the correct position in the word.
In Tap mode: ー has its own button.

ID: `kata-longvowel`
Progression stage: Seion (introduced with the katakana seion groups, as it
appears in common katakana loanwords from the very beginning: コーヒー, スーパー).

---

## 5. Romaji Variants

Some kana characters have multiple valid romaji representations. All valid inputs
must be accepted in Type and Swipe modes.

The variant map follows the same character ID scheme as the character dataset.
Each entry is keyed by character ID, so when a user is answering a prompt, the app
already knows which character is being targeted and can look up exactly which romaji
strings are valid for that specific character. There is no ambiguity: the kana is
always known when the input is being evaluated, and vice versa.

The full variant map lives in `data/kana/romajiVariants.ts`.

```ts
// data/kana/romajiVariants.ts

// Key: character ID (from data/kana/characters.ts)
// Value: all accepted romaji strings for that character, primary first
type RomajiVariantMap = Record<string, string[]>

const romajiVariants: RomajiVariantMap = {
  // Hiragana seion with variants
  'hira-shi':      ['shi', 'si'],
  'hira-chi':      ['chi', 'ti'],
  'hira-tsu':      ['tsu', 'tu'],
  'hira-ji':       ['ji', 'zi'],
  'hira-fu':       ['fu', 'hu'],

  // Hiragana dakuon with shared sounds (ぢ and づ)
  'hira-d-ji':     ['ji', 'zi'],       // ぢ shares the ji/zi sound with じ
  'hira-d-zu':     ['zu', 'du'],       // づ shares the zu sound with ず

  // Katakana equivalents (same IDs, kata- prefix)
  'kata-shi':      ['shi', 'si'],
  'kata-chi':      ['chi', 'ti'],
  'kata-tsu':      ['tsu', 'tu'],
  'kata-ji':       ['ji', 'zi'],
  'kata-fu':       ['fu', 'hu'],
  'kata-d-ji':     ['ji', 'zi'],
  'kata-d-zu':     ['zu', 'du'],

  // Hiragana yoon with multiple valid romaji
  'hira-y-sha':    ['sha', 'sya'],
  'hira-y-shu':    ['shu', 'syu'],
  'hira-y-sho':    ['sho', 'syo'],
  'hira-y-cha':    ['cha', 'tya'],
  'hira-y-chu':    ['chu', 'tyu'],
  'hira-y-cho':    ['cho', 'tyo'],
  'hira-y-ja':     ['ja', 'jya', 'zya'],
  'hira-y-ju':     ['ju', 'jyu', 'zyu'],
  'hira-y-jo':     ['jo', 'jyo', 'zyo'],

  // Katakana yoon equivalents follow the same pattern
  'kata-y-sha':    ['sha', 'sya'],
  'kata-y-shu':    ['shu', 'syu'],
  'kata-y-sho':    ['sho', 'syo'],
  'kata-y-cha':    ['cha', 'tya'],
  'kata-y-chu':    ['chu', 'tyu'],
  'kata-y-cho':    ['cho', 'tyo'],
  'kata-y-ja':     ['ja', 'jya', 'zya'],
  'kata-y-ju':     ['ju', 'jyu', 'zyu'],
  'kata-y-jo':     ['jo', 'jyo', 'zyo'],

  // Special characters
  // Sokuon (っ/ッ) has no standalone romaji entry. Its position in a word is
  // validated contextually via the doubled consonant in the full romaji string.
  // Long vowel mark (ー) is entered with a plain hyphen.
  'kata-longvowel': ['-'],
}
```

Characters not present in this map have a single accepted romaji input, which is
the `romaji` field from their character object. The variant map only needs entries
for characters where more than one romaji string is valid.

This list must be reviewed and completed before the Type mode sprint.

---

## 6. Mnemonics

Mnemonics are short strings that help users remember a character's sound.
They are shown on wrong answers (if enabled in settings).
They live in `data/kana/mnemonics.ts`.

```ts
// data/kana/mnemonics.ts

type MnemonicMap = Record<string, string>
// key: character ID, value: mnemonic string (max ~80 characters)

const mnemonics: MnemonicMap = {
  'hira-a':   'Looks like the letter A with a stroke through it',
  'hira-i':   'Two strokes, like two people saying "I"',
  'hira-u':   'Like a bent U',
  'hira-e':   'Three strokes like a fence, eh?',
  'hira-o':   'Looks like a backwards 6, the 6th vowel if you count romaji',
  'hira-ka':  'A crow calling KA (wing and a beak)',
  'hira-ki':  'Like a key, ki for key',
  'hira-ku':  'Like a sock, ku for... well, socks need imagination',
  'hira-ke':  'Looks like a comb (ke-mb)',
  'hira-ko':  'Like a backward C and a hook, ko',
  // ... continues for all characters
}
```

**Mnemonic writing guidelines:**
- Maximum 80 characters per mnemonic.
- Visual mnemonics (what the character looks like) work best.
- Sound mnemonics (a word that sounds like the reading) are secondary.
- Keep the language simple; these users are beginners.
- Avoid mnemonics that require cultural knowledge the user may not have.
- Every seion, dakuon, and yoon character must have a mnemonic before the
  wrong-answer feedback feature ships. No gaps allowed.

**Sources for mnemonic inspiration:**
- Dr. Moku (https://www.drmoku.com): visual mnemonics for kana. Check licence
  before copying any text directly; write originals inspired by the approach)
- Community mnemonics from WaniKani forums (inspiration only, not direct copying)
- Original mnemonics written for LangTap

---

## 7. Word Bank Schema

Each entry in the word bank is a typed object.

```ts
// data/words/n5.ts (and n4, n3, n2, n1)

type WordBankEntry = {
  id: string              // unique stable identifier, e.g. "n5-001"
  kana: string            // full kana reading: "いぬ", "がっこう"
  kanji: string | null    // kanji form if applicable: "犬", "学校" (null if kana-only)
  meaning: string         // English meaning shown after correct answer: "dog", "school"
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  characterIds: string[]  // IDs of every kana character in this word (for filtering)
  audioFile: string | null // path to audio file if available, null if not yet sourced
}
```

The `characterIds` array is critical. It is used by the selection algorithm to
filter words that contain locked characters (see GAME_DESIGN.md Section 4.7).
It must include every distinct character in the `kana` field.

**Example:**
```ts
{
  id: 'n5-001',
  kana: 'いぬ',
  kanji: '犬',
  meaning: 'dog',
  jlptLevel: 'N5',
  characterIds: ['hira-i', 'hira-nu'],
  audioFile: null,
}
```

### 7.1 Word Bank Build Process

The word bank is generated from the Jisho JLPT Excel file using a build script.
Do not hand-write word bank entries. Do not spend session time manually building
the word bank. This is a one-time automated content pipeline, not application code.

**Build pipeline:**
1. Source file is already in the repo at `scripts/source/jisho-jlpt-words.xlsx`.
   No download required.
2. Run `scripts/build-word-bank.ts` which:
   - Reads all five sheets from the Excel file
   - Deduplicates entries, keeping each word at its lowest JLPT level
   - Strips the Meaning field to the first clean definition (text before the first
     `|` or `[` character, trimmed)
   - Applies all filtering rules from Section 7.3
   - Generates `characterIds` by mapping each kana character in the Reading field
     to its ID in `data/kana/characters.ts`
   - Assigns stable sequential IDs (`n5-001`, `n5-002`, etc.)
   - Outputs a katakana word count per level to the console for review
   - Writes the output to `data/words/n5.ts`, `data/words/n4.ts`, etc.
3. Run the word bank validation test suite to confirm schema integrity.
4. Commit the generated files. They are static from this point forward.

Word bank files are committed to the repo and never regenerated unless a deliberate
content update sprint is planned. The AI must never regenerate or modify word bank
files during a coding sprint without explicit instruction from the owner.

### 7.2 Word Bank Size Reference

| Level | Source words (Excel file) | Expected after filtering |
|---|---|---|
| N5 | 658 | ~600 |
| N4 | 578 | ~500 |
| N3 | 1,780 | ~1,600 |
| N2 | 1,804 | ~1,600 |
| N1 | 3,444 | ~3,000 |

**Katakana-only words by level (pure loanwords in the source file):**

| Level | Katakana-only words |
|---|---|
| N5 | 65 |
| N4 | 42 |
| N3 | 107 |
| N2 | 134 |
| N1 | 210 |

Katakana word counts are low at early levels relative to the total pool. This is
expected and is addressed by the relaxed katakana filter rule in Section 7.3.
The build script must output these counts to the console so coverage can be
confirmed after each run.

### 7.3 Word Bank Filtering Rules

The build script applies these filters automatically:
- Entry must have a kana reading.
- Entry must have at least one English meaning.
- Minimum word length: 2 kana characters.
- Proper nouns are excluded.
- Entries with only kanji and no kana reading are excluded.
- Deduplicate across levels: keep each word at its lowest JLPT level only.

**Relaxed filter for katakana-only words:**
Katakana-only words (pure loanwords where every character in the Reading field is
katakana or the long vowel mark ー) are not filtered by JLPT level. All katakana-only
words from all sheets are included in the word bank regardless of their assigned level.
This is because loanwords do not carry vocabulary difficulty in the same way native
Japanese words do, and early katakana character groups have very few eligible words
without this relaxation.

Analysis of the source file confirms the problem at early unlock stages:
- Group 1K unlocked only (ア イ ウ エ オ カ キ ク ケ コ): 2 eligible katakana words
  (ケーキ, カー). Without relaxation these two words repeat constantly.
- Group 1K + 2K unlocked (adding サ-ト): 29 eligible words. Workable variety.
- The window of dangerously thin pool is short but real. Relaxing the JLPT filter
  for katakana-only words costs nothing and solves it entirely.

**Kana Mode word selection behaviour:**
In Kana Mode the entire word bank across all levels is available as the selection pool.
The user's `kanji_jlpt_level` sets the preferred starting level. Words at that level
are prioritised first. When all eligible words at the preferred level have hit counter 5,
selection spills to all other levels. When all words across all levels are at counter 5,
counters reset and the cycle begins again. JLPT level is never a hard filter in Kana Mode.
See GAME_DESIGN.md Section 5.2 for the full algorithm.

---

## 8. Audio Asset Inventory

This section tracks the status of every audio asset category.
Update this section as assets are sourced and integrated.

### 8.1 Word Audio

Audio is played at the word level, not the character level. When a user answers
incorrectly, they hear the full practice word, not the isolated character sound.
This provides phonetic context and is more natural than isolated phoneme playback.

| Status | Details |
|---|---|
| Source | Kanji Alive audio dataset |
| URL | https://github.com/kanjialive/kanji-data-media |
| Licence | CC BY 4.0 |
| Format | Opus, AAC, OGG, MP3 |
| Coverage | 10,187 files covering 1,235 kanji and compound words |
| Phase | Phase 1 onwards. Integrate during the audio sprint in Sprint 10. |
| Attribution text | To be confirmed with Kanji Alive before use; add to credits screen |
| Gap note | The Kanji Alive dataset covers kanji compound words. Some kana-only N5 words may not have coverage. Document any gaps during the audio sprint and decide per gap: omit audio for that word, or source a compatible alternative. |

### 8.2 Lo-Fi Background Music

| Track | Artist | Licence | Source URL | Status |
|---|---|---|---|---|
| TBD | TBD | TBD | Free Music Archive | Not yet sourced |

Action: Curate 3-5 tracks from https://freemusicarchive.org with CC BY or CC0 licence.
Confirm licence on each track individually. Populate this table before Sprint 2.

---

## 9. Credits Screen Requirements

The app must include a credits screen listing all third-party content.
The screen is part of the Profile section (or accessible from a settings link).

Required attributions at Phase 1 launch:

**Word audio:**
> Word pronunciation audio generated using VOICEVOX (https://voicevox.hiroshiba.jp).
> Voice character licence and attribution text to be confirmed before Sprint 10.

**Lo-fi music:**
> [Track titles, artists, and licences to be added when tracks are selected]

---

## 10. Content Maintenance Rules

- Never edit word bank files directly in a coding session without the owner's approval.
  Word bank changes affect game balance and should be reviewed.
- Never remove a character from `characters.ts` without checking every word bank file
  for references to that character's ID. Removing a character ID that appears in
  `characterIds` arrays will break the selection algorithm.
- When adding new characters (e.g. for Phase 3 kanji), always assign a new unique ID.
  Never reuse an ID that has been used before, even if the original character was removed.
- Audio files must be committed to the repo in `public/audio/`. Do not link to external
  hosting for game audio. External links can go dead.
- All content changes must be logged in CHANGELOG.md with the date and what changed.
- Never use em-dashes in any user-facing text, mnemonic strings, meaning fields, or UI
  copy. Use a plain hyphen, a colon, or rewrite the sentence. Em-dashes give an
  AI-generated feel to written content and must be avoided throughout the project.

---

## 11. Content Roadmap by Phase

| Phase | Content required |
|---|---|
| Phase 1 - Kana | Full kana character dataset, N5 word bank (minimum 600 words), VOICEVOX audio for N5 words, mnemonics for all seion (dakuon and yoon mnemonics before those stages ship), lo-fi music tracks |
| Phase 2 - Kotoba | All word banks already generated in Sprint 5. No new word data needed. VOICEVOX audio for N4-N1 words. |
| Phase 3 - Kanji | Kanji bank derived from word bank (see Section 11.1). Kanji mnemonics. VOICEVOX audio already covers kanji compound words. |
| Phase 4 - Kanji Kotoba | No new content pipeline needed. Uses existing word bank and kanji bank. |

### 11.1 Kanji Bank: Derived from Word Bank

The kanji bank for Phase 3 does not require any external source or new pipeline.
It is derived directly from the word bank generated in Sprint 5.

**Derivation logic:**
- Filter all word bank entries where `kanji` field is not null.
- Each unique kanji character found across those entries becomes a kanji bank entry.
- Group by `jlptLevel` from the parent word bank entry.
- The kanji bank is generated by a separate script: `scripts/build-kanji-bank.ts`.
- This script reads the already-committed word bank TypeScript files, not the Excel file.

**What this gives us:**
- Every kanji that appears in a JLPT-levelled word we already teach.
- Readings come from the kana field of the parent word.
- English meanings come from the meaning field of the parent word.
- JLPT level is inherited from the word.
- No third-party kanji dataset, no external download, no licence concerns.

This script is created during the Phase 3 kanji content sprint, not Sprint 5.
The word bank files must be committed and stable before this script is written.

---

## 12. Pricing Tiers

Pricing is displayed on the landing page and enforced by the game engine in Phase 2
when Stripe is activated. In Phase 1 the tiers are displayed but not enforced.

| Tier | Price | Daily distance limit | Notes |
|---|---|---|---|
| Free | $0 / month | 50m per day | Default for all new accounts |
| Regular | $3 / month | 300m per day | Stripe subscription, Phase 2 |
| Unlimited | $5 / month | No limit | Stripe subscription, Phase 2 |

Daily distance resets at midnight in the user's local timezone.
The limit applies to cumulative session distance across all game modes combined.
When the limit is reached, the practice screen shows a friendly message and a
CTA to upgrade. It does not block the app entirely - the user can still visit
the Dojo, Leaderboard, and Profile.

In Phase 1 no limits are enforced. All users have unlimited access for the
duration of the beta period. The pricing cards on the landing page show
"Coming soon" on paid tiers.

---

## 13. Future Language Expansion

LangTap is built for Japanese first. The architecture is designed to support
additional languages in a future phase. See the "Additional language support" task
in the Future Backlog in LangTap_Sprints.md.

**Word bank strategy for non-Japanese languages:**

Non-Japanese languages do not have an equivalent of JLPT levels. The agreed approach
is to use frequency lists, which are widely available for most major languages. The
frequency list is split into 5 tiers to mirror the N5-N1 structure the app is built
around, keeping the data schema and selection algorithm unchanged.

Suggested tier cutoffs (to be validated per language when the time comes):
- Level 1 (equivalent N5): top 500 words
- Level 2 (equivalent N4): words 501-1,500
- Level 3 (equivalent N3): words 1,501-4,000
- Level 4 (equivalent N2): words 4,001-8,000
- Level 5 (equivalent N1): words 8,001+

Level labels in the UI will use "Level 1-5" or "Beginner-Advanced" rather than
N5-N1 for non-Japanese languages. The underlying schema field names are unchanged.

Frequency list sources to evaluate at the time: Leipzig Corpora Collection, Wiktionary
frequency lists, Hermit Dave's frequency lists. Ensure any chosen source has a licence
compatible with commercial use before committing.

**The NLT 1.40 frequency list was evaluated and rejected** for LangTap's use. It is
a Japanese corpus list (Tsukuba Web Corpus) with no English meanings, entries dominated
by particles and grammatical function words, and a licence restricting use to research
and educational purposes only with redistribution prohibited. It is not suitable for
Japanese or any other language in this project.


*This document is the authoritative reference for all content data.*
*If a data file conflicts with this document, the document wins.*
*Update this document before adding or changing any content assets.*
