// ─────────────────────────────────────────────
// File: samples/kotoba-words-n5.ts
// Purpose: N5 mock word data for the Kotoba Dojo visual shell.
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

// ── N5 ────────────────────────────────────────

// Unit 1 - Basics (Levels 1-4)
export const N5_U1_G1: readonly KotobaWord[] = [
  w('n5', 'nihon', '日本', 'にほん', 'Japan'),
  w('n5', 'gakusei', '学生', 'がくせい', 'student'),
  w('n5', 'sensei', '先生', 'せんせい', 'teacher'),
  w('n5', 'mizu', '水', 'みず', 'water'),
  w('n5', 'hon', '本', 'ほん', 'book'),
  w('n5', 'gakkou', '学校', 'がっこう', 'school'),
  w('n5', 'kuruma', '車', 'くるま', 'car'),
  w('n5', 'hito', '人', 'ひと', 'person'),
  w(
    'n5',
    'sayounara',
    null,
    'さようなら',
    'goodbye, a parting greeting used when not expecting to meet again soon',
  ),
  w('n5', 'ohayou', null, 'おはよう', 'good morning'),
  w('n5', 'terebi', null, 'テレビ', 'television, TV'),
  w('n5', 'koohii', null, 'コーヒー', 'coffee'),
]

export const N5_U1_G2: readonly KotobaWord[] = [
  w('n5', 'sakana', '魚', 'さかな', 'fish'),
  w('n5', 'niku', '肉', 'にく', 'meat'),
  w('n5', 'yasai', '野菜', 'やさい', 'vegetable'),
  w('n5', 'kudamono', '果物', 'くだもの', 'fruit'),
  w('n5', 'gohan', null, 'ごはん', 'cooked rice, meal'),
  w('n5', 'pan', null, 'パン', 'bread'),
  w('n5', 'ie', '家', 'いえ', 'house, home'),
  w('n5', 'heya', '部屋', 'へや', 'room'),
  w('n5', 'hana', '花', 'はな', 'flower'),
  w('n5', 'ki', '木', 'き', 'tree'),
  w('n5', 'yama', '山', 'やま', 'mountain'),
  w('n5', 'kawa', '川', 'かわ', 'river'),
]

// Unit 2 - Time and family (Levels 5-8)
export const N5_U2_G1: readonly KotobaWord[] = [
  w('n5', 'kyou', '今日', 'きょう', 'today'),
  w('n5', 'ashita', '明日', 'あした', 'tomorrow'),
  w('n5', 'kinou', '昨日', 'きのう', 'yesterday'),
  w('n5', 'jikan', '時間', 'じかん', 'time, hour'),
  w('n5', 'asa', '朝', 'あさ', 'morning'),
  w('n5', 'hiru', '昼', 'ひる', 'noon, daytime'),
  w('n5', 'yoru', '夜', 'よる', 'night'),
  w('n5', 'ima', '今', 'いま', 'now'),
  w('n5', 'toshi', '年', 'とし', 'year'),
  w('n5', 'tsuki', '月', 'つき', 'month, moon'),
  w('n5', 'shuu', '週', 'しゅう', 'week'),
  w('n5', 'youbi', '曜日', 'ようび', 'day of the week'),
]

export const N5_U2_G2: readonly KotobaWord[] = [
  w('n5', 'chichi', '父', 'ちち', 'father (one is own)'),
  w('n5', 'haha', '母', 'はは', 'mother (one is own)'),
  w('n5', 'ani', '兄', 'あに', 'older brother (one is own)'),
  w('n5', 'ane', '姉', 'あね', 'older sister (one is own)'),
  w('n5', 'otouto', '弟', 'おとうと', 'younger brother'),
  w('n5', 'imouto', '妹', 'いもうと', 'younger sister'),
  w('n5', 'kazoku', '家族', 'かぞく', 'family'),
  w('n5', 'tomodachi', '友達', 'ともだち', 'friend'),
  w('n5', 'namae', '名前', 'なまえ', 'name'),
  w('n5', 'inu', '犬', 'いぬ', 'dog'),
  w('n5', 'neko', '猫', 'ねこ', 'cat'),
  w('n5', 'tori', '鳥', 'とり', 'bird'),
]

// Unit 3 - Actions and places (Levels 9-12)
export const N5_U3_G1: readonly KotobaWord[] = [
  w('n5', 'iku', '行く', 'いく', 'to go'),
  w('n5', 'kuru', '来る', 'くる', 'to come'),
  w('n5', 'miru', '見る', 'みる', 'to see, to watch'),
  w('n5', 'kiku', '聞く', 'きく', 'to listen, to ask'),
  w('n5', 'taberu', '食べる', 'たべる', 'to eat'),
  w('n5', 'nomu', '飲む', 'のむ', 'to drink'),
  w('n5', 'kau', '買う', 'かう', 'to buy'),
  w('n5', 'kaku', '書く', 'かく', 'to write, to draw'),
  w('n5', 'yomu', '読む', 'よむ', 'to read'),
  w('n5', 'hanasu', '話す', 'はなす', 'to speak, to talk'),
  w('n5', 'aruku', '歩く', 'あるく', 'to walk'),
  w('n5', 'hashiru', '走る', 'はしる', 'to run'),
]

export const N5_U3_G2: readonly KotobaWord[] = [
  w('n5', 'eki', '駅', 'えき', 'train station'),
  w('n5', 'mise', '店', 'みせ', 'shop, store'),
  w('n5', 'ginkou', '銀行', 'ぎんこう', 'bank'),
  w('n5', 'byouin', '病院', 'びょういん', 'hospital'),
  w('n5', 'kaisha', '会社', 'かいしゃ', 'company, workplace'),
  w('n5', 'daigaku', '大学', 'だいがく', 'university'),
  w('n5', 'kouen', '公園', 'こうえん', 'park'),
  w('n5', 'eiga', '映画', 'えいが', 'movie, film'),
  w('n5', 'ongaku', '音楽', 'おんがく', 'music'),
  w('n5', 'denwa', '電話', 'でんわ', 'telephone, phone call'),
  w('n5', 'tegami', '手紙', 'てがみ', 'letter'),
  w('n5', 'shinbun', '新聞', 'しんぶん', 'newspaper'),
]
