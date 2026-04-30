// ------------------------------------------------------------
// File: engine/__tests__/unlock.test.ts
// Purpose: Tests for unlock threshold logic, word eligibility,
//          and guided progression sequence.
// Depends on: engine/unlock.ts, engine/constants.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  isCharacterUnlocked,
  isWordEligible,
  isWordEligibleByUnlockedSet,
  getUnlockedCharacterIds,
  getUnlockSource,
  isGroupComplete,
  getActiveGroup,
  getActiveCharacterIds,
  getCompletedGroupCount,
  getContiguousCompletedCount,
} from '@/engine/unlock'
import { UNLOCK_THRESHOLD } from '@/engine/constants'
import { PROGRESSION_GROUPS } from '@/data/kana/progression-groups'

// ── isCharacterUnlocked ──────────────────────

describe('isCharacterUnlocked', () => {
  describe('mastery-based unlock', () => {
    it('returns false when score is 0', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': 0 }, new Set())).toBe(false)
    })

    it('returns false when score is one below threshold', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': UNLOCK_THRESHOLD - 1 }, new Set())).toBe(false)
    })

    it('returns true when score is exactly at threshold', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': UNLOCK_THRESHOLD }, new Set())).toBe(true)
    })

    it('returns true when score is well above threshold', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': 50 }, new Set())).toBe(true)
    })

    it('returns false when character has no score entry', () => {
      expect(isCharacterUnlocked('h-a', {}, new Set())).toBe(false)
    })
  })

  describe('manual unlock', () => {
    it('returns true when manually unlocked with score 0', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': 0 }, new Set(['h-a']))).toBe(true)
    })

    it('returns true when manually unlocked with low score', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': 3 }, new Set(['h-a']))).toBe(true)
    })

    it('returns false when not manually unlocked and score is 0', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': 0 }, new Set(['h-ka']))).toBe(false)
    })
  })

  describe('both conditions', () => {
    it('returns true when both mastery and manual are met', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': UNLOCK_THRESHOLD }, new Set(['h-a']))).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles empty mastery scores map', () => {
      expect(isCharacterUnlocked('h-a', {}, new Set())).toBe(false)
    })

    it('handles empty manual unlocks set', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': 0 }, new Set())).toBe(false)
    })

    it('handles both empty', () => {
      expect(isCharacterUnlocked('h-a', {}, new Set())).toBe(false)
    })

    it('returns false for NaN score (sanitized to 0)', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': NaN }, new Set())).toBe(false)
    })

    it('returns false for Infinity score (not auto-unlocked)', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': Infinity }, new Set())).toBe(false)
    })

    it('returns false for negative score', () => {
      expect(isCharacterUnlocked('h-a', { 'h-a': -5 }, new Set())).toBe(false)
    })
  })
})

// ── isWordEligible ───────────────────────────

describe('isWordEligible', () => {
  const scores = { 'h-a': UNLOCK_THRESHOLD, 'h-ka': UNLOCK_THRESHOLD }
  const manual = new Set<string>()

  it('returns true when all characters are unlocked', () => {
    expect(isWordEligible(['h-a', 'h-ka'], scores, manual)).toBe(true)
  })

  it('returns false when one character is locked', () => {
    expect(isWordEligible(['h-a', 'h-sa'], scores, manual)).toBe(false)
  })

  it('returns false when all characters are locked', () => {
    expect(isWordEligible(['h-sa', 'h-ta'], {}, manual)).toBe(false)
  })

  it('returns false when the last character in a long word is locked', () => {
    expect(isWordEligible(['h-a', 'h-ka', 'h-sa'], scores, manual)).toBe(false)
  })

  it('returns true for a single unlocked character', () => {
    expect(isWordEligible(['h-a'], scores, manual)).toBe(true)
  })

  it('returns false for a single locked character', () => {
    expect(isWordEligible(['h-sa'], scores, manual)).toBe(false)
  })

  it('returns false for an empty character array', () => {
    expect(isWordEligible([], scores, manual)).toBe(false)
  })

  it('handles mix of mastery-unlocked and manually-unlocked', () => {
    const mixed = new Set(['h-sa'])
    expect(isWordEligible(['h-a', 'h-sa'], scores, mixed)).toBe(true)
  })

  it('returns false when word includes unknown ID with others unlocked', () => {
    expect(isWordEligible(['h-a', 'nonexistent'], scores, manual)).toBe(false)
  })
})

// ── isWordEligibleByUnlockedSet ──────────────

describe('isWordEligibleByUnlockedSet', () => {
  const unlocked = new Set(['h-a', 'h-ka', 'h-sa'])

  it('returns true when all characters are in unlocked set', () => {
    expect(isWordEligibleByUnlockedSet(['h-a', 'h-ka'], unlocked)).toBe(true)
  })

  it('returns false when one character is not in unlocked set', () => {
    expect(isWordEligibleByUnlockedSet(['h-a', 'h-ta'], unlocked)).toBe(false)
  })

  it('returns false for empty character array', () => {
    expect(isWordEligibleByUnlockedSet([], unlocked)).toBe(false)
  })
})

