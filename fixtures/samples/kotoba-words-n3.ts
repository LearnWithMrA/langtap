// ─────────────────────────────────────────────
// File: samples/kotoba-words-n3.ts
// Purpose: N3 mock word data for the Kotoba Dojo visual shell.
//          Split by JLPT level for on-demand loading.
// Depends on: types/kotoba.types.ts
// ─────────────────────────────────────────────

import type { JlptLevel, KotobaWord } from '@/types/kotoba.types'

// ── Word-entry helper ─────────────────────────

function w(
  level: JlptLevel,
  slug: string,
  kanji: string | null,
  kana: string,
  english: string,
): KotobaWord {
  return { id: `w-${level}-${slug}`, kanji, kana, english, jlpt: level }
}

// ── N3 ────────────────────────────────────────

// Unit 1 - Abstract concepts (Levels 1-4)
export const N3_U1_G1: readonly KotobaWord[] = [
  w('n3', 'keiken', '経験', 'けいけん', 'experience'),
  w('n3', 'kioku', '記憶', 'きおく', 'memory'),
  w('n3', 'souzou', '想像', 'そうぞう', 'imagination'),
  w('n3', 'yosou', '予想', 'よそう', 'prediction, expectation'),
  w('n3', 'keikaku', '計画', 'けいかく', 'plan'),
  w('n3', 'mokuteki', '目的', 'もくてき', 'purpose, objective'),
  w('n3', 'mokuhyou', '目標', 'もくひょう', 'goal, target'),
  w('n3', 'houhou', '方法', 'ほうほう', 'method, way'),
  w('n3', 'shudan', '手段', 'しゅだん', 'means, measure'),
  w('n3', 'jouken', '条件', 'じょうけん', 'condition, requirement'),
  w('n3', 'kekka', '結果', 'けっか', 'result, outcome'),
  w('n3', 'jouhou', '情報', 'じょうほう', 'information'),
]

export const N3_U1_G2: readonly KotobaWord[] = [
  w('n3', 'chishiki', '知識', 'ちしき', 'knowledge'),
  w('n3', 'ishiki', '意識', 'いしき', 'consciousness, awareness'),
  w('n3', 'taido', '態度', 'たいど', 'attitude, manner'),
  w('n3', 'kimochi', '気持ち', 'きもち', 'feeling, mood'),
  w('n3', 'kanjou', '感情', 'かんじょう', 'emotion, feeling'),
  w('n3', 'seikaku', '性格', 'せいかく', 'personality, character'),
  w('n3', 'nouryoku', '能力', 'のうりょく', 'ability, capacity'),
  w('n3', 'sainou', '才能', 'さいのう', 'talent'),
  w('n3', 'jitsuryoku', '実力', 'じつりょく', 'real ability, true strength'),
  w('n3', 'kyousou', '競争', 'きょうそう', 'competition'),
  w('n3', 'senryaku', '戦略', 'せんりゃく', 'strategy'),
  w('n3', 'senjutsu', '戦術', 'せんじゅつ', 'tactics'),
]

// Unit 2 - Society and work (Levels 5-8)
export const N3_U2_G1: readonly KotobaWord[] = [
  w('n3', 'kaigi3', '会議', 'かいぎ', 'meeting, conference'),
  w('n3', 'koushou', '交渉', 'こうしょう', 'negotiation'),
  w('n3', 'keiyaku', '契約', 'けいやく', 'contract'),
  w('n3', 'kikaku', '企画', 'きかく', 'plan, project'),
  w('n3', 'kaihatsu', '開発', 'かいはつ', 'development'),
  w('n3', 'seizou', '製造', 'せいぞう', 'manufacturing'),
  w('n3', 'hanbai', '販売', 'はんばい', 'sales'),
  w('n3', 'senden', '宣伝', 'せんでん', 'advertisement, publicity'),
  w('n3', 'koukoku', '広告', 'こうこく', 'advertising'),
  w('n3', 'ryuukou', '流行', 'りゅうこう', 'fashion, trend'),
  w('n3', 'shijou', '市場', 'しじょう', 'market'),
  w('n3', 'kokyaku', '顧客', 'こきゃく', 'customer, client'),
]

export const N3_U2_G2: readonly KotobaWord[] = [
  w('n3', 'seifu', '政府', 'せいふ', 'government'),
  w('n3', 'houritsu', '法律', 'ほうりつ', 'law'),
  w('n3', 'kisoku', '規則', 'きそく', 'rule, regulation'),
  w('n3', 'jiyuu', '自由', 'じゆう', 'freedom'),
  w('n3', 'byoudou', '平等', 'びょうどう', 'equality'),
  w('n3', 'kenri', '権利', 'けんり', 'right, privilege'),
  w('n3', 'gimu', '義務', 'ぎむ', 'duty, obligation'),
  w('n3', 'sekinin', '責任', 'せきにん', 'responsibility'),
  w('n3', 'heiwa', '平和', 'へいわ', 'peace'),
  w('n3', 'sensou', '戦争', 'せんそう', 'war'),
  w('n3', 'minzoku', '民族', 'みんぞく', 'ethnic group'),
  w('n3', 'shuukyou', '宗教', 'しゅうきょう', 'religion'),
]

// Unit 3 - Nature and science (Levels 9-12)
export const N3_U3_G1: readonly KotobaWord[] = [
  w('n3', 'kikou', '気候', 'きこう', 'climate'),
  w('n3', 'tenki', '天気', 'てんき', 'weather'),
  w('n3', 'kisetsu', '季節', 'きせつ', 'season'),
  w('n3', 'ondo', '温度', 'おんど', 'temperature'),
  w('n3', 'shitsudo', '湿度', 'しつど', 'humidity'),
  w('n3', 'kuuki', '空気', 'くうき', 'air'),
  w('n3', 'kaze', '風', 'かぜ', 'wind'),
  w('n3', 'arashi', '嵐', 'あらし', 'storm'),
  w('n3', 'jishin', '地震', 'じしん', 'earthquake'),
  w('n3', 'kazan', '火山', 'かざん', 'volcano'),
  w('n3', 'tsunami', '津波', 'つなみ', 'tsunami'),
  w('n3', 'kouzui', '洪水', 'こうずい', 'flood'),
]

export const N3_U3_G2: readonly KotobaWord[] = [
  w('n3', 'uchuu', '宇宙', 'うちゅう', 'universe, space'),
  w('n3', 'ginga', '銀河', 'ぎんが', 'galaxy, the Milky Way'),
  w('n3', 'wakusei', '惑星', 'わくせい', 'planet'),
  w('n3', 'chikyuu', '地球', 'ちきゅう', 'earth'),
  w('n3', 'seimei', '生命', 'せいめい', 'life, existence'),
  w('n3', 'shinka', '進化', 'しんか', 'evolution'),
  w('n3', 'iden', '遺伝', 'いでん', 'heredity, genetics'),
  w('n3', 'saibou', '細胞', 'さいぼう', 'cell'),
  w('n3', 'doubutsu', '動物', 'どうぶつ', 'animal'),
  w('n3', 'shokubutsu', '植物', 'しょくぶつ', 'plant, vegetation'),
  w('n3', 'seibutsu', '生物', 'せいぶつ', 'living thing'),
  w('n3', 'seitai', '生態', 'せいたい', 'ecology, mode of life'),
]
