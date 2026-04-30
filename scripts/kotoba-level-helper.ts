// ─────────────────────────────────────────────
// File: scripts/kotoba-level-helper.ts
// Purpose: Helper for building Kotoba level definitions.
//          Tracks assigned words, searches only available words,
//          validates before writing, and suggests themed groups.
//          Run: npx tsx scripts/kotoba-level-helper.ts <command> [args]
// ─────────────────────────────────────────────

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// ── Types ─────────────────────────────────────

type Word = {
  id: string
  kana: string
  meaning: string
}

// ── Load data ─────────────────────────────────

function loadWordBank(level: string): Word[] {
  const filePath = join(ROOT, 'data', 'words', `${level.toLowerCase()}.ts`)
  const content = readFileSync(filePath, 'utf8')
  const regex = /id:\s*'([^']+)',\s*kana:\s*'([^']+)',\s*kanji:\s*[^,]+,\s*meaning:\s*'([^']+)'/g
  const words: Word[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    words.push({ id: match[1], kana: match[2], meaning: match[3] })
  }
  return words
}

function loadAssignedIds(level: string): Set<string> {
  const filePath = join(ROOT, 'data', 'words', 'kotoba-levels', `${level.toLowerCase()}.ts`)
  try {
    const content = readFileSync(filePath, 'utf8')
    const assigned = new Set<string>()
    const lines = content.split('\n').filter((l) => l.includes('wordIds:'))
    for (const line of lines) {
      const idsStr = line.slice(line.indexOf('wordIds:'))
      for (const m of idsStr.matchAll(/'([^']+)'/g)) {
        assigned.add(m[1])
      }
    }
    return assigned
  } catch {
    return new Set()
  }
}

function getAvailable(words: Word[], assigned: Set<string>): Word[] {
  return words.filter((w) => !assigned.has(w.id))
}

// ── Commands ──────────────────────────────────

function status(level: string): void {
  const words = loadWordBank(level)
  const assigned = loadAssignedIds(level)
  const available = getAvailable(words, assigned)
  const levelsNeeded = Math.floor(words.length / 12)
  const levelsDone = assigned.size / 12

  console.log(`\n${level.toUpperCase()} Status:`)
  console.log(`  Total words: ${words.length}`)
  console.log(`  Assigned: ${assigned.size}`)
  console.log(`  Available: ${available.length}`)
  console.log(`  Levels done: ~${Math.floor(levelsDone)}`)
  console.log(`  Levels needed: ${levelsNeeded} (${words.length % 12} leftover)`)
  console.log(`  Remaining levels: ${levelsNeeded - Math.floor(levelsDone)}`)
}

