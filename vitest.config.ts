// ─────────────────────────────────────────────
// File: vitest.config.ts
// Purpose: Vitest 3 configuration for LangTap.
//          Default environment is Node (engine/service/store tests).
//          Component and hook test files declare their own environment
//          with a docblock: // @vitest-environment jsdom
// Depends on: vitest, @vitejs/plugin-react, jsdom
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
    // Node for engine, service, and store tests (pure logic, no DOM).
    // Component and hook tests add // @vitest-environment jsdom
    // at the top of each file to opt in to the DOM environment.
    environment: 'node',

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