// ── getUnlockedCharacterIds ──────────────────

describe('getUnlockedCharacterIds', () => {
  it('returns empty set when no characters are unlocked', () => {
    const result = getUnlockedCharacterIds(['h-a', 'h-ka'], {}, new Set())
    expect(result.size).toBe(0)
  })

  it('returns full set when all characters are unlocked', () => {
    const scores = { 'h-a': UNLOCK_THRESHOLD, 'h-ka': UNLOCK_THRESHOLD }
    const result = getUnlockedCharacterIds(['h-a', 'h-ka'], scores, new Set())
    expect(result.size).toBe(2)
    expect(result.has('h-a')).toBe(true)
    expect(result.has('h-ka')).toBe(true)
  })

  it('returns correct subset with mixed unlock states', () => {
    const scores = { 'h-a': UNLOCK_THRESHOLD, 'h-ka': 2 }
    const result = getUnlockedCharacterIds(['h-a', 'h-ka', 'h-sa'], scores, new Set())
    expect(result.size).toBe(1)
    expect(result.has('h-a')).toBe(true)
  })

  it('includes both mastery-unlocked and manually-unlocked characters', () => {
    const scores = { 'h-a': UNLOCK_THRESHOLD }
    const manual = new Set(['h-ka'])
    const result = getUnlockedCharacterIds(['h-a', 'h-ka', 'h-sa'], scores, manual)
    expect(result.size).toBe(2)
  })

  it('does not duplicate IDs unlocked by both methods', () => {
    const scores = { 'h-a': UNLOCK_THRESHOLD }
    const manual = new Set(['h-a'])
    const result = getUnlockedCharacterIds(['h-a'], scores, manual)
    expect(result.size).toBe(1)
  })

  it('ignores manual unlock IDs not in the dataset', () => {
    const manual = new Set(['nonexistent'])
    const result = getUnlockedCharacterIds(['h-a'], {}, manual)
    expect(result.size).toBe(0)
  })

  it('handles duplicate IDs in input without duplication in result', () => {
    const scores = { 'h-a': UNLOCK_THRESHOLD }
    const result = getUnlockedCharacterIds(['h-a', 'h-a'], scores, new Set())
    expect(result.size).toBe(1)
  })
})

// ── getUnlockSource ──────────────────────────

describe('getUnlockSource', () => {
  it('returns null for a locked character', () => {
    expect(getUnlockSource('h-a', { 'h-a': 2 }, new Set())).toBeNull()
  })

  it('returns mastery for a character unlocked only by score', () => {
    expect(getUnlockSource('h-a', { 'h-a': UNLOCK_THRESHOLD }, new Set())).toBe('mastery')
  })

  it('returns manual for a character unlocked only manually', () => {
    expect(getUnlockSource('h-a', {}, new Set(['h-a']))).toBe('manual')
  })

  it('returns mastery_and_manual for both', () => {
    expect(getUnlockSource('h-a', { 'h-a': UNLOCK_THRESHOLD }, new Set(['h-a']))).toBe(
      'mastery_and_manual',
    )
  })

  it('returns manual when score is NaN but manually unlocked', () => {
    expect(getUnlockSource('h-a', { 'h-a': NaN }, new Set(['h-a']))).toBe('manual')
  })
})

// ── isGroupComplete ──────────────────────────

describe('isGroupComplete', () => {
  const group = {
    stage: 'seion' as const,
    script: 'hiragana' as const,
    groupIndex: 1,
    characterIds: ['h-a', 'h-i', 'h-u'] as readonly string[],
  }

  it('returns false when no characters are unlocked', () => {
    expect(isGroupComplete(group, new Set())).toBe(false)
  })

  it('returns false when some but not all are unlocked', () => {
    expect(isGroupComplete(group, new Set(['h-a', 'h-i']))).toBe(false)
  })

  it('returns true when all characters are unlocked', () => {
    expect(isGroupComplete(group, new Set(['h-a', 'h-i', 'h-u']))).toBe(true)
  })

  it('returns true for a single-character group that is unlocked', () => {
    const single = { ...group, characterIds: ['h-a'] as readonly string[] }
    expect(isGroupComplete(single, new Set(['h-a']))).toBe(true)
  })
})

// ── getActiveGroup ───────────────────────────

