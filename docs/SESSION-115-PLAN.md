# Session 115 Plan - Off-Sprint Bug Fixes + Polish

This document captures everything discussed in Session 114 so the next chat has full context.
All code changes below are UNCOMMITTED. Do not commit until Session 115 completes all remaining tasks.

---

## Owner's original bug report (verbatim issues)

The owner reported these issues from production testing on 2026-06-07:

1. "When I log into the game with my account the game window and trial and etc nothing loads. If I go to kotoba or kana the game window doesn't open."
2. "I made a new account. Trial opened up which then progressed to the full game but when I navigated away it disappeared and then wouldn't come back."
3. "The height of the bug report button is bigger than the lofi button. When I click it, it opens up but it opens up the options to select which you want already. Instead of just opening the window."
4. "In profile, the full reset, with typing 'reset' just says 'failed' to reset problems. We need error codes so I can know and tell you what's happening. No idea what's happened."
5. "I didn't want a full reset. I wanted the reset kana and reset kotoba to act as a full reset for their categories. But since we have full reset keep it."
6. "When I click full reset it opens and zooms in as it selects the cell to type in the reset. Same for delete account. Why does it? I don't want that to happen."
7. "We are able to change km to miles. Let's actually just remove that altogether from the settings and just leave it at meters."
8. "The first set of words are unlocked for all levels N1-5 for my account. This was also true for the new account. Even though on onboarding I selected N5 it unlocked the first 6 characters for all levels."
9. "On the full account we still have the message that says you've finished the trial don't forget to sign up. We need this changed for the full account."
10. "I have turned off guest tokens on supabase. So the tokens should be working and loading all the game side parts for full users."

### Root causes found:

**Game window not loading (issue 1, 2):** Race condition in auth-initializer.tsx. onAuthStateChange fires TOKEN_REFRESHED for the same user, which unconditionally reset isServerHydrated=false, migrationPhaseComplete=false, and profile=null. The store-hydrator's dedup guard (lastUserIdRef.current === currentUserId) prevented re-loading for the same user, so isServerHydrated stayed false permanently. PracticeClient line 582 blocks rendering on isServerHydrated.

**Factory reset PGRST202 error (issue 4):** Production Supabase database was missing migrations. Owner had not run `supabase db push`. Four migrations were not applied: factory_reset RPC, practice_activity_events table, factory_reset update, bug_reports table. Owner fixed this during the session by running `supabase db push`.

**Progress reverting on refresh:** Two causes: (a) the auth race condition above, and (b) the sync architecture only flushed dirty scores to the server on visibilitychange (tab hidden). There was NO periodic timer, NO post-prompt sync. Refreshing the page dropped all progress since the last tab-hide. Fixed by adding void flushDirty() after every word completion.

**JLPT word unlock (issue 8):** Pre-existing by design. engine/kotoba-progression.ts line 55: `if (stepIndex === 0) return true` auto-unlocked Step 0 for ALL JLPT levels regardless of user selection. Fixed by adding step0Unlocked parameter that checks JLPT_RANK[activeLevel] <= JLPT_RANK[userLevel].

---

## What Session 114 already fixed (uncommitted code)

### Files changed with descriptions:

1. `components/performance/auth-initializer.tsx` - In onAuthStateChange, added `if (userId === activeUserId) return` to skip reset for same-user token refreshes. Only resets on actual user change.

2. `components/performance/store-hydrator.tsx` - Wrapped loadServerData() in try/catch with setServerHydrated(true) in catch block. Added useEffect to clear lastUserIdRef when isServerHydrated is externally reset.

3. `components/layout/practice-client.tsx` - Added PracticeErrorShell with error codes (AUTH_LOADING, DAILY_CAP, PROFILE_LOAD, SERVER_HYDRATION) shown after 8s stuck timeout. Trial banner conditions now include `&& isGuest`.

4. `components/layout/bug-report-button.tsx` - Simplified from triple-nested circle/pill/SVG to plain "?" text in a single w-8 h-8 translucent rounded box.

5. `components/layout/bug-report-modal.tsx` - Changed focus target from first form element (select, which auto-opened on mobile) to dialog panel itself (tabIndex={-1}).

6. `services/factory-reset.service.ts` - Error messages now include Supabase error code: `Full reset failed (${error.code}): ${error.message}`

7. `services/reset.service.ts` - Same pattern: `Kana reset failed (${error.code}): ${error.message}` and `Word reset failed (${error.code}): ${error.message}`

