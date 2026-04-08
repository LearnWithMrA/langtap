// ─────────────────────────────────────────────
// File: vitest.setup.ts
// Purpose: Global test setup. Extends Vitest's expect with
//          @testing-library/jest-dom matchers so every test file
//          can use toBeInTheDocument, toHaveValue, etc. without
//          importing them individually.
// ─────────────────────────────────────────────

import '@testing-library/jest-dom'
