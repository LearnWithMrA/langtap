// ------------------------------------------------------------
// File: engine/distance.ts
// Purpose: Distance and speed bonus calculation.
//          Converts correct answers and response time into metres.
//          Handles locale conversion (metres to feet).
//          Pure functions only. No side effects.
// Depends on: engine/constants.ts
// ------------------------------------------------------------

import { MAX_RESPONSE_TIME_MS, BASE_DISTANCE_INCREMENT, METRES_TO_FEET } from '@/engine/constants'

// ── Main exports ─────────────────────────────

// Calculates the distance increment for a single answer.
// Wrong answers always return 0.
// Invalid response times (NaN, Infinity, negative) are treated as
// MAX_RESPONSE_TIME_MS (base increment, no bonus).
export function calculateDistanceIncrement(responseTimeMs: number, isCorrect: boolean): number {
  if (!isCorrect) return 0

  const clampedTime =
    Number.isFinite(responseTimeMs) && responseTimeMs >= 0 ? responseTimeMs : MAX_RESPONSE_TIME_MS

  const speedBonus = Math.max(0, (MAX_RESPONSE_TIME_MS - clampedTime) / MAX_RESPONSE_TIME_MS)

  return BASE_DISTANCE_INCREMENT * (1 + speedBonus)
}

// Converts metres to feet for imperial locale display.
export function convertToFeet(metres: number): number {
  return metres * METRES_TO_FEET
}

// Formats a distance value for display.
// Negative values are clamped to 0.
export function formatDistance(metres: number, unit: 'metric' | 'imperial'): string {
  const clamped = Math.max(0, metres)

  if (unit === 'imperial') {
    const feet = convertToFeet(clamped)
    if (feet >= 5280) return `${(feet / 5280).toFixed(1)} mi`
    return `${Math.round(feet)} ft`
  }

  if (clamped >= 1000) return `${(clamped / 1000).toFixed(1)} km`
  return `${Math.round(clamped)} m`
}
