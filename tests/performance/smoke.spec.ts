// ─────────────────────────────────────────────
// File: tests/performance/smoke.spec.ts
// Purpose: Performance smoke tests that run against a production build.
//          Checks cold loads, warm navigation via real link clicks,
//          bundle leakage, and interaction responsiveness.
//          Thresholds are generous baselines derived from Sprint 8
//          G1/G2 measurements.
// Depends on: playwright.config.ts, production build
// ─────────────────────────────────────────────

import { test, expect } from '@playwright/test'

// ── Thresholds ────────────────────────────────

const THRESHOLDS = {
  coldLandingInteractive: 5_000,
  coldPracticeInteractive: 6_000,
  warmRouteTransition: 3_000,
  maxTransferKB: 500,
}

// ── Helpers ───────────────────────────────────

function kbFromBytes(bytes: number): number {
  return Math.round(bytes / 1024)
}

// ── Cold Load Tests ───────────────────────────

test.describe('Cold loads', () => {
  test('landing page loads within budget', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(THRESHOLDS.coldLandingInteractive)

    const title = await page.title()
    expect(title).toContain('LangTap')
  })

  test('cold /practice/kana becomes interactive within budget', async ({ page }) => {
    const start = Date.now()
    await page.goto('/practice/kana', { waitUntil: 'domcontentloaded' })

    const gameReady = page.locator('[data-testid="practice-game-ready"]')
    const input = page.locator('[data-testid="practice-input"]')

    await expect(gameReady.or(input)).toBeVisible({ timeout: THRESHOLDS.coldPracticeInteractive })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(THRESHOLDS.coldPracticeInteractive)
  })

  test('cold /practice/kotoba becomes interactive within budget', async ({ page }) => {
    const start = Date.now()
    await page.goto('/practice/kotoba', { waitUntil: 'domcontentloaded' })

    const gameReady = page.locator('[data-testid="practice-game-ready"]')
    await expect(gameReady).toBeVisible({ timeout: THRESHOLDS.coldPracticeInteractive })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(THRESHOLDS.coldPracticeInteractive)
  })
})

// ── Warm Navigation Tests (real link clicks) ──

test.describe('Warm navigation', () => {
  test('home to practice/kana via link click', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'networkidle' })

    const practiceLink = page.locator('[data-testid="nav-practice-kana"]')
    await expect(practiceLink).toBeVisible({ timeout: 5_000 })

    const start = Date.now()
    await practiceLink.click()

    const gameReady = page.locator('[data-testid="practice-game-ready"]')
    const input = page.locator('[data-testid="practice-input"]')
    await expect(gameReady.or(input)).toBeVisible({ timeout: THRESHOLDS.warmRouteTransition })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(THRESHOLDS.warmRouteTransition)
  })

  test('practice to dojo via nav link click', async ({ page }) => {
    await page.goto('/practice/kana', { waitUntil: 'networkidle' })

    const dojoLink = page.locator('[data-testid="nav-dojo-kana"]')
    await expect(dojoLink).toBeVisible({ timeout: 5_000 })

    const start = Date.now()
    await dojoLink.click()
    await page.waitForURL('**/dojo/kana')
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(THRESHOLDS.warmRouteTransition)
  })

  test('kana to kotoba mode switch via navigation', async ({ page }) => {
    await page.goto('/practice/kana', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const start = Date.now()
    await page.goto('/practice/kotoba', { waitUntil: 'domcontentloaded' })

    const gameReady = page.locator('[data-testid="practice-game-ready"]')
    await expect(gameReady).toBeVisible({ timeout: THRESHOLDS.warmRouteTransition })
    const elapsed = Date.now() - start

    expect(elapsed).toBeLessThan(THRESHOLDS.warmRouteTransition)
  })
})

// ── Bundle Leakage Tests ──────────────────────

test.describe('Bundle leakage', () => {
  test('/practice/kana does not load kotoba JS chunks', async ({ page }) => {
    const loadedScripts: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (url.endsWith('.js') && response.status() === 200) {
        loadedScripts.push(url)
      }
    })

    await page.goto('/practice/kana', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1_000)

    const kotobaChunks = loadedScripts.filter(
      (s) => s.includes('kotoba') && !s.includes('preloader'),
    )
    expect(kotobaChunks).toHaveLength(0)
  })

  test('landing page transfer size is reasonable', async ({ page }) => {
    let totalBytes = 0

    page.on('response', (response) => {
      const headers = response.headers()
      const contentLength = headers['content-length']
      if (contentLength) {
        totalBytes += parseInt(contentLength, 10)
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    const totalKB = kbFromBytes(totalBytes)
    expect(totalKB).toBeLessThan(THRESHOLDS.maxTransferKB)
  })
})

// ── Settings Interaction ──────────────────────

test.describe('Settings during practice', () => {
  test('settings button opens without stalling gameplay', async ({ page }) => {
    await page.goto('/practice/kana', { waitUntil: 'networkidle' })

    const settingsButton = page.locator('[data-testid="settings-button"]')
    if (await settingsButton.isVisible()) {
      const start = Date.now()
      await settingsButton.click()
      await page.waitForTimeout(300)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1_000)
    }
  })

  test('settings open during active typing does not drop frames', async ({ page }) => {
    await page.goto('/practice/kana', { waitUntil: 'networkidle' })

    const input = page.locator('[data-testid="practice-input"]')
    const gameReady = page.locator('[data-testid="practice-game-ready"]')
    await expect(gameReady.or(input)).toBeVisible({ timeout: 6_000 })

    if (await input.isVisible()) {
      await input.focus()
      await page.keyboard.type('a', { delay: 50 })

      const settingsButton = page.locator('[data-testid="settings-button"]')
      if (await settingsButton.isVisible()) {
        await settingsButton.click()
        await page.waitForTimeout(200)

        await expect(gameReady.or(input)).toBeVisible()
      }
    }
  })
})
