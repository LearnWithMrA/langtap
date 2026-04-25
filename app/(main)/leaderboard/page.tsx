// ─────────────────────────────────────────────
// File: app/(main)/leaderboard/page.tsx
// Purpose: Leaderboard screen route. Visual shell with fixture
//          data (Sprint 2B). Real Supabase data wired in Sprint 9.
// Depends on: components/leaderboard/leaderboard-client.tsx
// ─────────────────────────────────────────────

import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client'

export default function LeaderboardPage(): React.ReactNode {
  return <LeaderboardClient />
}
