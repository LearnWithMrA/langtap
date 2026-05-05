// ─────────────────────────────────────────────
// File: test-utils/async-gate.tsx
// Purpose: Shared test helpers for async initialization gates.
//          Provides deferred promises, a real StrictMode wrapper,
//          and assertion utilities that catch the "stuck loading"
//          class of bugs introduced when hooks use eager init flags
//          that break under React Strict Mode double-fire.
// Depends on: react, @testing-library/react
// ─────────────────────────────────────────────

import React from 'react'
import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import type { RenderHookOptions, RenderHookResult } from '@testing-library/react'

// ── Deferred promise ─────────────────────────

export type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

export function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {}
  let reject: (reason: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// ── StrictMode wrapper ───────────────────────

function StrictWrapper({ children }: { children: ReactNode }): ReactNode {
  return <React.StrictMode>{children}</React.StrictMode>
}

export function renderHookStrict<TResult>(
  hook: () => TResult,
  options?: Omit<RenderHookOptions<unknown>, 'wrapper'>,
): RenderHookResult<TResult, unknown> {
  return renderHook(hook, { ...options, wrapper: StrictWrapper })
}

// ── Loading gate assertion ───────────────────

export async function expectLoadingClears<TResult extends { isLoading: boolean }>(
  result: { current: TResult },
  timeoutMs = 3000,
): Promise<void> {
  await waitFor(
    () => {
      expect(result.current.isLoading).toBe(false)
    },
    { timeout: timeoutMs },
  )
}