8. `hooks/useResetActions.ts` - resetKana now clears: mastery scores, learning scores, unlocks, counters, kana dialogue state (kana-*, sokuon-*, longvowel-*, dual-mnemonic-*), dojo kana tips, frozen prompt, practice counters. resetKotoba now clears: word mastery, word unlocks, kotoba dialogue state (kotoba-*), dojo kotoba tips. Both include Supabase error code in catch blocks.

9. `hooks/useDialogueSeen.ts` - Added clearDialoguesByPrefix(prefixes: string[]) for selective dialogue reset by category.

10. `components/profile/reset-progress.tsx` - Removed autoFocus from factory reset input.

11. `components/profile/profile-client.tsx` - Removed autoFocus from delete account input.

12. `components/profile/account-settings.tsx` - Removed autoFocus from username input. Removed distance unit toggle (handler, variable, UI row) entirely. Removed unused updateProfile import. Updated file header. Removed border-b from password row (now last row).

13. `engine/kotoba-progression.ts` - Added step0Unlocked parameter (default true) to isKotobaStepUnlocked, getActiveKotobaStepIndex, getUnlockedKotobaWordIds. Exported JLPT_RANK. Step 0 returns step0Unlocked instead of hardcoded true.

14. `components/layout/kotoba-dojo-client.tsx` - Imported JLPT_RANK, useUserStore, useOnboardingStore. Computes userJlptLevel from profile/onboarding. Computes step0Unlocked = JLPT_RANK[activeLevel] <= JLPT_RANK[userJlptLevel]. Passes to getUnlockedKotobaWordIds.

15. `hooks/usePracticeSession.ts` - Imported useSyncContext. Added void flushDirty() after every word completion in handleWordComplete. Fire-and-forget (non-blocking).

16. `hooks/useKotobaPracticeSession.ts` - Same pattern: imported useSyncContext, added void flushDirty() after recordWordComplete.

17. `hooks/__tests__/useStreak.test.ts` - Fixed date-sensitive streak test: replaced hardcoded dates (2026-06-03/04/05) with relative dates (today, yesterday, day before).

18. `hooks/__tests__/useResetActions.test.ts` - Updated to expect clearDialoguesByPrefix calls, counterResetAll for kana, and new error message format.

19. `services/__tests__/factory-reset.service.test.ts` - Updated error message expectations to use toContain('Full reset failed').

20. `components/layout/__tests__/bug-report-button.test.tsx` - Updated touch target test from w-11/h-11 to w-8/h-8.

21. `components/profile/__tests__/reset-progress.test.tsx` - Updated error message expectation to use regex /Full reset failed/.

22. `CLAUDE.md` - Added Section 5D: Supabase Integration Tests mandate.

23. `docs/BACKEND.md` - Added integration test mandate note.

### New files created:

24. `services/__tests__/integration/setup.ts` - Shared test user setup with env var keys (SUPABASE_LOCAL_ANON_KEY, SUPABASE_LOCAL_SERVICE_KEY). Creates unique users per test file. Gracefully skips when Supabase not running.

25-31. Eight integration test files (55 tests total):
- `profile.integration.test.ts` (8 tests): auto-create profile trigger, read own profile, RLS cross-user, change_username with cooldown/format/special chars
- `kana.integration.test.ts` (8 tests): checkpoint_mastery, load_mastery_snapshot, manual_unlocks, reset with epoch increment, RLS anonymous, catalog 234 chars
- `kotoba.integration.test.ts` (6 tests): checkpoint_word_mastery, load_word_mastery_snapshot, word_manual_unlocks, reset, RLS, catalog
- `home.integration.test.ts` (6 tests): get_daily_usage, increment_daily_distance with dedup, get_leaderboard, record_practice_activity, factory_reset
- `leaderboard.integration.test.ts` (5 tests): start_leaderboard_session, finalize_leaderboard_session, get_leaderboard all_time/week/kotoba
- `streak.integration.test.ts` (4 tests): record_practice_activity, dedup, accumulation, read own events
- `bug-report.integration.test.ts` (4 tests): RLS auth/admin/anon write, user can't read
- `edge-cases.integration.test.ts` (12 tests): epoch stale-write rejection, cross-user RLS (4 tables), username validation, account deletion cascade, anonymous RLS (4 RPCs)

---

## Owner's second wave of issues (verbatim quotes with context)

