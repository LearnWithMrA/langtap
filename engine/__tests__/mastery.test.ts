// ─────────────────────────────────────────────
// File: engine/__tests__/mastery.test.ts
// Purpose: Tests for getMasteryHeatClass and getMasteryWeight.
// Depends on: engine/mastery.ts
// ─────────────────────────────────────────────

import { getMasteryHeatClass, getMasteryWeight } from '@/engine/mastery'

// ── getMasteryHeatClass ───────────────────────

describe('getMasteryHeatClass', () => {
  it('returns bg-heat-0 for score 0', () => {
    expect(getMasteryHeatClass(0)).toBe('bg-heat-0')
  })

  it('returns bg-heat-1 for score 1 (lower band boundary)', () => {
    expect(getMasteryHeatClass(1)).toBe('bg-heat-1')
  })

  it('returns bg-heat-1 for score 4 (upper band boundary)', () => {
    expect(getMasteryHeatClass(4)).toBe('bg-heat-1')
  })

  it('returns bg-heat-2 for score 5 (lower band boundary)', () => {
    expect(getMasteryHeatClass(5)).toBe('bg-heat-2')
  })

  it('returns bg-heat-2 for score 9 (upper band boundary)', () => {
    expect(getMasteryHeatClass(9)).toBe('bg-heat-2')
  })

  it('returns bg-heat-3 for score 10 (lower band boundary)', () => {
    expect(getMasteryHeatClass(10)).toBe('bg-heat-3')
  })

  it('returns bg-heat-3 for score 19 (upper band boundary)', () => {
    expect(getMasteryHeatClass(19)).toBe('bg-heat-3')
  })

  it('returns bg-heat-4 for score 20 (lower band boundary)', () => {
    expect(getMasteryHeatClass(20)).toBe('bg-heat-4')
  })

  it('returns bg-heat-4 for score 39 (upper band boundary)', () => {
    expect(getMasteryHeatClass(39)).toBe('bg-heat-4')
  })

  it('returns bg-heat-5 for score 40 (lower band boundary)', () => {
    expect(getMasteryHeatClass(40)).toBe('bg-heat-5')
  })

  it('returns bg-heat-5 for a very high score', () => {
    expect(getMasteryHeatClass(999)).toBe('bg-heat-5')
  })
})

// ── getMasteryWeight ──────────────────────────

describe('getMasteryWeight', () => {
  it('returns 1.0 for score 0 (highest weight)', () => {
    expect(getMasteryWeight(0)).toBe(1)
  })

  it('returns 0.5 for score 1', () => {
    expect(getMasteryWeight(1)).toBe(0.5)
  })

  it('returns 0.2 for score 4', () => {
    expect(getMasteryWeight(4)).toBeCloseTo(0.2)
  })

  it('returns 0.1 for score 9', () => {
    expect(getMasteryWeight(9)).toBeCloseTo(0.1)
  })

  it('returns 0.02 for score 49', () => {
    expect(getMasteryWeight(49)).toBeCloseTo(0.02)
  })

  it('produces a lower weight for a higher score', () => {
    expect(getMasteryWeight(10)).toBeLessThan(getMasteryWeight(5))
  })

  it('is always a positive number', () => {
    expect(getMasteryWeight(0)).toBeGreaterThan(0)
    expect(getMasteryWeight(1000)).toBeGreaterThan(0)
  })
})
