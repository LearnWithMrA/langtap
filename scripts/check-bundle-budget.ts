// ─────────────────────────────────────────────
// File: scripts/check-bundle-budget.ts
// Purpose: Post-build script that parses the Next.js build output
//          to check per-route First Load JS against defined budgets.
//          Exits with code 1 if any route exceeds its budget.
//          Usage: next build 2>&1 | npx tsx scripts/check-bundle-budget.ts
//          Or:    npm run build:budget
// ─────────────────────────────────────────────

// ── Types ─────────────────────────────────────

type BudgetEntry = {
  route: string
  maxFirstLoadKB: number
}

type ParsedRoute = {
  route: string
  sizeKB: number
  firstLoadKB: number
}

// ── Budgets ───────────────────────────────────
// Based on G1 production build verification (Session 90, 2026-05-04).
// Headroom is ~25% above current measured values.
// Tighten these as you optimise; never loosen without discussion.
//
// G1 actuals: practice 188 kB, home 117 kB, landing 238 kB,
// dojo/kana ~117 kB, dojo/kotoba ~125 kB, leaderboard ~110 kB, profile ~110 kB.

const BUDGETS: BudgetEntry[] = [
  { route: '/', maxFirstLoadKB: 300 },
  { route: '/home', maxFirstLoadKB: 150 },
  { route: '/practice/kana', maxFirstLoadKB: 240 },
  { route: '/practice/kotoba', maxFirstLoadKB: 240 },
  { route: '/dojo/kana', maxFirstLoadKB: 150 },
  { route: '/dojo/kotoba', maxFirstLoadKB: 160 },
  { route: '/leaderboard', maxFirstLoadKB: 140 },
  { route: '/profile', maxFirstLoadKB: 140 },
]

const GLOBAL_MAX_FIRST_LOAD_KB = 300
const MAX_SINGLE_CHUNK_KB = 150

// ── Parse build stdout ────────────────────────

function parseKB(str: string): number {
  const trimmed = str.trim()
  if (trimmed.endsWith('kB')) {
    return parseFloat(trimmed.replace('kB', ''))
  }
  if (trimmed.endsWith('B')) {
    return parseFloat(trimmed.replace('B', '')) / 1024
  }
  return parseFloat(trimmed)
}

function parseBuildOutput(stdout: string): ParsedRoute[] {
  const results: ParsedRoute[] = []

  // Next.js build output lines look like:
  // ┌ ○ /                                    5.25 kB         174 kB
  // ├ ○ /dojo/kana                         8.35 kB         117 kB
  // └ ○ /sign-up                           1.91 kB         114 kB
  const routeRegex = /[┌├└]\s+[○ƒ]\s+(\/\S*)\s+([\d.]+\s*(?:kB|B))\s+([\d.]+\s*(?:kB|B))/g

  let match = routeRegex.exec(stdout)
  while (match !== null) {
    results.push({
      route: match[1],
      sizeKB: parseKB(match[2]),
      firstLoadKB: parseKB(match[3]),
    })
    match = routeRegex.exec(stdout)
  }

  return results
}

// ── Check budgets ─────────────────────────────

async function main(): Promise<void> {
  const chunks: string[] = []

  process.stdin.setEncoding('utf-8')
  for await (const chunk of process.stdin) {
    const text = typeof chunk === 'string' ? chunk : String(chunk)
    process.stdout.write(text)
    chunks.push(text)
  }

  const fullOutput = chunks.join('')
  const routes = parseBuildOutput(fullOutput)

  if (routes.length === 0) {
    console.error('\n  No routes parsed from build output.')
    console.error('  Usage: next build 2>&1 | npx tsx scripts/check-bundle-budget.ts\n')
    process.exit(1)
  }

  let failed = false

  console.log('\n  Bundle budget check:')
  console.log('  ' + '-'.repeat(64))

  for (const route of routes) {
    const budget = BUDGETS.find((b) => b.route === route.route)
    if (!budget) continue

    const maxKB = budget.maxFirstLoadKB
    const over = route.firstLoadKB > maxKB
    const marker = over ? '  ✗' : '  ✓'
    const status = over ? 'OVER' : 'ok'

    if (over) failed = true

    console.log(
      `${marker} ${route.route.padEnd(25)} ${String(route.firstLoadKB).padStart(7)} kB / ${String(maxKB).padStart(4)} kB  ${status}`,
    )
  }

  // Check unbudgeted routes against global max
  for (const route of routes) {
    const hasBudget = BUDGETS.some((b) => b.route === route.route)
    if (hasBudget) continue
    if (route.route.startsWith('/api/')) continue
    if (route.route.includes('icon') || route.route.includes('apple-icon')) continue

    if (route.firstLoadKB > GLOBAL_MAX_FIRST_LOAD_KB) {
      failed = true
      console.log(
        `  ✗ ${route.route.padEnd(25)} ${String(route.firstLoadKB).padStart(7)} kB / ${String(GLOBAL_MAX_FIRST_LOAD_KB).padStart(4)} kB  OVER (global)`,
      )
    }
  }

  // Check largest individual route chunk (sizeKB = route-specific JS, not shared)
  console.log('\n  Largest chunk check:')
  console.log('  ' + '-'.repeat(64))

  for (const route of routes) {
    if (route.route.startsWith('/api/')) continue
    if (route.route.includes('icon') || route.route.includes('apple-icon')) continue

    if (route.sizeKB > MAX_SINGLE_CHUNK_KB) {
      failed = true
      console.log(
        `  ✗ ${route.route.padEnd(25)} ${String(route.sizeKB).padStart(7)} kB / ${String(MAX_SINGLE_CHUNK_KB).padStart(4)} kB  OVER (chunk)`,
      )
    }
  }

  if (!failed) {
    console.log('  ✓ All route chunks within limit')
  }

  console.log('  ' + '-'.repeat(64))

  if (failed) {
    console.error('\n  Bundle budget exceeded. Split imports or move data server-side.\n')
    process.exit(1)
  }

  console.log('\n  All budgeted routes within limits.\n')
}

main()