function search(level: string, keywords: string): void {
  const words = loadWordBank(level)
  const assigned = loadAssignedIds(level)
  const available = getAvailable(words, assigned)
  const kws = keywords
    .toLowerCase()
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const results = available.filter((w) => {
    const meaning = w.meaning.toLowerCase()
    return kws.some((k) => {
      if (k.startsWith('"') && k.endsWith('"')) {
        return meaning.includes(k.slice(1, -1))
      }
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const wordBoundary = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`)
      return wordBoundary.test(meaning)
    })
  })

  console.log(`\nSearch "${keywords}" (${results.length} results from ${available.length} available):`)
  for (const w of results.slice(0, 30)) {
    console.log(`  ${w.id} | ${w.kana} | ${w.meaning.slice(0, 55)}`)
  }
  if (results.length > 30) {
    console.log(`  ... and ${results.length - 30} more`)
  }
}

function validate(level: string): void {
  const words = loadWordBank(level)
  const wordIds = new Set(words.map((w) => w.id))

  const filePath = join(ROOT, 'data', 'words', 'kotoba-levels', `${level.toLowerCase()}.ts`)
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n').filter((l) => l.includes('wordIds:'))

  const seen = new Set<string>()
  const issues: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const themeMatch = line.match(/theme:\s*'([^']+)'/)
    const theme = themeMatch ? themeMatch[1] : '?'
    const idsStr = line.slice(line.indexOf('wordIds:'))
    const ids = [...idsStr.matchAll(/'([^']+)'/g)].map((m) => m[1])

    if (ids.length !== 12) {
      issues.push(`L${i + 1} (${theme}): has ${ids.length} words, expected 12`)
    }

    for (const id of ids) {
      if (!wordIds.has(id)) {
        issues.push(`L${i + 1} (${theme}): INVALID ID "${id}"`)
      }
      if (seen.has(id)) {
        issues.push(`L${i + 1} (${theme}): DUPLICATE ID "${id}"`)
      }
      seen.add(id)
    }
  }

  const remaining = [...wordIds].filter((id) => !seen.has(id))

  console.log(`\nValidation for ${level.toUpperCase()}:`)
  console.log(`  Levels: ${lines.length}`)
  console.log(`  Assigned: ${seen.size}`)
  console.log(`  Remaining: ${remaining.length}`)
  console.log(`  Issues: ${issues.length}`)

  if (issues.length > 0) {
    for (const issue of issues.slice(0, 20)) {
      console.log(`  ❌ ${issue}`)
    }
    if (issues.length > 20) {
      console.log(`  ... and ${issues.length - 20} more`)
    }
  } else {
    console.log(`  ✅ All valid`)
  }
}

function suggest(level: string, themeKeywords?: string): void {
  const words = loadWordBank(level)
  const assigned = loadAssignedIds(level)
  const available = getAvailable(words, assigned)

  if (themeKeywords) {
    const kws = themeKeywords
      .toLowerCase()
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const matches = available.filter((w) => {
      const meaning = w.meaning.toLowerCase()
      return kws.some((k) => {
        const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const wordBoundary = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`)
        return wordBoundary.test(meaning)
      })
    })

    if (matches.length < 12) {
      console.log(`\nOnly ${matches.length} matches for "${themeKeywords}". Need 12.`)
      for (const w of matches) {
        console.log(`  ${w.id} | ${w.kana} | ${w.meaning.slice(0, 55)}`)
      }
      return
    }

    const selected = matches.slice(0, 12)
    const ids = selected.map((w) => `'${w.id}'`).join(', ')
    console.log(`\nSuggested level (${selected.length} words):`)
    for (const w of selected) {
      console.log(`  ${w.id} | ${w.kana} | ${w.meaning.slice(0, 55)}`)
    }
    console.log(`\nCopy-paste line:`)
    console.log(`  { theme: 'THEME_NAME', wordIds: [${ids}] },`)
    return
  }

  // Auto-suggest: try common themes and pick the best cluster
  const themes: [string, string][] = [
    ['Family', 'parent,child,son,daughter,husband,wife,brother,sister,family,cousin,relative'],
    ['Food', 'food,eat,cook,meal,rice,bread,meat,fish,vegetable,fruit,dish,ingredient'],
    ['Drink', 'drink,water,tea,coffee,beer,wine,juice,milk,alcohol,bottle,cup'],
    ['Body', 'body,head,face,eye,ear,hand,arm,leg,foot,finger,neck,shoulder,stomach,chest'],
    ['Health', 'health,sick,ill,disease,hospital,doctor,medicine,cure,pain,injury,fever'],
    ['Nature', 'nature,tree,flower,grass,forest,mountain,river,sea,lake,island,earth,plant'],
    ['Weather', 'weather,rain,snow,wind,storm,cloud,sun,temperature,fog,thunder,flood'],
    ['Animals', 'animal,dog,cat,bird,horse,cow,pig,rabbit,insect,snake,fish,whale'],
    ['Transport', 'car,train,bus,plane,ship,bicycle,drive,ride,station,airport,road,bridge'],
    ['House', 'house,home,room,door,window,wall,floor,roof,kitchen,bathroom,furniture'],
    ['Clothes', 'clothes,wear,dress,shirt,coat,shoe,hat,uniform,fashion,cloth,cotton'],
    ['Work', 'work,job,office,company,business,salary,employ,factory,industry,career'],
    ['School', 'school,study,learn,teach,class,student,teacher,education,exam,university'],
    ['Money', 'money,price,cost,pay,profit,loss,tax,bank,income,spend,economy,budget'],
    ['Law', 'law,rule,court,judge,crime,police,arrest,prison,guilty,legal,govern'],
    ['War', 'war,fight,battle,army,soldier,weapon,attack,defend,enemy,peace,military'],
    ['Art', 'art,music,dance,sing,draw,paint,photo,film,theater,perform,concert'],
    ['Communication', 'speak,talk,say,tell,answer,discuss,explain,announce,report,inform'],
    ['Emotions', 'happy,sad,anger,fear,joy,worry,lonely,surprise,regret,shame,proud'],
    ['Movement', 'move,walk,run,jump,climb,fall,stand,sit,enter,leave,arrive,depart'],
    ['Action', 'hold,carry,push,pull,throw,catch,touch,hit,cut,break,open,close'],
    ['Description', 'big,small,long,short,wide,narrow,thick,thin,heavy,light,deep'],
    ['Quality', 'good,bad,beautiful,nice,excellent,poor,perfect,terrible,wonderful'],
    ['Time', 'time,hour,day,week,month,year,morning,evening,now,soon,already,still'],
    ['Position', 'above,below,top,bottom,front,behind,inside,outside,between,middle'],
    ['Society', 'society,culture,tradition,religion,ceremony,population,community,nation'],
  ]

  let bestTheme = ''
  let bestCount = 0
  for (const [name, kws] of themes) {
    const kwList = kws.split(',').map((k) => k.trim())
    const count = available.filter((w) => {
      const meaning = w.meaning.toLowerCase()
      return kwList.some((k) => {
        const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const wordBoundary = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`)
        return wordBoundary.test(meaning)
      })
    }).length
    if (count >= 12 && count > bestCount) {
      bestTheme = name
      bestCount = count
    }
  }

  if (bestTheme) {
    console.log(`\nBest available theme: "${bestTheme}" (${bestCount} matches)`)
    console.log(`Run: npx tsx scripts/kotoba-level-helper.ts suggest ${level} "${themes.find((t) => t[0] === bestTheme)![1]}"`)
  } else {
    console.log(`\nNo theme has 12+ matches. ${available.length} words remaining.`)
    console.log('Showing first 24 available words:')
    for (const w of available.slice(0, 24)) {
      console.log(`  ${w.id} | ${w.kana} | ${w.meaning.slice(0, 55)}`)
    }
  }
}

function addLevel(level: string, theme: string, idsStr: string): void {
  const words = loadWordBank(level)
  const wordIds = new Set(words.map((w) => w.id))
  const assigned = loadAssignedIds(level)

  const ids = idsStr
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  // Validate
  const issues: string[] = []
  if (ids.length !== 12) {
    issues.push(`Expected 12 IDs, got ${ids.length}`)
  }
  for (const id of ids) {
    if (!wordIds.has(id)) {
      issues.push(`Invalid ID: ${id} (not in ${level} word bank)`)
    }
    if (assigned.has(id)) {
      issues.push(`Duplicate: ${id} (already assigned to another level)`)
    }
  }

  if (issues.length > 0) {
    console.log('\n❌ Cannot add level:')
    for (const issue of issues) {
      console.log(`  - ${issue}`)
    }
    return
  }

  // Build level line
  const idsFormatted = ids.map((id) => `'${id}'`).join(', ')
  const levelLine = `  { theme: '${theme}', wordIds: [${idsFormatted}] },`

  // Append to file
  const filePath = join(ROOT, 'data', 'words', 'kotoba-levels', `${level.toLowerCase()}.ts`)
  const content = readFileSync(filePath, 'utf8')
  const newContent = content.replace(/\n\]\s*$/, `\n${levelLine}\n]\n`)
  writeFileSync(filePath, newContent)

  console.log(`\n✅ Added level "${theme}" with ${ids.length} words`)
  console.log(`  Assigned: ${assigned.size + ids.length}, Remaining: ${wordIds.size - assigned.size - ids.length}`)
}

// ── CLI ───────────────────────────────────────

const [, , command, ...args] = process.argv

switch (command) {
  case 'status':
    status(args[0] || 'n3')
    break
  case 'search':
    search(args[0] || 'n3', args.slice(1).join(' '))
    break
  case 'validate':
    validate(args[0] || 'n3')
    break
  case 'suggest':
    suggest(args[0] || 'n3', args.slice(1).join(' '))
    break
  case 'add':
    if (args.length < 3) {
      console.log('Usage: add <level> <theme> <id1,id2,...>')
      break
    }
    addLevel(args[0], args[1], args.slice(2).join(','))
    break
  default:
    console.log(`
Kotoba Level Helper
Usage: npx tsx scripts/kotoba-level-helper.ts <command> [args]

Commands:
  status <level>                    Show progress for a JLPT level
  search <level> <keywords>         Search available words by meaning keywords
  validate <level>                  Validate all levels for a JLPT level
  suggest <level> [keywords]        Suggest a themed group of 12 available words
  add <level> <theme> <ids...>      Add a level (validates before writing)

Examples:
  npx tsx scripts/kotoba-level-helper.ts status n3
  npx tsx scripts/kotoba-level-helper.ts search n3 food,cook,meal,dish
  npx tsx scripts/kotoba-level-helper.ts suggest n3 transport,car,train,bus
  npx tsx scripts/kotoba-level-helper.ts validate n3
  npx tsx scripts/kotoba-level-helper.ts add n3 "Food and Cooking" 1234567,2345678,...
    `)
}
