# LangTap - Content

Version 1.1 | April 2026
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

### 2.1 Word Bank Source: JMDict JSON Files

The word bank is sourced from five JSON files derived from JMDict, one per JLPT level.
These are the primary and sole source for the word bank build pipeline.

**Files:** `n5.json`, `n4.json`, `n3.json`, `n2.json`, `n1.json`
**Location:** Committed to the repo at `scripts/source/jmdict/`

Each file is an array of objects with the following structure:

```json
{
  "jmdict_seq": "1234567",
  "kana": "いぬ",
  "kanji": "犬",
  "waller_definition": "dog"
}
```

| File | Entry count |
|---|---|
| n5.json | TBC on commit |
| n4.json | TBC on commit |
| n3.json | TBC on commit |
| n2.json | TBC on commit |
| n1.json | 3,427 |

**Field notes:**
- `jmdict_seq` is a stable unique identifier from the JMDict database. It serves as the word ID directly — no sequential ID generation needed.
- `kana` is always present and clean. No stripping required.
- `kanji` may be an empty string for pure kana words (e.g. adverbs, particles). Treat empty string as null.
- `waller_definition` is already a short, clean English definition. No stripping required.
- The JLPT level is known from which file the entry came from.

**Attribution:**
Data derived from JMDict. JMDict is made available under a Creative Commons Attribution-ShareAlike Licence. Attribution required on the credits screen.

**The Jisho Excel file** (`scripts/source/jisho-jlpt-words.xlsx`) is retained in the repo as a reference and cross-check resource only. It is not part of the active build pipeline. See Future Backlog in LangTap_Sprints.md for the optional cross-reference task.

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
    progression-groups.ts  # Unlocking group definitions (see GAME_DESIGN.md Section 4.3)
  words/
    n5.ts                 # N5 word bank (generated)
    n4.ts                 # N4 word bank (generated)
    n3.ts                 # N3 word bank (generated)
    n2.ts                 # N2 word bank (generated)
    n1.ts                 # N1 word bank (generated)
    index.ts              # Re-exports all banks, keyed by JLPT level
    kotoba-levels.ts      # Aggregator: imports and re-exports all level sets
    kotoba-levels/        # Per-JLPT Kotoba level definitions
      types.ts            # KotobaLevel, KotobaLevelSet types
      index.ts            # Re-exports all level sets and types
      categories/         # Thematic word categories (review stage, not code)
        n5.md             # N5 categories (684 words, 49 categories)
        n4.md             # N4 categories (640 words, 57 categories)
        n3.md             # N3 categories (1,717 words, 108 categories)
        n2.md             # N2 categories (1,776 words, 136 categories)
        n1.md             # N1 categories (3,426 words, 151 categories)
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
  stage: 'seion' | 'dakuon' | 'combination'
  romaji: string        // primary romaji, e.g. "a", "ka", "shi"
  row: string           // consonant row, e.g. "ka", "kya", "fa"
  column: string        // vowel column, e.g. "a", "i", "u", "e", "o"
}
```

The `id` field is used as the key for mastery scores, word counter lookups,
unlock state, and audio manifest entries. It must be stable and never change
once assigned.

**Naming convention for IDs:**
- Hiragana: `h-{romaji}` e.g. `h-a`, `h-ka`, `h-shi`, `h-kya`
- Katakana: `k-{romaji}` e.g. `k-a`, `k-ka`, `k-shi`, `k-kya`
- Extended katakana with alt ID: `k-{altRomaji}` e.g. `k-uxo` (ウォ), `k-dhi` (ディ)
- Sokuon: `h-sokuon`, `k-sokuon`
- Long vowel mark: `k-longvowel`

**Character count:** 234 total (46+46 seion, 25+25+5 dakuon, 33+33+18 combination, 3 special).

**Stage renamed:** The third stage was renamed from `'yoon'` to `'combination'`
because it now includes extended katakana combinations (fa, wi, tsa, ti, di,
she, che, je) beyond traditional yoon.

**Extended katakana combinations (katakana only):**
- fa row: ファ フィ フェ フォ
- wi row: ウィ ウェ ウォ
- tsa row: ツァ ツィ ツェ ツォ
- ti row: ティ トゥ
- di row: ディ ドゥ
- she/che/je: シェ チェ ジェ

**Vu row (katakana dakuon):** ヴァ ヴィ ヴ ヴェ ヴォ

**Display grouping for dojo and onboarding:** Extended characters are shown
in 4 custom rows below the traditional yoon grid, under an "Extended" label:
1. ヴァ ヴィ ヴ ヴェ ヴォ (va vi vu ve vo)
2. ファ フィ フェ フォ (fa fi fe fo)
3. ティ ディ トゥ ドゥ チェ (ti di twu dwu che)
4. ウィ ウェ ウォ シェ ジェ (wi we wo she je)

### 4.1 Special Characters: Sokuon and Long Vowel Mark

These two characters are in the character dataset but are excluded from the
Dojo display for now. They participate in word decomposition (the build script
maps っ/ッ to sokuon IDs and ー to longvowel ID) and gate words containing them.

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

## 5. Romaji Input

LangTap uses Hepburn romanization exclusively. Each character has a single
accepted romaji input stored in the `romaji` field of its character object
in `data/kana/characters.ts`. No variant map is needed.

This decision targets English-speaking learners. Hepburn is the most intuitive
system for English speakers (shi, chi, tsu, fu) and avoids confusion from
alternative romanizations (si, ti, tu, hu).

The game window builds cumulative romaji breakpoints from the character data
and compares user input directly. No separate romaji engine is required.

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
- Every seion, dakuon, and combination character must have a mnemonic before the
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
  id: string              // jmdict_seq from source JSON, e.g. "1234567"
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
  id: '1469800',
  kana: 'いぬ',
  kanji: '犬',
  meaning: 'dog',
  jlptLevel: 'N5',
  characterIds: ['hira-i', 'hira-nu'],
  audioFile: null,
}
```

