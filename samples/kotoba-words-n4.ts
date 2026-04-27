// ─────────────────────────────────────────────
// File: samples/kotoba-words-n4.ts
// Purpose: N4 mock word data for the Kotoba Dojo visual shell.
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

// ── N4 ────────────────────────────────────────

// Unit 1 - Daily life (Levels 1-4)
export const N4_U1_G1: readonly KotobaWord[] = [
  w('n4', 'ryokou', '旅行', 'りょこう', 'trip, travel'),
  w('n4', 'shigoto', '仕事', 'しごと', 'job, work'),
  w('n4', 'seikatsu', '生活', 'せいかつ', 'daily life, living'),
  w('n4', 'densha', '電車', 'でんしゃ', 'electric train'),
  w('n4', 'ryouri', '料理', 'りょうり', 'cooking, cuisine'),
  w('n4', 'benkyou', '勉強', 'べんきょう', 'study'),
  w('n4', 'shumi', '趣味', 'しゅみ', 'hobby, interest'),
  w('n4', 'shiai', '試合', 'しあい', 'match, game, competition'),
  w('n4', 'kaigi', '会議', 'かいぎ', 'meeting, conference'),
  w('n4', 'shouhin', '商品', 'しょうひん', 'commodity, merchandise'),
  w('n4', 'kouen4', '講演', 'こうえん', 'lecture, talk'),
  w('n4', 'shiken', '試験', 'しけん', 'exam, test'),
]

export const N4_U1_G2: readonly KotobaWord[] = [
  w('n4', 'bunka', '文化', 'ぶんか', 'culture'),
  w('n4', 'keiken4', '経験', 'けいけん', 'experience'),
  w('n4', 'mondai', '問題', 'もんだい', 'problem, question'),
  w('n4', 'kotae', '答え', 'こたえ', 'answer'),
  w('n4', 'iken', '意見', 'いけん', 'opinion'),
  w('n4', 'riyuu', '理由', 'りゆう', 'reason'),
  w('n4', 'setsumei', '説明', 'せつめい', 'explanation'),
  w('n4', 'shitsumon', '質問', 'しつもん', 'question'),
  w('n4', 'henji', '返事', 'へんじ', 'reply, response'),
  w('n4', 'soudan', '相談', 'そうだん', 'consultation, discussion'),
  w('n4', 'yakusoku', '約束', 'やくそく', 'promise, appointment'),
  w('n4', 'renraku', '連絡', 'れんらく', 'contact, communication'),
]

// Unit 2 - Descriptions and emotions (Levels 5-8)
export const N4_U2_G1: readonly KotobaWord[] = [
  w('n4', 'taisetsu', '大切', 'たいせつ', 'important, precious'),
  w('n4', 'kantan', '簡単', 'かんたん', 'simple, easy'),
  w('n4', 'muzukashii', '難しい', 'むずかしい', 'difficult'),
  w('n4', 'omoshiroi', '面白い', 'おもしろい', 'interesting, amusing'),
  w('n4', 'tanoshii', '楽しい', 'たのしい', 'fun, enjoyable'),
  w('n4', 'kanashii', '悲しい', 'かなしい', 'sad'),
  w('n4', 'ureshii', '嬉しい', 'うれしい', 'happy, glad'),
  w('n4', 'fuben', '不便', 'ふべん', 'inconvenient'),
  w('n4', 'benri', '便利', 'べんり', 'convenient'),
  w('n4', 'anzen', '安全', 'あんぜん', 'safety, safe'),
  w('n4', 'abunai', '危ない', 'あぶない', 'dangerous'),
  w('n4', 'utsukushii', '美しい', 'うつくしい', 'beautiful'),
]

export const N4_U2_G2: readonly KotobaWord[] = [
  w('n4', 'yorokobi', '喜び', 'よろこび', 'joy, delight'),
  w('n4', 'ikari', '怒り', 'いかり', 'anger'),
  w('n4', 'odoroki', '驚き', 'おどろき', 'surprise, astonishment'),
  w('n4', 'kibou', '希望', 'きぼう', 'hope, wish'),
  w('n4', 'yume', '夢', 'ゆめ', 'dream'),
  w('n4', 'kandou', '感動', 'かんどう', 'deep emotion, being moved'),
  w('n4', 'anshin', '安心', 'あんしん', 'relief, peace of mind'),
  w('n4', 'shinpai', '心配', 'しんぱい', 'worry, concern'),
  w('n4', 'kinchou', '緊張', 'きんちょう', 'tension, nervousness'),
  w('n4', 'doryoku', '努力', 'どりょく', 'effort'),
  w('n4', 'seikou', '成功', 'せいこう', 'success'),
  w('n4', 'shippai', '失敗', 'しっぱい', 'failure, mistake'),
]

// Unit 3 - Actions and society (Levels 9-12)
export const N4_U3_G1: readonly KotobaWord[] = [
  w('n4', 'hajimeru', '始める', 'はじめる', 'to begin, to start'),
  w('n4', 'tsuzukeru', '続ける', 'つづける', 'to continue'),
  w('n4', 'owaru', '終わる', 'おわる', 'to finish, to end'),
  w('n4', 'kimeru', '決める', 'きめる', 'to decide'),
  w('n4', 'shiraberu', '調べる', 'しらべる', 'to investigate, to check'),
  w('n4', 'tsutaeru', '伝える', 'つたえる', 'to convey, to pass on'),
  w('n4', 'ganbaru', '頑張る', 'がんばる', 'to persevere, to do one is best'),
  w('n4', 'tetsudau', '手伝う', 'てつだう', 'to help'),
  w('n4', 'kaeru', '変える', 'かえる', 'to change (something)'),
  w('n4', 'erabu', '選ぶ', 'えらぶ', 'to choose, to select'),
  w('n4', 'atsumeru', '集める', 'あつめる', 'to collect, to gather'),
  w('n4', 'todokeru', '届ける', 'とどける', 'to deliver'),
]

export const N4_U3_G2: readonly KotobaWord[] = [
  w('n4', 'shakai4', '社会', 'しゃかい', 'society'),
  w('n4', 'seiji4', '政治', 'せいじ', 'politics'),
  w('n4', 'keizai4', '経済', 'けいざい', 'economy'),
  w('n4', 'rekishi', '歴史', 'れきし', 'history'),
  w('n4', 'kagaku', '科学', 'かがく', 'science'),
  w('n4', 'gijutsu4', '技術', 'ぎじゅつ', 'technology, skill'),
  w('n4', 'shizen', '自然', 'しぜん', 'nature'),
  w('n4', 'kankyou', '環境', 'かんきょう', 'environment'),
  w('n4', 'chikyuu4', '地球', 'ちきゅう', 'earth, the globe'),
  w('n4', 'sekai', '世界', 'せかい', 'world'),
  w('n4', 'kuni', '国', 'くに', 'country'),
  w('n4', 'machi', '町', 'まち', 'town, neighbourhood'),
]
