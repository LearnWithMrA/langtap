// ─────────────────────────────────────────────
// File: vitest.config.ts
// Purpose: Vitest 3 configuration for LangTap.
//          Default environment is happy-dom (covers component and hook tests).
//          Engine/service/store tests run in happy-dom too (no DOM APIs used).
//          pool: 'forks' prevents zombie worker processes.
// Depends on: vitest, @vitejs/plugin-react, happy-dom
// ─────────────────────────────────────────────

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    // Mirrors the @/* path alias from tsconfig.json
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  test: {
    // ── Globals ───────────────────────────────────────────────
    // describe, it, expect, vi available without imports
    globals: true,

    // ── Environment ───────────────────────────────────────────
    // happy-dom for all tests. Faster than jsdom, sufficient for
    // component, hook, and pure-logic tests.
    environment: 'happy-dom',

    // ── Pool ──────────────────────────────────────────────────
    // forks pool avoids zombie worker processes that can occur
    // with the default threads pool under certain Node versions.
    pool: 'forks',

    // ── Setup files ───────────────────────────────────────────
    // Extends expect with @testing-library/jest-dom matchers
    setupFiles: ['./vitest.setup.ts'],

    // ── Test discovery ────────────────────────────────────────
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],

    // ── Coverage ──────────────────────────────────────────────
    coverage: {
      provider: 'v8',
      include: ['engine/**', 'components/**', 'hooks/**', 'stores/**', 'services/**'],
      exclude: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    },
  },
})
