---
name: Changelog entries are immutable
description: Never edit existing changelog entries. Always create a new entry. They show what we did, right or wrong, and what we fixed.
type: feedback
---

Never edit an existing changelog entry. Always create a new one at the top. Changelog entries are a historical record of what happened in each session, including mistakes and fixes. They are untouchable once written.

**Why:** The owner wants an honest audit trail. If something was broken and fixed, that should be visible as separate entries, not rewritten.

**How to apply:** When closing a session or doing a mini session-end, always insert a new `## [Date] - Session [N]` block above the previous one. Never modify text inside an existing entry.
