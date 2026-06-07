// ─────────────────────────────────────────────
// File: services/factory-reset.service.ts
// Purpose: Client wrapper for the factory_reset RPC. Non-optimistic:
//          returns both new epoch values on success. Caller updates
//          local state only after RPC confirms. Rejects anonymous
//          users server-side.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type FactoryResetResult = {
  newMasteryEpoch: number
  newWordMasteryEpoch: number
}

// ── Helpers ───────────────────────────────────

function parseFactoryResetResponse(data: unknown): FactoryResetResult | null {
  if (data === null || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d['new_mastery_epoch'] !== 'number') return null
  if (typeof d['new_word_mastery_epoch'] !== 'number') return null
  return {
    newMasteryEpoch: d['new_mastery_epoch'] as number,
    newWordMasteryEpoch: d['new_word_mastery_epoch'] as number,
  }
}

// ── Main export ───────────────────────────────

export async function factoryReset(): Promise<ServiceResult<FactoryResetResult>> {
  try {
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.rpc('factory_reset')

    if (error) return { ok: false, error: `Full reset failed (${error.code}): ${error.message}` }

    const result = parseFactoryResetResponse(data)
    if (!result) return { ok: false, error: 'Full reset failed: invalid response from server.' }

    return { ok: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: `Full reset failed: ${message}` }
  }
}
