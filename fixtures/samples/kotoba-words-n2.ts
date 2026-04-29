// ─────────────────────────────────────────────
// File: samples/kotoba-words-n2.ts
// Purpose: N2 mock word data for the Kotoba Dojo visual shell.
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

// ── N2 ────────────────────────────────────────

// Unit 1 - Advanced formal (Levels 1-4)
export const N2_U1_G1: readonly KotobaWord[] = [
  w('n2', 'gaitou', '該当', 'がいとう', 'being applicable, corresponding to'),
  w('n2', 'tekiyou', '適用', 'てきよう', 'application (of a rule)'),
  w('n2', 'taiou', '対応', 'たいおう', 'correspondence, response'),
  w('n2', 'bunseki', '分析', 'ぶんせき', 'analysis'),
  w('n2', 'kentou', '検討', 'けんとう', 'examination, consideration'),
  w('n2', 'kousatsu', '考察', 'こうさつ', 'consideration, inquiry'),
  w('n2', 'handan', '判断', 'はんだん', 'judgement, decision'),
  w('n2', 'hyouka', '評価', 'ひょうか', 'evaluation, assessment'),
  w('n2', 'hantei', '判定', 'はんてい', 'verdict, ruling'),
  w('n2', 'ketsudan', '決断', 'けつだん', 'decisive decision'),
  w('n2', 'sentaku', '選択', 'せんたく', 'choice, selection'),
  w('n2', 'yuusen', '優先', 'ゆうせん', 'priority, preference'),
]

export const N2_U1_G2: readonly KotobaWord[] = [
  w('n2', 'keikou', '傾向', 'けいこう', 'tendency, trend'),
  w('n2', 'tokuchou', '特徴', 'とくちょう', 'feature, characteristic'),
  w('n2', 'seishitsu', '性質', 'せいしつ', 'nature, property'),
  w('n2', 'youso', '要素', 'ようそ', 'element, factor'),
  w('n2', 'youin', '要因', 'よういん', 'primary factor, main cause'),
  w('n2', 'gen-in', '原因', 'げんいん', 'cause, origin'),
  w('n2', 'eikyou', '影響', 'えいきょう', 'influence, effect'),
  w('n2', 'kouka', '効果', 'こうか', 'effect, result'),
  w('n2', 'ketsuron', '結論', 'けつろん', 'conclusion'),
  w('n2', 'seika', '成果', 'せいか', 'outcome, achievement'),
  w('n2', 'kachi', '価値', 'かち', 'value, worth'),
  w('n2', 'hyouban', '評判', 'ひょうばん', 'reputation, fame'),
]

// Unit 2 - Business and affairs (Levels 5-8)
export const N2_U2_G1: readonly KotobaWord[] = [
  w('n2', 'gyoumu', '業務', 'ぎょうむ', 'business, duties'),
  w('n2', 'shokumu', '職務', 'しょくむ', 'professional duties'),
  w('n2', 'ninmu', '任務', 'にんむ', 'assignment, mission'),
  w('n2', 'yakuwari', '役割', 'やくわり', 'role, part'),
  w('n2', 'yakume', '役目', 'やくめ', 'duty, role'),
  w('n2', 'chii', '地位', 'ちい', 'status, rank, position'),
  w('n2', 'tachiba', '立場', 'たちば', 'standpoint, position'),
  w('n2', 'joukyou', '状況', 'じょうきょう', 'circumstances, situation'),
  w('n2', 'genjou', '現状', 'げんじょう', 'present state of affairs'),
  w('n2', 'joutai', '状態', 'じょうたい', 'condition, state'),
  w('n2', 'gyoukai', '業界', 'ぎょうかい', 'industry, business circle'),
  w('n2', 'bunya', '分野', 'ぶんや', 'field, area'),
]

export const N2_U2_G2: readonly KotobaWord[] = [
  w('n2', 'kaikaku', '改革', 'かいかく', 'reform, reorganisation'),
  w('n2', 'kaizen', '改善', 'かいぜん', 'improvement, betterment'),
  w('n2', 'kairyou', '改良', 'かいりょう', 'improvement (of a product)'),
  w('n2', 'kaisei', '改正', 'かいせい', 'revision, amendment'),
  w('n2', 'henkaku', '変革', 'へんかく', 'reform, transformation'),
  w('n2', 'henka', '変化', 'へんか', 'change, variation'),
  w('n2', 'henkou', '変更', 'へんこう', 'change, modification'),
  w('n2', 'tenkan', '転換', 'てんかん', 'conversion, switch'),
  w('n2', 'hatten', '発展', 'はってん', 'development, expansion'),
  w('n2', 'shinten', '進展', 'しんてん', 'progress, development'),
  w('n2', 'shinpo', '進歩', 'しんぽ', 'progress, advancement'),
  w('n2', 'hattatsu', '発達', 'はったつ', 'development, growth'),
]

// Unit 3 - Complex concepts (Levels 9-12)
export const N2_U3_G1: readonly KotobaWord[] = [
  w('n2', 'ronri', '論理', 'ろんり', 'logic'),
  w('n2', 'riron', '理論', 'りろん', 'theory'),
  w('n2', 'kasetsu', '仮説', 'かせつ', 'hypothesis'),
  w('n2', 'zentei', '前提', 'ぜんてい', 'premise, prerequisite'),
  w('n2', 'konkyo', '根拠', 'こんきょ', 'basis, grounds'),
  w('n2', 'shouko', '証拠', 'しょうこ', 'evidence, proof'),
  w('n2', 'jisshou', '実証', 'じっしょう', 'actual proof, demonstration'),
  w('n2', 'shoumei', '証明', 'しょうめい', 'proof, certification'),
  w('n2', 'jijitsu', '事実', 'じじつ', 'fact, truth'),
  w('n2', 'genjitsu', '現実', 'げんじつ', 'reality'),
  w('n2', 'shinjitsu', '真実', 'しんじつ', 'truth, reality'),
  w('n2', 'kyokou', '虚構', 'きょこう', 'fiction, fabrication'),
]

export const N2_U3_G2: readonly KotobaWord[] = [
  w('n2', 'kanten', '観点', 'かんてん', 'viewpoint, perspective'),
  w('n2', 'shiten', '視点', 'してん', 'point of view'),
  w('n2', 'sokumen', '側面', 'そくめん', 'side, aspect'),
  w('n2', 'kyokumen', '局面', 'きょくめん', 'phase, situation'),
  w('n2', 'bamen', '場面', 'ばめん', 'scene, setting'),
  w('n2', 'joukei', '情景', 'じょうけい', 'scene, spectacle'),
  w('n2', 'koukei', '光景', 'こうけい', 'scene, view'),
  w('n2', 'fuukei', '風景', 'ふうけい', 'landscape, scenery'),
  w('n2', 'keshiki', '景色', 'けしき', 'scenery, view'),
  w('n2', 'tenbou', '展望', 'てんぼう', 'view, outlook'),
  w('n2', 'choubou', '眺望', 'ちょうぼう', 'view, prospect'),
  w('n2', 'yosoku', '予測', 'よそく', 'prediction, forecast'),
]
