// ─────────────────────────────────────────────
// File: eslint.config.mjs
// Purpose: ESLint 9 flat config for LangTap.
//          Enforces TypeScript strict rules, React/hooks rules,
//          Next.js rules, and Prettier compatibility.
// Depends on: @eslint/js, typescript-eslint, eslint-plugin-react,
//             eslint-plugin-react-hooks, @next/eslint-plugin-next,
//             eslint-config-prettier
// ─────────────────────────────────────────────

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // ── Ignore patterns ───────────────────────────────────────────

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'next-env.d.ts',
      'update_shrubs.js',
      'scripts/**',
    ],
  },

  // ── Base rules ────────────────────────────────────────────────

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── React + Next.js + hooks ───────────────────────────────────

  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        // Suppress version detection warning - React 19
        version: '19',
      },
    },
    rules: {
      // React - JSX transform means no manual React import needed
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Hooks - strict enforcement
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Next.js - critical navigation rule
      '@next/next/no-html-link-for-pages': 'error',

      // TypeScript - enforce explicit types, ban any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Prevent silent error swallowing
      'no-console': 'warn',
    },
  },

  // ── Prettier - must be last to override formatting rules ──────

  prettierConfig,
)
