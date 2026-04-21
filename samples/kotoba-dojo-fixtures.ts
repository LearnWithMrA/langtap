// ─────────────────────────────────────────────
// File: samples/kotoba-dojo-fixtures.ts
// Purpose: Mock Kotoba fixtures for the /dojo/kotoba visual shell. Used
//          while the real word bank (Sprint 5) and mastery store
//          (Sprint 4) are not yet wired up.
//          Every JLPT level (N5-N1) is populated with three units of
//          two level groups of twelve words each, so the owner can page
//          through every tab and review the shell at realistic density.
//          Words are hand-authored sample content chosen to be
//          plausibly level-appropriate; the real pipeline (CONTENT.md
//          §7.3, Sprint 5) will replace them with JMdict-derived data.
//          Scores follow a deterministic pattern per group so each
//          group contains at least one tile in every heat band, two
//          tiles that need manual unlock (low score, in the manual
//          set), and two tiles that stay locked (score below threshold,
//          not in the manual set).
// Depends on: types/kotoba.types.ts, engine/mastery.ts
// ─────────────────────────────────────────────

import { MASTERY_THRESHOLD } from '@/engine/mastery'
import type {
  JlptLevel,
  KotobaDojoFixture,
  KotobaFixtureKey,
  KotobaUnit,
  KotobaWord,
} from '@/types/kotoba.types'

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
const N5_U1_G1: readonly KotobaWord[] = [
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

const N5_U1_G2: readonly KotobaWord[] = [
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
const N5_U2_G1: readonly KotobaWord[] = [
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

const N5_U2_G2: readonly KotobaWord[] = [
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
const N5_U3_G1: readonly KotobaWord[] = [
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

const N5_U3_G2: readonly KotobaWord[] = [
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

// ── N4 ────────────────────────────────────────

// Unit 1 - Daily life (Levels 1-4)
const N4_U1_G1: readonly KotobaWord[] = [
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

const N4_U1_G2: readonly KotobaWord[] = [
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
const N4_U2_G1: readonly KotobaWord[] = [
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

const N4_U2_G2: readonly KotobaWord[] = [
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
const N4_U3_G1: readonly KotobaWord[] = [
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

const N4_U3_G2: readonly KotobaWord[] = [
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

// ── N3 ────────────────────────────────────────

// Unit 1 - Abstract concepts (Levels 1-4)
const N3_U1_G1: readonly KotobaWord[] = [
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

const N3_U1_G2: readonly KotobaWord[] = [
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
const N3_U2_G1: readonly KotobaWord[] = [
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

const N3_U2_G2: readonly KotobaWord[] = [
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
const N3_U3_G1: readonly KotobaWord[] = [
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

const N3_U3_G2: readonly KotobaWord[] = [
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

// ── N2 ────────────────────────────────────────

// Unit 1 - Advanced formal (Levels 1-4)
const N2_U1_G1: readonly KotobaWord[] = [
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

const N2_U1_G2: readonly KotobaWord[] = [
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
const N2_U2_G1: readonly KotobaWord[] = [
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

const N2_U2_G2: readonly KotobaWord[] = [
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
const N2_U3_G1: readonly KotobaWord[] = [
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

const N2_U3_G2: readonly KotobaWord[] = [
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

// ── N1 ────────────────────────────────────────

// Unit 1 - Formal and nuanced (Levels 1-4)
const N1_U1_G1: readonly KotobaWord[] = [
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

const N1_U1_G2: readonly KotobaWord[] = [
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
const N1_U2_G1: readonly KotobaWord[] = [
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

const N1_U2_G2: readonly KotobaWord[] = [
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
const N1_U3_G1: readonly KotobaWord[] = [
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

const N1_U3_G2: readonly KotobaWord[] = [
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

// ── Aggregations ──────────────────────────────

type GroupTuple = readonly [readonly KotobaWord[], readonly KotobaWord[]]
type LevelTuple = readonly [GroupTuple, GroupTuple, GroupTuple]

const LEVEL_WORDS: Readonly<Record<JlptLevel, LevelTuple>> = {
  n5: [
    [N5_U1_G1, N5_U1_G2],
    [N5_U2_G1, N5_U2_G2],
    [N5_U3_G1, N5_U3_G2],
  ],
  n4: [
    [N4_U1_G1, N4_U1_G2],
    [N4_U2_G1, N4_U2_G2],
    [N4_U3_G1, N4_U3_G2],
  ],
  n3: [
    [N3_U1_G1, N3_U1_G2],
    [N3_U2_G1, N3_U2_G2],
    [N3_U3_G1, N3_U3_G2],
  ],
  n2: [
    [N2_U1_G1, N2_U1_G2],
    [N2_U2_G1, N2_U2_G2],
    [N2_U3_G1, N2_U3_G2],
  ],
  n1: [
    [N1_U1_G1, N1_U1_G2],
    [N1_U2_G1, N1_U2_G2],
    [N1_U3_G1, N1_U3_G2],
  ],
}

const UNIT_RANGES: readonly [string, string, string, string, string, string] = [
  'Levels 1-2',
  'Levels 3-4',
  'Levels 5-6',
  'Levels 7-8',
  'Levels 9-10',
  'Levels 11-12',
]

const UNIT_RANGE_LABELS: readonly [string, string, string] = [
  'Levels 1-4',
  'Levels 5-8',
  'Levels 9-12',
]

const ALL_WORDS: readonly KotobaWord[] = (Object.values(LEVEL_WORDS) as LevelTuple[]).flatMap(
  (level) => level.flatMap((unit) => [...unit[0], ...unit[1]]),
)

const WORDS_BY_ID: Readonly<Record<string, KotobaWord>> = ((): Readonly<
  Record<string, KotobaWord>
> => {
  const out: Record<string, KotobaWord> = {}
  for (const entry of ALL_WORDS) out[entry.id] = entry
  return out
})()

// ── Scoring pattern ───────────────────────────
// Twelve positions per group. Picked so each group exercises every
// heat band plus two manual-unlocks (positions 4 and 9) and two locked
// tiles (positions 5 and 11 - score below UNLOCK_THRESHOLD and not in
// the manual set).

const SCORE_PATTERN: readonly number[] = [
  MASTERY_THRESHOLD + 5, // 0: gold (45)
  28, // 1: heat-4
  15, // 2: heat-3
  7, // 3: heat-2
  2, // 4: heat-1 (manual unlock required)
  0, // 5: locked
  38, // 6: heat-4
  20, // 7: heat-4
  12, // 8: heat-3
  4, // 9: heat-1 (manual unlock required)
  8, // 10: heat-2
  0, // 11: locked
]

const MANUAL_POSITIONS: readonly number[] = [4, 9]

function buildScoresForGroup(words: readonly KotobaWord[]): Readonly<Record<string, number>> {
  const out: Record<string, number> = {}
  words.forEach((entry, i) => {
    out[entry.id] = SCORE_PATTERN[i % SCORE_PATTERN.length] ?? 0
  })
  return out
}

function manualUnlocksForGroup(words: readonly KotobaWord[]): readonly string[] {
  return words
    .filter((_, i) => MANUAL_POSITIONS.includes(i % SCORE_PATTERN.length))
    .map((entry) => entry.id)
}

const VARIETY_SCORES: Readonly<Record<string, number>> = ((): Readonly<Record<string, number>> => {
  const out: Record<string, number> = {}
  for (const level of Object.values(LEVEL_WORDS)) {
    for (const unit of level) {
      for (const group of unit) {
        Object.assign(out, buildScoresForGroup(group))
      }
    }
  }
  return out
})()

const VARIETY_MANUAL_WORDS: readonly string[] = ((): readonly string[] => {
  const out: string[] = []
  for (const level of Object.values(LEVEL_WORDS)) {
    for (const unit of level) {
      for (const group of unit) {
        out.push(...manualUnlocksForGroup(group))
      }
    }
  }
  return out
})()

const COMPLETE_SCORES: Readonly<Record<string, number>> = ((): Readonly<Record<string, number>> => {
  const out: Record<string, number> = {}
  for (const entry of ALL_WORDS) {
    out[entry.id] = MASTERY_THRESHOLD + (entry.id.charCodeAt(2) % 15)
  }
  return out
})()

// ── Unit builder ──────────────────────────────

function buildUnits(level: JlptLevel): readonly KotobaUnit[] {
  return LEVEL_WORDS[level].map((unitGroups, unitIndex): KotobaUnit => {
    const [g1, g2] = unitGroups
    const rangeLabels: readonly [string, string] = [
      UNIT_RANGES[unitIndex * 2],
      UNIT_RANGES[unitIndex * 2 + 1],
    ]
    return {
      id: `${level}-u${unitIndex + 1}`,
      label: `Unit ${unitIndex + 1}`,
      levelRange: UNIT_RANGE_LABELS[unitIndex],
      jlpt: level,
      groups: [
        {
          id: `${level}-u${unitIndex + 1}-g1`,
          label: rangeLabels[0],
          wordIds: g1.map((entry) => entry.id),
        },
        {
          id: `${level}-u${unitIndex + 1}-g2`,
          label: rangeLabels[1],
          wordIds: g2.map((entry) => entry.id),
        },
      ],
    }
  })
}

const LEVELS: Readonly<Record<JlptLevel, readonly KotobaUnit[]>> = {
  n5: buildUnits('n5'),
  n4: buildUnits('n4'),
  n3: buildUnits('n3'),
  n2: buildUnits('n2'),
  n1: buildUnits('n1'),
}

// ── Fixtures ──────────────────────────────────

export const EMPTY_STATE: KotobaDojoFixture = {
  levels: LEVELS,
  words: WORDS_BY_ID,
  mastery: {
    scores: {},
    manuallyUnlockedUnits: [],
    manuallyUnlockedWords: [],
  },
}

export const VARIETY_STATE: KotobaDojoFixture = {
  levels: LEVELS,
  words: WORDS_BY_ID,
  mastery: {
    scores: VARIETY_SCORES,
    manuallyUnlockedUnits: [],
    manuallyUnlockedWords: VARIETY_MANUAL_WORDS,
  },
}

export const COMPLETE_STATE: KotobaDojoFixture = {
  levels: LEVELS,
  words: WORDS_BY_ID,
  mastery: {
    scores: COMPLETE_SCORES,
    manuallyUnlockedUnits: [],
    manuallyUnlockedWords: ALL_WORDS.map((entry) => entry.id),
  },
}

// ── Access ────────────────────────────────────

export function getKotobaFixture(key: KotobaFixtureKey): KotobaDojoFixture {
  switch (key) {
    case 'empty':
      return EMPTY_STATE
    case 'variety':
      return VARIETY_STATE
    case 'complete':
      return COMPLETE_STATE
  }
}
