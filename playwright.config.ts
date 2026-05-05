// ─────────────────────────────────────────────
// File: playwright.config.ts
// Purpose: Configuration for Playwright performance smoke tests.
//          Runs against a local production build (next build && next start).
//          Includes desktop and mobile viewport projects.
// Depends on: @playwright/test
// ─────────────────────────────────────────────

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/performance',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  reporter: [['list'], ['json', { outputFile: 'tests/performance/results.json' }]],
})
