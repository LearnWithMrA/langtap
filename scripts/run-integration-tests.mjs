// ─────────────────────────────────────────────
// File: scripts/run-integration-tests.mjs
// Purpose: Run the Supabase integration test suite against the local
//          Docker instance. Reads the anon and service role keys from
//          `supabase status` and passes them to vitest as env vars, so
//          the tests can never silently skip due to missing keys.
//          Fails fast if local Supabase is not running.
// Usage:   npm run test:integration
// Depends on: supabase CLI, vitest
// ─────────────────────────────────────────────

import { execFileSync, spawnSync } from 'node:child_process'

// ── Read keys from supabase status ────────────

function readLocalKeys() {
  let output
  try {
    output = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' })
  } catch {
    console.error(
      'Could not read `supabase status`. Is Docker running and local Supabase started?\n' +
        'Start it with: supabase start',
    )
    process.exit(1)
  }

  const get = (name) => {
    const match = output.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))
    return match ? match[1] : null
  }

  const anonKey = get('ANON_KEY')
  const serviceKey = get('SERVICE_ROLE_KEY')
  const apiUrl = get('API_URL') ?? 'http://127.0.0.1:54321'

  if (!anonKey || !serviceKey) {
    console.error('supabase status did not return ANON_KEY / SERVICE_ROLE_KEY. Aborting.')
    process.exit(1)
  }

  return { anonKey, serviceKey, apiUrl }
}

// ── Run vitest with the keys injected ─────────

const { anonKey, serviceKey, apiUrl } = readLocalKeys()

const result = spawnSync('npx', ['vitest', 'run', 'services/__tests__/integration'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SUPABASE_LOCAL_URL: apiUrl,
    SUPABASE_LOCAL_ANON_KEY: anonKey,
    SUPABASE_LOCAL_SERVICE_KEY: serviceKey,
  },
})

process.exit(result.status ?? 1)