### 7.1 Word Bank Build Process

The word bank is generated from the JMDict JSON files using a build script.
Do not hand-write word bank entries. Do not spend session time manually building
the word bank. This is a one-time automated content pipeline, not application code.

**Build pipeline:**
1. Source files are in the repo at `scripts/source/jmdict/`. No download required.
2. Run `scripts/build-word-bank.ts` which:
   - Reads each JSON file (`n5.json` through `n1.json`)
   - Maps `jmdict_seq` to `id`, `kana` to `kana`, `kanji` (empty string to null) to `kanji`, `waller_definition` to `meaning`
   - Checks `scripts/meaning-overrides.json` for manual overrides (keyed by `id:kana`). Overrides take priority over the raw JMDict definition.
   - Applies `transformMeaning()`: strips denied bracket labels (honorable, humble, etc.) and replaces with natural register tags (Polite, Formal, Casual). Removes grammar metadata brackets (uk, abbr, n, vs). Applies sentence case.
   - Applies the JLPT level from the source filename
   - Applies all filtering rules from Section 7.3
   - Generates `characterIds` by mapping each kana character in the `kana` field to its ID in `data/kana/characters.ts`
   - Outputs a katakana word count per level to the console for review
   - Writes the output to `data/words/n5.ts`, `data/words/n4.ts`, etc.
3. Run the word bank validation test suite to confirm schema integrity.
4. Commit the generated files. They are static from this point forward.

Word bank files are committed to the repo and never regenerated unless a deliberate
content update sprint is planned. The AI must never regenerate or modify word bank
files during a coding sprint without explicit instruction from the owner.

### 7.2 Word Bank Size Reference

| Level | Source words (JSON) | After filtering | Categories | Kotoba levels |
|---|---|---|---|---|
| N5 | 684 | 684 | 49 | 57 levels |
| N4 | 640 | 640 | 57 | 54 levels (last has 4) |
| N3 | 1,730 | 1,717 | 108 | 144 levels (last has 1) |
| N2 | 1,812 | 1,776 | 136 | 148 levels |
| N1 | 3,427 | 3,426 | 151 | 286 levels (last has 6) |

Filtering only rejects entries with empty meanings or unmappable characters.
No minimum length filter or kana deduplication is applied.

### 7.3 Word Bank Filtering Rules

The build script applies these filters automatically:
- Entry must have a kana reading.
- Entry must have at least one English meaning.
- Entry must decompose into known kana characters from `data/kana/characters.ts`.

Words with the same kana reading but different kanji are kept as separate entries
(e.g. あつい 暑い "hot weather" and あつい 熱い "hot to touch" are different words).
Single-character words (e.g. き 木 "tree", め 目 "eye") are included. In Kana Mode
they produce a quick prompt; in Kotoba Mode they are valid vocabulary with distinct
kanji meanings.

### 7.4 Meaning Conventions

All English meanings follow these rules:

- **Sentence case:** Every meaning starts with an uppercase letter. "To meet",
  "Blue (noun)", not "to meet", "blue (noun)".
- **Standard form has no tag:** The most common/standard word keeps the bare
  meaning. Only variants get a bracket tag to the right: "Yes" for はい,
  "Yes (Casual)" for ええ.
- **Natural register tags:** (Polite), (Formal), (Casual), (Slang), (Archaic),
  (Feminine), (Masculine). Never (honorable), (humble), (hum), (pol), (col).
- **No grammar metadata:** (n), (vs), (vt), (vi), (uk), (abbr) are stripped
  during build. Users don't need part-of-speech labels.
- **No exact duplicates:** Every word within a JLPT level has a unique meaning
  string. The audit script (`scripts/audit-word-meanings.ts`) verifies this.
- **Overrides file:** `scripts/meaning-overrides.json` contains ~200 manual
  meaning overrides keyed by `id:kana`. The build script checks overrides
  before applying the mechanical transform.