### Tutorial and demo system:
- "Does every kana character and then every kotoba character have their own sound?" - Kana characters don't have individual audio. Kotoba words have VOICEVOX audio in public/audio/words/. Audio plays on word completion.
- "For the demo instructions, is the completion of it something that is reported server side? Same for the pop up instructions like welcome to the dojo and double mnemonics?" - All dialogue completion is stored in localStorage key `langtap-dialogues-seen`. NOT user-scoped. NOT server-side.
- "If its local then wouldn't a user that signs out and a different new user that signs in not get these?" - YES, this is a bug. Different users on same browser share dialogue state.
- "These should all be for full users. We should then make Demo equivalents for the demo users."
- "Like 'this is the Kana dojo, your characters will be shown here in different colours at different unlock states. Play around, this won't affect anything.' And something like that for the kotoba. And maybe one for home."
- "Some of these can be later pop ups for the full profile too. But again let's differentiate so we don't get confused which is for which."

### Leaderboard:
- "How quickly or often does a leaderboard get updated?" - Answer: 60-second passive cache TTL in useLeaderboard.ts. No active polling. Refetches on component mount after 60s.

### Dojo styling:
- "The click to unlock characters is this odd off pink. I want it to be a themed light blue that like all our other buttons depresses when clicked."
- "When I click characters in Kana dojo and I get the marked as mastered and then reset progress buttons these are green but should be blue themed since this is Kana dojo."
- "When I then click yes reset progress, the last yes button is the off light pink again."
- "The No on the reset progress for kotoba doesn't have a border, unlike the close which has a correct border when you select a word."

### Game mechanics:
- "The options to select after being correct shuffle, for the next card, but this is distracting if you are trying to read or see as the view shuffles." - Confirmed: grid shuffles during the green "correct" feedback state, before next word loads.
- "The distance meter on the kana game screen doesn't match the leaderboard one."
- "In kotoba, one single mistake and it should show you the character you should type, not three times like the kana version." - Currently MAX_WRONG_ATTEMPTS=3 for both.
- "When I go to kotoba the counter I see is the same one as the kana type. The two counters should be separate and each then reflects on the leaderboard." - Counter key langtap:practice-counters is shared.

### Progress persistence:
- "I practice on the kana. I can see it builds progress, but then when I refresh it, it all reverts to a locked state."
- "Tried again refreshing completely resets the state of kana and I assume the same if I did kotoba."
- Root cause: sync only fires on visibilitychange. Fixed with void flushDirty() on every word complete.

### Resets:
- "The individual Reset kana and Reset kotoba should be the same format as full reset, where you need to type reset."
- "When I tried the full reset I got this warning: Full reset failed (PGRST202): Could not find the function public.factory_reset without parameters in the schema cache." - Fixed: owner ran supabase db push.
- "I don't know if reset kana does anything, because when I go to the kana page the previous progress is still there but if I reset it all disappears. Whether I click the reset kana button or I don't." - This was because progress wasn't syncing to server at all.

### Sync architecture:
- "Shouldn't everything about our game be server based now? So all progress is saved as we play?"
- "Answering correctly should send it to be saved. Clicking a character should send it to be saved. Any aspect of the game or mastery system should be then saved server side."
- "Since we completely removed the guest, the only things gameplay wise that's saved locally in terms of progress is the demo and since that's separate to the whole game. Our game, since it's all server side should be interacting with the server."
- "30 seconds is a very long time. That's why the leaderboard didn't update right away."
- "It should be immediate. I should be able to play and close and it's been saving as I play."
- "How did our tests miss that this very long delay was causing issues? Do our tests check this?" - Answer: No. Mocked unit tests never verify real sync timing. Integration tests verify RPCs work but don't test the game-to-sync pipeline.

### T&C checkbox:
- "When you sign up, there isn't a tick box for the terms and conditions, like I thought we added before."

### Streak calendar:
- "Play at least 10m to add a flame to the calendar, don't worry if you miss a day, we will save you!"
- "This way I can see if the streaks work. Plus it makes it easier."
- "We also need a prompt saying play any amount to add a flame to the calendar. Actually play at least 10m to add a flame to the calendar."

### Testing mandate:
- "Also make each one into a task."
- "Create tests and supabase tests to catch these issues in the future."
- "If we EVER change anything that is server based or affected by the SERVER we must always run docker based tests to make sure we don't break anything."

---

## Remaining tasks for Session 115

### Task 1: Streak flame with 10m threshold + prompt (Medium)
- Flame appears on streak calendar when user has practiced 10m+ in a day
- Home screen prompt: "Practice at least 10m to light today's flame. Don't worry if you miss a day, we'll save you!"
- Grace mechanic already exists in engine/streak.ts
- daily_cap_events table already tracks distance per day
- Files: hooks/useStreak.ts, components/dashboard/streak-calendar.tsx, components/layout/game-home-client.tsx

