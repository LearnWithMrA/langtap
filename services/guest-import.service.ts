// ─────────────────────────────────────────────
// File: services/guest-import.service.ts
// Purpose: Thin wrapper calling import_guest_progress and
//          import_legacy_progress RPCs. Returns typed results
//          with error classification. Distinguishes classified
//          server responses from transport failures.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

import { createBrowserSupabaseClient } from '@/services/supabase-browser'

// ── Types ─────────────────────────────────────

export type ImportStatus =
  | 'success'
  | 'rejected_abuse'
  | 'rejected_malformed'
  | 'rejected_duplicate'
  | 'error'

export type ImportReport = {
  importedMasteryCount: number
  importedWordMasteryCount: number
  importedUnlockCount: number
  droppedCount: number
  clampedCount: number
}

export type ImportResult =
  | { ok: true; status: 'success'; report: ImportReport }
  | { ok: false; status: Exclude<ImportStatus, 'success'>; message: string }

export type ImportMasteryRow = {
  character_id: string
  score: number
  learning_score: number
}

export type ImportWordMasteryRow = {
  word_id: string
  score: number
}

export type ImportPayload = {
  mastery: ImportMasteryRow[]
  word_mastery: ImportWordMasteryRow[]
  manual_unlocks: string[]
  word_manual_unlocks: string[]
}

// ── Helpers ───────────────────────────────────

function parseImportResponse(data: unknown): ImportResult {
  if (data === null || typeof data !== 'object') {
    return { ok: false, status: 'error', message: 'Invalid response from server.' }
  }

  const d = data as Record<string, unknown>
  const status = d['status'] as string | undefined

  if (status === 'success') {
    return {
      ok: true,
      status: 'success',
      report: {
        importedMasteryCount:
          typeof d['imported_mastery_count'] === 'number' ? d['imported_mastery_count'] : 0,
        importedWordMasteryCount:
          typeof d['imported_word_mastery_count'] === 'number'
            ? d['imported_word_mastery_count']
            : 0,
        importedUnlockCount:
          typeof d['imported_unlock_count'] === 'number' ? d['imported_unlock_count'] : 0,
        droppedCount: typeof d['dropped_count'] === 'number' ? d['dropped_count'] : 0,
        clampedCount: typeof d['clamped_count'] === 'number' ? d['clamped_count'] : 0,
      },
    }
  }

  const message = typeof d['message'] === 'string' ? d['message'] : 'Import failed.'

  if (status === 'rejected_abuse') {
    return { ok: false, status: 'rejected_abuse', message }
  }
  if (status === 'rejected_malformed') {
    return { ok: false, status: 'rejected_malformed', message }
  }
  if (status === 'rejected_duplicate') {
    return { ok: false, status: 'rejected_duplicate', message }
  }

  return { ok: false, status: 'error', message }
}

// ── Main exports ──────────────────────────────

export async function importGuestProgress(payload: ImportPayload): Promise<ImportResult> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('import_guest_progress', {
    p_payload: payload,
  })

  if (error) {
    return { ok: false, status: 'error', message: 'Failed to import guest progress.' }
  }

  return parseImportResponse(data)
}

export async function importLegacyProgress(payload: ImportPayload): Promise<ImportResult> {
  const supabase = createBrowserSupabaseClient()

  const { data, error } = await supabase.rpc('import_legacy_progress', {
    p_payload: payload,
  })

  if (error) {
    return { ok: false, status: 'error', message: 'Failed to import legacy progress.' }
  }

  return parseImportResponse(data)
}
