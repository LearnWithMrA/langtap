/* global module */
// ─────────────────────────────────────────────
// File: lighthouserc.js
// Purpose: Lighthouse CI configuration. Runs automated audits
//          against a local production build on multiple URLs with
//          repeated runs for stable medians. Asserts numeric
//          budgets for performance metrics, accessibility, and
//          resource sizes. Run with: npm run lighthouse
// Depends on: @lhci/cli, next build + next start
// ─────────────────────────────────────────────

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/home',
        'http://localhost:3000/practice/kana',
        'http://localhost:3000/practice/kotoba',
        'http://localhost:3000/dojo/kana',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.55 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['warn', { maxNumericValue: 3000 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 600000 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 200000 }],
        'resource-summary:total:requestCount': ['warn', { maxNumericValue: 100 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
