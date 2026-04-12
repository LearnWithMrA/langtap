// ─────────────────────────────────────────────
// File: services/supabase.ts
// Purpose: Re-exports the browser Supabase client for backwards
//          compatibility with the folder structure in ARCHITECTURE.md.
//          The canonical implementation is services/supabase-browser.ts.
//          Server-side contexts use services/supabase-server.ts.
// Depends on: services/supabase-browser.ts
// ─────────────────────────────────────────────

export { createBrowserSupabaseClient } from '@/services/supabase-browser'
