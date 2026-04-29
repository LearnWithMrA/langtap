// ------------------------------------------------------------
// File: engine/__tests__/distance.test.ts
// Purpose: Tests for distance calculation, speed bonus, and formatting.
// Depends on: engine/distance.ts, engine/constants.ts
// ------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { calculateDistanceIncrement, convertToFeet, formatDistance } from '@/engine/distance'
import { BASE_DISTANCE_INCREMENT } from '@/engine/constants'

// ── calculateDistanceIncrement ───────────────

describe('calculateDistanceIncrement', () => {
  describe('correct answers', () => {
    it('returns ~18m for a 1-second response', () => {
      const result = calculateDistanceIncrement(1000, true)
      expect(result).toBeGreaterThan(17)
      expect(result).toBeLessThan(19)
    })

    it('returns ~14m for a 3-second response', () => {
      const result = calculateDistanceIncrement(3000, true)
      expect(result).toBeGreaterThan(13)
      expect(result).toBeLessThan(15)
    })

    it('returns exactly base for a 5-second response (no bonus)', () => {
      expect(calculateDistanceIncrement(5000, true)).toBe(BASE_DISTANCE_INCREMENT)
    })

    it('returns exactly base for a 10-second response (no penalty)', () => {
      expect(calculateDistanceIncrement(10000, true)).toBe(BASE_DISTANCE_INCREMENT)
    })

    it('returns 2x base for a 0ms response (maximum speed bonus)', () => {
      expect(calculateDistanceIncrement(0, true)).toBe(BASE_DISTANCE_INCREMENT * 2)
    })
  })

  describe('wrong answers', () => {
    it('returns 0 regardless of response time', () => {
      expect(calculateDistanceIncrement(1000, false)).toBe(0)
      expect(calculateDistanceIncrement(0, false)).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('returns base for negative response time (invalid input)', () => {
      expect(calculateDistanceIncrement(-500, true)).toBe(BASE_DISTANCE_INCREMENT)
    })

    it('returns base for NaN response time', () => {
      expect(calculateDistanceIncrement(NaN, true)).toBe(BASE_DISTANCE_INCREMENT)
    })

    it('returns base for Infinity response time', () => {
      expect(calculateDistanceIncrement(Infinity, true)).toBe(BASE_DISTANCE_INCREMENT)
    })

    it('increment is always >= 0', () => {
      expect(calculateDistanceIncrement(99999, true)).toBeGreaterThanOrEqual(0)
      expect(calculateDistanceIncrement(99999, false)).toBe(0)
    })

    it('increment for correct answer is always in [BASE, 2*BASE]', () => {
      for (const ms of [0, 100, 500, 1000, 2500, 5000, 10000]) {
        const result = calculateDistanceIncrement(ms, true)
        expect(result).toBeGreaterThanOrEqual(BASE_DISTANCE_INCREMENT)
        expect(result).toBeLessThanOrEqual(BASE_DISTANCE_INCREMENT * 2)
      }
    })
  })
})

// ── convertToFeet ────────────────────────────

describe('convertToFeet', () => {
  it('converts 1 metre to ~3.28 feet', () => {
    expect(convertToFeet(1)).toBeCloseTo(3.28084, 3)
  })

  it('converts 0 metres to 0 feet', () => {
    expect(convertToFeet(0)).toBe(0)
  })

  it('converts 1000 metres to ~3280.84 feet', () => {
    expect(convertToFeet(1000)).toBeCloseTo(3280.84, 0)
  })
})

// ── formatDistance ────────────────────────────

describe('formatDistance', () => {
  describe('metric', () => {
    it('shows metres for distances under 1000m', () => {
      expect(formatDistance(500, 'metric')).toBe('500 m')
    })

    it('shows km for distances at or above 1000m', () => {
      expect(formatDistance(1000, 'metric')).toBe('1.0 km')
    })

    it('rounds metres to nearest integer', () => {
      expect(formatDistance(123.7, 'metric')).toBe('124 m')
    })

    it('shows km to one decimal place', () => {
      expect(formatDistance(2567, 'metric')).toBe('2.6 km')
    })
  })

  describe('imperial', () => {
    it('shows feet for distances under 1 mile', () => {
      const result = formatDistance(100, 'imperial')
      expect(result).toMatch(/^\d+ ft$/)
    })

    it('shows miles for distances at or above 1 mile', () => {
      const result = formatDistance(1700, 'imperial')
      expect(result).toMatch(/^\d+\.\d mi$/)
    })

    it('rounds feet to nearest integer', () => {
      expect(formatDistance(1, 'imperial')).toBe('3 ft')
    })
  })

  describe('edge cases', () => {
    it('clamps negative metres to 0', () => {
      expect(formatDistance(-100, 'metric')).toBe('0 m')
    })

    it('handles 0 metres', () => {
      expect(formatDistance(0, 'metric')).toBe('0 m')
      expect(formatDistance(0, 'imperial')).toBe('0 ft')
    })
  })
})