describe('getActiveGroup', () => {
  const groups = [
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 1,
      characterIds: ['h-a', 'h-i'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'katakana' as const,
      groupIndex: 1,
      characterIds: ['k-a', 'k-i'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 2,
      characterIds: ['h-sa', 'h-si'] as readonly string[],
    },
  ]

  it('returns the first group when no characters are unlocked', () => {
    expect(getActiveGroup(groups, new Set())).toBe(groups[0])
  })

  it('returns the second group when the first is complete', () => {
    expect(getActiveGroup(groups, new Set(['h-a', 'h-i']))).toBe(groups[1])
  })

  it('returns the third group when first two are complete', () => {
    expect(getActiveGroup(groups, new Set(['h-a', 'h-i', 'k-a', 'k-i']))).toBe(groups[2])
  })

  it('returns null when all groups are complete', () => {
    expect(getActiveGroup(groups, new Set(['h-a', 'h-i', 'k-a', 'k-i', 'h-sa', 'h-si']))).toBeNull()
  })

  it('handles partially complete first group', () => {
    expect(getActiveGroup(groups, new Set(['h-a']))).toBe(groups[0])
  })

  it('ignores unknown IDs in unlocked set', () => {
    expect(getActiveGroup(groups, new Set(['unknown-id']))).toBe(groups[0])
  })

  describe('with real progression data', () => {
    it('returns seion Group 1H when starting fresh', () => {
      const active = getActiveGroup(PROGRESSION_GROUPS, new Set())
      expect(active).not.toBeNull()
      expect(active!.stage).toBe('seion')
      expect(active!.script).toBe('hiragana')
      expect(active!.groupIndex).toBe(1)
    })

    it('returns seion Group 1K after Group 1H is fully unlocked', () => {
      const group1H = PROGRESSION_GROUPS[0]
      const unlocked = new Set(group1H.characterIds as string[])
      const active = getActiveGroup(PROGRESSION_GROUPS, unlocked)
      expect(active).not.toBeNull()
      expect(active!.stage).toBe('seion')
      expect(active!.script).toBe('katakana')
      expect(active!.groupIndex).toBe(1)
    })
  })
})

// ── getActiveCharacterIds ────────────────────

describe('getActiveCharacterIds', () => {
  const groups = [
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 1,
      characterIds: ['h-a', 'h-i'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'katakana' as const,
      groupIndex: 1,
      characterIds: ['k-a', 'k-i'] as readonly string[],
    },
  ]

  it('returns the character IDs of the active group', () => {
    expect(getActiveCharacterIds(groups, new Set())).toEqual(['h-a', 'h-i'])
  })

  it('returns an empty array when all groups are complete', () => {
    expect(getActiveCharacterIds(groups, new Set(['h-a', 'h-i', 'k-a', 'k-i']))).toEqual([])
  })
})

// ── getCompletedGroupCount ────���──────────────

describe('getCompletedGroupCount', () => {
  const groups = [
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 1,
      characterIds: ['h-a'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'katakana' as const,
      groupIndex: 1,
      characterIds: ['k-a'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 2,
      characterIds: ['h-sa'] as readonly string[],
    },
  ]

  it('returns 0 when no groups are complete', () => {
    expect(getCompletedGroupCount(groups, new Set())).toBe(0)
  })

  it('returns 1 when only the first group is complete', () => {
    expect(getCompletedGroupCount(groups, new Set(['h-a']))).toBe(1)
  })

  it('returns the total count when all groups are complete', () => {
    expect(getCompletedGroupCount(groups, new Set(['h-a', 'k-a', 'h-sa']))).toBe(3)
  })

  it('counts non-contiguous completed groups', () => {
    expect(getCompletedGroupCount(groups, new Set(['h-a', 'h-sa']))).toBe(2)
  })
})

// ── getContiguousCompletedCount ──────────────

describe('getContiguousCompletedCount', () => {
  const groups = [
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 1,
      characterIds: ['h-a'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'katakana' as const,
      groupIndex: 1,
      characterIds: ['k-a'] as readonly string[],
    },
    {
      stage: 'seion' as const,
      script: 'hiragana' as const,
      groupIndex: 2,
      characterIds: ['h-sa'] as readonly string[],
    },
  ]

  it('returns 0 when no groups are complete', () => {
    expect(getContiguousCompletedCount(groups, new Set())).toBe(0)
  })

  it('returns 1 when only the first group is complete', () => {
    expect(getContiguousCompletedCount(groups, new Set(['h-a']))).toBe(1)
  })

  it('returns 2 when first two are contiguously complete', () => {
    expect(getContiguousCompletedCount(groups, new Set(['h-a', 'k-a']))).toBe(2)
  })

  it('stops at the first incomplete group', () => {
    expect(getContiguousCompletedCount(groups, new Set(['h-a', 'h-sa']))).toBe(1)
  })

  it('returns total when all are contiguously complete', () => {
    expect(getContiguousCompletedCount(groups, new Set(['h-a', 'k-a', 'h-sa']))).toBe(3)
  })
})