**Katakana-only words** are not filtered by JLPT level. All katakana-only words from
all source files are included regardless of their assigned level, because loanwords
do not carry the same vocabulary difficulty as native Japanese words.

**Kana Mode word selection behaviour:**
In Kana Mode the entire word bank across all levels is available as the selection pool.
The user's `kotoba_jlpt_level` sets the preferred starting level. Words at that level
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
| Source | VOICEVOX (pre-generated locally) |
| URL | https://voicevox.hiroshiba.jp |
| Licence | Free and open source. Voice character terms apply. |
| Format | MP3 |
| Coverage | Full - covers all words including pure kana words |
| Phase | Sprint 10 - Audio Integration |
| Attribution | To be confirmed per chosen voice character before Sprint 10 |

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

**Word data:**
> Vocabulary data derived from JMDict (https://www.edrdg.org/jmdict/j_jdict.html).
> JMDict is made available under a Creative Commons Attribution-ShareAlike Licence (CC BY-SA).

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

## 11. Kotoba Level Design Principles

Kotoba levels are the curriculum layer on top of the word bank. Each JLPT level's
words are split into levels of exactly 12 words. Levels are paired under headings
("Levels 1-2", "Levels 3-4", etc.) in the Kotoba Dojo UI. The level structure
lives in `data/words/kotoba-levels.ts`.

### 11.1 Thematic Grouping

Every level must feel like a lesson, not a random list. Words in a level share a
clear theme that a learner would recognise: "Family", "Food and Drink", "Time",
"Colours", "At the Office", etc.

**Two-stage process (categorise first, then build levels):**

1. **Stage 1: Categorise.** Go through ALL words in the JLPT level and tag each
   with a theme category. Search the full pool for each theme, not just the next
   chunk in alphabetical order. Output: a list of theme categories with word
   counts. Categories with 24+ words will become multiple levels. Categories with
   fewer than 12 can be merged with related categories.

2. **Stage 2: Build levels.** Take each category and split into levels of 12.
   If a category has leftover words (e.g. 15 words = 1 level + 3 extras),
   redistribute extras into related categories. Use the helper script
   (`scripts/kotoba-level-helper.ts add`) to validate each level before writing
   (prevents duplicates and invalid IDs). Show the theme name and all 12 English
   meanings before adding so the owner can spot check.

**Why two stages:** Reading words sequentially and grouping as you go produces
good early levels but degrades as the remaining pool becomes random leftovers.
Categorising first ensures every word is placed by theme, not by position in the
word list.

Rules for thematic grouping:
- Each level has exactly 12 words. No exceptions.
- Every word in the JLPT level must appear in exactly one Kotoba level. No gaps,
  no duplicates.
- If the word count does not divide evenly by 12, a small number of words may be
  left unassigned. Unassigned words should be carried forward and assigned to the
  next JLPT level's Kotoba levels where they fit thematically (e.g. unassigned
  N4 words can be placed into N3 levels).
- Themes should be concrete and nameable. If you cannot name the theme in 3 words
  or fewer, the grouping is too loose.
- Prefer grouping nouns with related adjectives and verbs. "Food and Drink" can
  include "delicious" and "to eat" alongside "bread" and "rice".
- When a word fits multiple themes equally well, place it in the theme that has
  fewer words (balance first).

### 11.2 Level Ordering

Levels are ordered from most fundamental to most specialised:
- Early levels (1-6): core survival vocabulary (greetings, numbers, family, time,
  food, directions).
- Middle levels: daily life topics (transport, shopping, weather, school, home).
- Later levels: abstract and specialised topics (emotions, opinions, formal
  language, technical terms).

This ordering means a new player who works through levels sequentially encounters
the most useful words first.

### 11.3 Level Naming

Each level has a short theme label (max 25 characters) used in the Dojo UI.
Examples: "Greetings", "Family", "Numbers", "Food and Drink", "At School".
Labels are stored alongside the level data and displayed as the level group
heading.

### 11.4 Cross-Language Applicability

This level design system applies to all future languages added to LangTap, not
just Japanese. When expanding to a new language:
- Use the same 12-words-per-level structure.
- Apply the same thematic grouping rules.
- Follow the same ordering principle (fundamental to specialised).
- Use the same frequency tier system (see Section 13) to split the word bank
  into 5 tiers equivalent to N5-N1.
- Theme labels should be consistent across languages where possible. If Japanese
  has a "Family" level and Thai has equivalent family vocabulary, use the same
  label. This keeps the product experience consistent.

---

## 12. Content Roadmap by Phase

| Phase | Content required |
|---|---|
| Phase 1 - Kana | Full kana character dataset, N5 word bank (minimum 600 words after filtering), VOICEVOX audio for N5 words, mnemonics for all seion (dakuon and combination mnemonics before those stages ship), lo-fi music tracks |
| Phase 2 - Kotoba | All word banks already generated in Sprint 5. No new word data needed. VOICEVOX audio for N4-N1 words. |

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