### Task 2: Kotoba hint threshold - 1 mistake instead of 3 (Small)
- Change MAX_WRONG_ATTEMPTS from 3 to 1 in kotoba-game-window.tsx line 43
- Keep kana at 3
- File: components/game/kotoba-game-window.tsx

### Task 3: Separate kana/kotoba distance counters (Small)
- Counter key langtap:practice-counters shared across both game types
- Scope by game type: langtap:practice-counters:kana and langtap:practice-counters:kotoba
- Files: hooks/usePracticeCounters.ts, components/layout/practice-client.tsx

### Task 4: Reset kana/kotoba require typed RESET confirmation (Medium)
- Replace simple two-step modal with typed-"RESET" dialog
- Same pattern already exists in reset-progress.tsx for factory reset
- File: components/profile/reset-progress.tsx

### Task 5: Dojo button styling fixes - 5 items (Medium)
a) Unlock button: off-pink (bg-blush-100) -> themed light blue with depress shadow
b) Mark as mastered / Reset progress: green (sage secondary) -> sky-blue in kana dojo
c) Reset confirm "Yes": off-pink danger -> proper red destructive
d) Kotoba "No" button: ghost variant missing border -> add border border-border
e) Modal danger variant: bg-blush-100 text-blush-300 -> bg-red-600/80 text-white
Files: components/ui/button.tsx, components/dojo/tile-detail-popover.tsx, components/dojo/kotoba-word-popover.tsx

### Task 6: Tap grid stability during feedback (Small)
- Grid regenerates during green "correct" feedback state
- Defer grid regeneration until after feedback animation completes
- Use stablePromptId ref that only updates post-feedback
- File: components/game/game-window.tsx

### Task 7: Distance meter format consistency (Small)
- Practice screen and leaderboard display distance differently
- Ensure identical format
- Files: components/game/distance-counter.tsx, leaderboard display components

### Task 8: Demo tutorial dialogues (Medium)
- Create separate demo-specific tutorials with demo- prefixed trigger IDs
- Demo Kana Dojo: "Welcome to the Kana Dojo. This is where you'll track your progress across all hiragana and katakana characters. Colours show your mastery level. Play around here, nothing will be saved."
- Demo Kotoba Dojo: "This is the Kotoba Dojo. Words are grouped by JLPT level and unlock as you practice. Explore freely, this is just a preview."
- Demo Home: "This is your dashboard. Your streak calendar, distance stats, and leaderboard position will all show here once you create an account."
- Full user tutorials remain separate and unchanged
- Files: data/tutorial/dialogue-scripts.ts, demo dojo/home client components

### Task 9: Tutorial dialogue storage - make user-scoped (Small)
- langtap-dialogues-seen is NOT user-scoped
- Different users on same browser share dialogue state
- Scope key with userId using createScopedStorage pattern from stores/scoped-storage.ts
- File: hooks/useDialogueSeen.ts

### Task 10: Add T&C checkbox to sign-up flow (Small)
- Terms and conditions checkbox must be checked before sign-up completes
- Link to /terms page
- Files: sign-up card component in components/layout/ or app/(auth)/

### Task 11: Sync timing tests (Small)
- Unit test: verify flushDirty is called after each word completion in usePracticeSession
- Unit test: verify flushDirty is called after each word completion in useKotobaPracticeSession
- Integration test: verify checkpoint RPC persists scores to database
- These tests ensure we never regress to delayed sync again

---

## Architecture notes for next session

- All game progress for authenticated users is server-based. localStorage is a cache only.
- void flushDirty() fires after every word completion (fire-and-forget via void prefix, non-blocking)
- SyncManager beacon fallback on visibilitychange stays as safety net for page close
- Leaderboard has 60-second cache TTL (passive, no polling) in hooks/useLeaderboard.ts
- Streak uses practice_activity_events table (characters practiced per day)
- daily_cap_events tracks distance per day (for flame threshold)
- Integration tests require Docker + env vars: SUPABASE_LOCAL_ANON_KEY and SUPABASE_LOCAL_SERVICE_KEY from `supabase status`
- CLAUDE.md Section 5D mandates integration tests for any server-side change
- No Codex available - self-review as senior engineer after medium/large tasks
- Owner memory: never hardcode Supabase keys in source files, always use env vars
