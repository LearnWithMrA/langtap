// ─────────────────────────────────────────────
// File: engine/__tests__/mastery.test.ts
// Purpose: Tests for getMasteryHeatClass and getMasteryWeight.
// Depends on: engine/mastery.ts
// ─────────────────────────────────────────────

import {
  getMasteryHeatClass,
  getMasteryWeight,
  HEAT_GOLD_BG,
  isMastered,
  MASTERY_THRESHOLD,
  progressBarBorderClass,
  progressBarFillClass,
  progressBarFillClassFromPercent,
} from '@/engine/mastery'

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

// ── isMastered ────────────────────────────────

describe('isMastered', () => {
  it('returns false for score 0', () => {
    expect(isMastered(0)).toBe(false)
  })

  it('returns false for a score just below the threshold', () => {
    expect(isMastered(MASTERY_THRESHOLD - 1)).toBe(false)
  })

  it('returns true for a score exactly at the threshold', () => {
    expect(isMastered(MASTERY_THRESHOLD)).toBe(true)
  })

  it('returns true for a score well above the threshold', () => {
    expect(isMastered(MASTERY_THRESHOLD * 10)).toBe(true)
  })

  it('uses the threshold aligned with bg-heat-5', () => {
    expect(MASTERY_THRESHOLD).toBe(40)
  })
})

// ── progressBarFillClass ──────────────────────

describe('progressBarFillClass', () => {
  it('mirrors getMasteryHeatClass below MASTERY_THRESHOLD', () => {
    expect(progressBarFillClass(0)).toBe(getMasteryHeatClass(0))
    expect(progressBarFillClass(4)).toBe(getMasteryHeatClass(4))
    expect(progressBarFillClass(9)).toBe(getMasteryHeatClass(9))
    expect(progressBarFillClass(20)).toBe(getMasteryHeatClass(20))
    expect(progressBarFillClass(39)).toBe(getMasteryHeatClass(39))
  })

  it('returns the gold accent class at and above the mastery threshold', () => {
    expect(progressBarFillClass(40)).toBe(HEAT_GOLD_BG)
    expect(progressBarFillClass(999)).toBe(HEAT_GOLD_BG)
  })
})

// ── progressBarFillClassFromPercent ───────────

describe('progressBarFillClassFromPercent', () => {
  it('maps 0% to the heat-0 class', () => {
    expect(progressBarFillClassFromPercent(0)).toBe('bg-heat-0')
  })

  it('maps 100% to the gold accent class', () => {
    expect(progressBarFillClassFromPercent(100)).toBe(HEAT_GOLD_BG)
  })

  it('clamps negative percents to 0', () => {
    expect(progressBarFillClassFromPercent(-10)).toBe(progressBarFillClassFromPercent(0))
  })

  it('clamps over-100 percents to gold', () => {
    expect(progressBarFillClassFromPercent(150)).toBe(HEAT_GOLD_BG)
  })

  it('produces a mid-range heat class in the middle of the scale', () => {
    // 50% ≈ score 20 → bg-heat-4
    expect(progressBarFillClassFromPercent(50)).toBe('bg-heat-4')
  })
})

// ── progressBarBorderClass ────────────────────

describe('progressBarBorderClass', () => {
  it('returns border-heat-0 for score 0 (neutral, untouched)', () => {
    expect(progressBarBorderClass(0)).toBe('border-heat-0')
  })

  it('ramps across the heat bands below the mastery threshold', () => {
    expect(progressBarBorderClass(1)).toBe('border-heat-1')
    expect(progressBarBorderClass(4)).toBe('border-heat-1')
    expect(progressBarBorderClass(5)).toBe('border-heat-2')
    expect(progressBarBorderClass(9)).toBe('border-heat-2')
    expect(progressBarBorderClass(10)).toBe('border-heat-3')
    expect(progressBarBorderClass(19)).toBe('border-heat-3')
    expect(progressBarBorderClass(20)).toBe('border-heat-4')
    expect(progressBarBorderClass(39)).toBe('border-heat-4')
  })

  it('returns the gold border token at and above mastery threshold', () => {
    expect(progressBarBorderClass(40)).toBe('border-[color:var(--color-heat-gold)]')
    expect(progressBarBorderClass(999)).toBe('border-[color:var(--color-heat-gold)]')
  })
})
