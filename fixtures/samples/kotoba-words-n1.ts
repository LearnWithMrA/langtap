// ─────────────────────────────────────────────
// File: samples/kotoba-words-n1.ts
// Purpose: N1 mock word data for the Kotoba Dojo visual shell.
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

// ── N1 ────────────────────────────────────────

// Unit 1 - Formal and nuanced (Levels 1-4)
export const N1_U1_G1: readonly KotobaWord[] = [
  w('n1', 'itsudatsu', '逸脱', 'いつだつ', 'deviation, departure'),
  w('n1', 'kencho', '顕著', 'けんちょ', 'remarkable, striking'),
  w('n1', 'junshu', '遵守', 'じゅんしゅ', 'compliance, observance'),
  w('n1', 'kantetsu', '貫徹', 'かんてつ', 'carrying something through'),
  w('n1', 'chinpu', '陳腐', 'ちんぷ', 'cliched, trite'),
  w('n1', 'share', '洒落', 'しゃれ', 'pun, witticism'),
  w('n1', 'shinchou', '慎重', 'しんちょう', 'cautious, prudent'),
  w('n1', 'genmitsu', '厳密', 'げんみつ', 'strict, rigorous'),
  w('n1', 'suikou', '遂行', 'すいこう', 'execution, carrying out'),
  w('n1', 'shintou', '浸透', 'しんとう', 'permeation, penetration'),
  w('n1', 'ikan', '遺憾', 'いかん', 'regrettable'),
  w('n1', 'boppatsu', '勃発', 'ぼっぱつ', 'outbreak, sudden occurrence'),
]

export const N1_U1_G2: readonly KotobaWord[] = [
  w('n1', 'kattou', '葛藤', 'かっとう', 'conflict, struggle'),
  w('n1', 'yuuutsu', '憂鬱', 'ゆううつ', 'depression, melancholy'),
  w('n1', 'kodoku', '孤独', 'こどく', 'solitude, loneliness'),
  w('n1', 'sekiryou', '寂寥', 'せきりょう', 'desolation, loneliness'),
  w('n1', 'kyoushuu', '郷愁', 'きょうしゅう', 'nostalgia, homesickness'),
  w('n1', 'aishuu', '哀愁', 'あいしゅう', 'pathos, sorrow'),
  w('n1', 'kaikon', '悔恨', 'かいこん', 'remorse, regret'),
  w('n1', 'fungai', '憤慨', 'ふんがい', 'resentment, indignation'),
  w('n1', 'shousou', '焦燥', 'しょうそう', 'impatience, restlessness'),
  w('n1', 'douyou', '動揺', 'どうよう', 'agitation, disturbance'),
  w('n1', 'kanshou', '感傷', 'かんしょう', 'sentimentality'),
  w('n1', 'kyomu', '虚無', 'きょむ', 'nothingness, nihility'),
]

// Unit 2 - Character and style (Levels 5-8)
export const N1_U2_G1: readonly KotobaWord[] = [
  w('n1', 'ganko', '頑固', 'がんこ', 'stubborn, obstinate'),
  w('n1', 'mujaki', '無邪気', 'むじゃき', 'innocent, naive'),
  w('n1', 'junsui', '純粋', 'じゅんすい', 'pure, genuine'),
  w('n1', 'soboku', '素朴', 'そぼく', 'simple, unsophisticated'),
  w('n1', 'socchoku', '率直', 'そっちょく', 'frank, candid'),
  w('n1', 'seijitsu', '誠実', 'せいじつ', 'sincere, honest'),
  w('n1', 'kenkyo', '謙虚', 'けんきょ', 'humble, modest'),
  w('n1', 'kanyou', '寛容', 'かんよう', 'tolerance, forbearance'),
  w('n1', 'daitan', '大胆', 'だいたん', 'bold, daring'),
  w('n1', 'okubyou', '臆病', 'おくびょう', 'cowardice, timidity'),
  w('n1', 'sensai', '繊細', 'せんさい', 'delicate, subtle'),
  w('n1', 'sobou', '粗暴', 'そぼう', 'wild, rough'),
]

export const N1_U2_G2: readonly KotobaWord[] = [
  w('n1', 'igen', '威厳', 'いげん', 'dignity, majesty'),
  w('n1', 'fuukaku', '風格', 'ふうかく', 'character, personality'),
  w('n1', 'hin-i', '品位', 'ひんい', 'dignity, grace'),
  w('n1', 'kihin', '気品', 'きひん', 'grace, refinement'),
  w('n1', 'kigai', '気概', 'きがい', 'strong spirit, grit'),
  w('n1', 'kihaku', '気迫', 'きはく', 'spirit, drive'),
  w('n1', 'kakugo', '覚悟', 'かくご', 'resolve, readiness'),
  w('n1', 'dokyou', '度胸', 'どきょう', 'courage, nerve'),
  w('n1', 'kiten', '機転', 'きてん', 'quick wittedness, tact'),
  w('n1', 'kichi', '機知', 'きち', 'wit, ready wit'),
  w('n1', 'saikaku', '才覚', 'さいかく', 'ready wit, resourcefulness'),
  w('n1', 'kansei', '感性', 'かんせい', 'sensitivity, sensibility'),
]

// Unit 3 - Idiomatic and abstract (Levels 9-12)
export const N1_U3_G1: readonly KotobaWord[] = [
  w('n1', 'kinkou', '均衡', 'きんこう', 'equilibrium, balance'),
  w('n1', 'chouwa', '調和', 'ちょうわ', 'harmony, accord'),
  w('n1', 'mujun', '矛盾', 'むじゅん', 'contradiction, inconsistency'),
  w('n1', 'tairitsu', '対立', 'たいりつ', 'confrontation, opposition'),
  w('n1', 'soukoku', '相克', 'そうこく', 'rivalry, conflict'),
  w('n1', 'soui', '相違', 'そうい', 'difference, discrepancy'),
  w('n1', 'gacchi', '合致', 'がっち', 'agreement, concurrence'),
  w('n1', 'icchi', '一致', 'いっち', 'agreement, conformity'),
  w('n1', 'chousei', '調整', 'ちょうせい', 'adjustment, coordination'),
  w('n1', 'chousetsu', '調節', 'ちょうせつ', 'regulation, tuning'),
  w('n1', 'sousa', '操作', 'そうさ', 'operation, handling'),
  w('n1', 'seigyo', '制御', 'せいぎょ', 'control, governing'),
]

export const N1_U3_G2: readonly KotobaWord[] = [
  w('n1', 'chikuseki', '蓄積', 'ちくせき', 'accumulation'),
  w('n1', 'shuuseki', '集積', 'しゅうせき', 'accumulation, gathering'),
  w('n1', 'taiseki', '堆積', 'たいせき', 'accumulation, sedimentation'),
  w('n1', 'chinden', '沈殿', 'ちんでん', 'precipitation, settling'),
  w('n1', 'fuyuu', '浮遊', 'ふゆう', 'floating, suspension'),
  w('n1', 'hyouryuu', '漂流', 'ひょうりゅう', 'drifting, drift'),
  w('n1', 'hyouhaku', '漂泊', 'ひょうはく', 'wandering, roaming'),
  w('n1', 'kakusan', '拡散', 'かくさん', 'diffusion, spread'),
  w('n1', 'denpa', '伝播', 'でんぱ', 'propagation, transmission'),
  w('n1', 'rufu', '流布', 'るふ', 'dissemination, circulation'),
  w('n1', 'fukyuu', '普及', 'ふきゅう', 'diffusion, spread'),
  w('n1', 'man-en', '蔓延', 'まんえん', 'spread (of a disease), rampancy'),
]
