// ------------------------------------------------------------
// File: data/kana/mnemonics.ts
// Purpose: Dual mnemonic memory-aid strings for kana characters.
//          Each mnemonic links a hiragana and katakana pair through
//          a shared visual story. Shown during learning phase cards
//          (if hints enabled in settings). Keyed by romaji sound.
// Depends on: (none - pure data)
// ------------------------------------------------------------

// ── Types ─────────────────────────────────────

export type DualMnemonic = {
  sound: string
  kana: string
  text: string
}

// ── Data ──────────────────────────────────────

export const DUAL_MNEMONICS: Record<string, DualMnemonic> = {
  a: {
    sound: 'a',
    kana: 'あ ア',
    text: 'あ is an a-pple with a stem, and ア is an a-xe cutting it.',
  },
  i: {
    sound: 'i',
    kana: 'い イ',
    text: 'い is two ee-ls swimming, and イ is one eel holding another above their head.',
  },
  u: {
    sound: 'u',
    kana: 'う ウ',
    text: 'う is someone saying "Uh!" after ウ gives them an u-ppercut.',
  },
  e: {
    sound: 'e',
    kana: 'え エ',
    text: "え is an e-xotic dancer, and エ is the dancer's stage.",
  },
  o: {
    sound: 'o',
    kana: 'お オ',
    text: 'お is an o-pera singer saying "oh!" with オ as their o-pen arms.',
  },
  ka: {
    sound: 'ka',
    kana: 'か カ',
    text: "か is a ka-ite with string, and カ is the kite's sharp frame.",
  },
  ki: {
    sound: 'ki',
    kana: 'き キ',
    text: 'き is a ke-y with loops, and キ is the ke-y cut into straight lines.',
  },
  ku: {
    sound: 'ku',
    kana: 'く ク',
    text: 'く is a Ku-ckoo beak, and ク is the same bird with a cooks cap.',
  },
  ke: {
    sound: 'ke',
    kana: 'け ケ',
    text: 'け is a wooden ke-g with a tap, and ケ is the K branded onto it.',
  },
  ko: {
    sound: 'ko',
    kana: 'こ コ',
    text: 'こ is two k-oins lying flat, and コ is the k-oin box they drop into.',
  },
  sa: {
    sound: 'sa',
    kana: 'さ サ',
    text: 'さ is a sa-d face with one tear, and サ are the tear marks left behind.',
  },
  shi: {
    sound: 'shi',
    kana: 'し シ',
    text: "し is a shi-pherd's hook pulling sheep, and シ is the sheep's smiling face.",
  },
  su: {
    sound: 'su',
    kana: 'す ス',
    text: 'す is someone swinging in a loop, and ス is the Su-perman pose after they fly off.',
  },
  se: {
    sound: 'se',
    kana: 'せ セ',
    text: 'せ is a se-t of vampire teeth biting down, and セ is the bite mark they leave.',
  },
  so: {
    sound: 'so',
    kana: 'そ ソ',
    text: 'そ is so-wing thread going zigzag, and ソ is one loose thread stroke.',
  },
  ta: {
    sound: 'ta',
    kana: 'た タ',
    text: 'た is a ta-co on a plate, and タ is the folded taco shell.',
  },
  chi: {
    sound: 'chi',
    kana: 'ち チ',
    text: 'ち is a chi-erleader kicking up a leg, and チ is her star jump into the air.',
  },
  tsu: {
    sound: 'tsu',
    kana: 'つ ツ',
    text: 'つ is a tsu-nami wave, and ツ is droplets falling from the wave.',
  },
  te: {
    sound: 'te',
    kana: 'て テ',
    text: "て is a dog's tail curling up, and テ is the te-lephone pole the dog is peeing on.",
  },
  to: {
    sound: 'to',
    kana: 'と ト',
    text: 'と is a to-e with a splinter, and ト is the sharp splinter sticking out.',
  },
  na: {
    sound: 'na',
    kana: 'な ナ',
    text: 'な is a na-n praying with folded hands, and ナ is the sharp cross above the nun.',
  },
  ni: {
    sound: 'ni',
    kana: 'に ニ',
    text: 'に is a knees, and ニ are the lines on the ni-ee',
  },
  nu: {
    sound: 'nu',
    kana: 'ぬ ヌ',
    text: 'ぬ is a nu-odle loop, and ヌ is the noodle cut with chopsticks.',
  },
  ne: {
    sound: 'ne',
    kana: 'ね ネ',
    text: 'ね is a ne-rvous cat with a curved tail, and ネ is the sharp net trying to catch it.',
  },
  no: {
    sound: 'no',
    kana: 'の ノ',
    text: 'の is a no-entry loop, and ノ is one "no" slash.',
  },
  ha: {
    sound: 'ha',
    kana: 'は ハ',
    text: "は is a ha-ckey player swinging a stick, and ハ is the player's two legs on the ice.",
  },
  hi: {
    sound: 'hi',
    kana: 'ひ ヒ',
    text: 'ひ and ヒ are two people with a hi-hi smile',
  },
  fu: {
    sound: 'fu',
    kana: 'ふ フ',
    text: 'ふ is Mount Fu-ji puffing smoke, and フ is the sharp slope on the mountain.',
  },
  he: {
    sound: 'he',
    kana: 'へ ヘ',
    text: 'へ are both helmets on two soldiers he-ads.',
  },
  ho: {
    sound: 'ho',
    kana: 'ほ ホ',
    text: 'ほ is a tall window in a ho-ly church, and ホ is the ho-ly cross on the roof.',
  },
  ma: {
    sound: 'ma',
    kana: 'ま マ',
    text: 'ま is a ma-n in a mask, and マ is his sharp nose poking out.',
  },
  mi: {
    sound: 'mi',
    kana: 'み ミ',
    text: 'み is mi-usical notes, and ミ are the waves of music sound.',
  },
  mu: {
    sound: 'mu',
    kana: 'む ム',
    text: "む is a mu-oing cow, and ム is the cow's hanging bell.",
  },
  me: {
    sound: 'me',
    kana: 'め メ',
    text: 'め is a me-ssly drawn eye, and メ is the messy eye crossed out.',
  },
  mo: {
    sound: 'mo',
    kana: 'も モ',
    text: 'も is a mo-nkey hanging by its curved tail, and モ are the bars it swings from.',
  },
  ya: {
    sound: 'ya',
    kana: 'や ヤ',
    text: 'や is a happy ya-k with horns, and ヤ is cavemans drawing of the yak',
  },
  yu: {
    sound: 'yu',
    kana: 'ゆ ユ',
    text: 'ゆ is a yu-nicorn, and ユ is the square bucket it drinks from.',
  },
  yo: {
    sound: 'yo',
    kana: 'よ ヨ',
    text: 'よ is a person bending into yo-ga, and ヨ is the yoga mat under them.',
  },
  ra: {
    sound: 'ra',
    kana: 'ら ラ',
    text: "ら is a ra-bbit, and ラ is the rabbit's laughing face.",
  },
  ri: {
    sound: 'ri',
    kana: 'り リ',
    text: 'り is ri-eds bending, and リ is reeds standing straight.',
  },
  ru: {
    sound: 'ru',
    kana: 'る ル',
    text: 'る is a crazy looping ru-oute, and ル is the ru-oute splitting in two.',
  },
  re: {
    sound: 're',
    kana: 'れ レ',
    text: 'れ is a re-indeer, and レ is the shape its antlers make.',
  },
  ro: {
    sound: 'ro',
    kana: 'ろ ロ',
    text: 'ろ is a winding, curvy ro-ute, and ロ is a square city block on that route.',
  },
  wa: {
    sound: 'wa',
    kana: 'わ ワ',
    text: 'わ is a wa-sp flying, and ワ is a open mouth the wasp flies into.',
  },
  wo: {
    sound: 'wo',
    kana: 'を ヲ',
    text: 'を is someone yelling "whoa!" and ヲ is the dog that wo-ofed at them.',
  },
  n: {
    sound: 'n',
    kana: 'ん ン',
    text: 'ん is a sleepy "n" curled up, and ン is one eye closing as it nods off.',
  },
}

// ── Lookup helper ─────────────────────────────

export function getDualMnemonic(romaji: string): DualMnemonic | null {
  return DUAL_MNEMONICS[romaji] ?? null
}
