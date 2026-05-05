// ─────────────────────────────────────────────
// File: tests/performance/trace.spec.ts
// Purpose: Deeper performance trace tests for Sprint 8 verification.
//          Captures Chrome performance traces with CPU throttling,
//          asserts on long tasks during typing, and checks for
//          unexpected network activity during active gameplay.
//          Runs with 4x CPU throttle to simulate mid-range devices.
// Depends on: playwright.config.ts, production build
// ─────────────────────────────────────────────

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// ── Thresholds ────────────────────────────────

const MAX_TASK_DURATION_DURING_TYPING_S = 0.5
const MAX_UNEXPECTED_FETCHES_DURING_TYPING = 0
const CPU_THROTTLE_RATE = 4

// ── Helpers ───────────────────────────────────

const RESULTS_DIR = path.join(__dirname, 'results')

function ensureResultsDir(): void {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
  }
}

// ── Trace Tests ───────────────────────────────

test.describe('Performance traces', () => {
  test('no long tasks during active typing on /practice/kana', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE })

    await page.goto('/practice/kana', { waitUntil: 'networkidle' })

    const input = page.locator('[data-testid="practice-input"]')
    const gameReady = page.locator('[data-testid="practice-game-ready"]')

    await expect(gameReady.or(input)).toBeVisible({ timeout: 8_000 })

    if (!(await input.isVisible())) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
      await cdp.detach()
      test.skip(true, 'Input not visible (may be in tap/swipe mode)')
      return
    }

    await cdp.send('Performance.enable')

    await input.focus()
    await page.keyboard.type('aiueo', { delay: 100 })
    await page.waitForTimeout(500)

    const metrics = await cdp.send('Performance.getMetrics')
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await cdp.detach()

    const longTaskMetric = metrics.metrics.find((m) => m.name === 'TaskDuration')
    ensureResultsDir()
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'typing-metrics.json'),
      JSON.stringify({
        taskDuration: longTaskMetric?.value ?? 0,
        cpuThrottle: CPU_THROTTLE_RATE,
        timestamp: new Date().toISOString(),
      }),
    )

    expect(
      longTaskMetric?.value ?? 0,
      `TaskDuration during typing was ${longTaskMetric?.value}s (max ${MAX_TASK_DURATION_DURING_TYPING_S}s)`,
    ).toBeLessThan(MAX_TASK_DURATION_DURING_TYPING_S)
  })

  test('no unexpected network requests during active typing', async ({ page }) => {
    await page.goto('/practice/kana', { waitUntil: 'networkidle' })

    const input = page.locator('[data-testid="practice-input"]')
    const gameReady = page.locator('[data-testid="practice-game-ready"]')

    await expect(gameReady.or(input)).toBeVisible({ timeout: 6_000 })

    if (!(await input.isVisible())) {
      test.skip(true, 'Input not visible (may be in tap/swipe mode)')
      return
    }

    await page.waitForTimeout(1_000)

    const unexpectedRequests: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (
        !url.includes('localhost:3000/_next/') &&
        !url.includes('favicon') &&
        !url.startsWith('data:') &&
        !url.includes('vitals') &&
        !url.includes('speed-insights')
      ) {
        unexpectedRequests.push(url)
      }
    })

    await input.focus()
    await page.keyboard.type('kakikukeko', { delay: 80 })
    await page.waitForTimeout(500)

    expect(unexpectedRequests.length).toBeLessThanOrEqual(MAX_UNEXPECTED_FETCHES_DURING_TYPING)
  })

  test('no unexpected fetches during active gameplay on /practice/kotoba', async ({ page }) => {
    await page.goto('/practice/kotoba', { waitUntil: 'networkidle' })

    const gameReady = page.locator('[data-testid="practice-game-ready"]')
    await expect(gameReady).toBeVisible({ timeout: 6_000 })

    await page.waitForTimeout(1_000)

    const unexpectedRequests: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (
        !url.includes('localhost:3000/_next/') &&
        !url.includes('favicon') &&
        !url.startsWith('data:') &&
        !url.includes('vitals') &&
        !url.includes('speed-insights')
      ) {
        unexpectedRequests.push(url)
      }
    })

    const tapTargets = page.locator('[data-testid="practice-game-ready"] button')
    const tapCount = await tapTargets.count()
    if (tapCount > 0) {
      await tapTargets.first().click()
      await page.waitForTimeout(300)
    }

    expect(unexpectedRequests.length).toBeLessThanOrEqual(MAX_UNEXPECTED_FETCHES_DURING_TYPING)
  })

  test('route transition timing artifact', async ({ page }) => {
    ensureResultsDir()

    const timings: Record<string, number> = {}

    let start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    timings['cold-landing'] = Date.now() - start

    start = Date.now()
    await page.goto('/practice/kana', { waitUntil: 'domcontentloaded' })
    timings['cold-practice-kana'] = Date.now() - start

    await page.goto('/home', { waitUntil: 'networkidle' })
    const practiceLink = page.locator('[data-testid="nav-practice-kana"]')
    if (await practiceLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      start = Date.now()
      await practiceLink.click()
      const gameReady = page.locator('[data-testid="practice-game-ready"]')
      const input = page.locator('[data-testid="practice-input"]')
      await expect(gameReady.or(input)).toBeVisible({ timeout: 6_000 })
      timings['warm-home-to-practice-click'] = Date.now() - start
    }

    await page.goto('/practice/kana', { waitUntil: 'networkidle' })
    start = Date.now()
    await page.goto('/practice/kotoba', { waitUntil: 'domcontentloaded' })
    timings['warm-kana-to-kotoba'] = Date.now() - start

    await page.goto('/practice/kana', { waitUntil: 'networkidle' })
    const dojoLink = page.locator('[data-testid="nav-dojo-kana"]')
    if (await dojoLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      start = Date.now()
      await dojoLink.click()
      await page.waitForURL('**/dojo/kana', { timeout: 6_000 })
      timings['warm-practice-to-dojo-click'] = Date.now() - start
    }

    fs.writeFileSync(
      path.join(RESULTS_DIR, 'route-timings.json'),
      JSON.stringify({ timings, timestamp: new Date().toISOString() }, null, 2),
    )

    for (const [route, ms] of Object.entries(timings)) {
      expect(ms, `${route} took ${ms}ms`).toBeLessThan(6_000)
    }
  })
})
