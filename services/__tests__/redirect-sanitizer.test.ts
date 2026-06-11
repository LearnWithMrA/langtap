// ─────────────────────────────────────────────
// File: services/__tests__/redirect-sanitizer.test.ts
// Purpose: Unit tests for sanitizeNext - the auth callback's open
//          redirect guard. Every bypass technique must fall back to /home.
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { sanitizeNext } from '../redirect-sanitizer'

describe('sanitizeNext', () => {
  it('returns the fallback for null or empty input', () => {
    expect(sanitizeNext(null)).toBe('/home')
    expect(sanitizeNext('')).toBe('/home')
  })

  it('allows plain in-app paths', () => {
    expect(sanitizeNext('/practice/kana')).toBe('/practice/kana')
    expect(sanitizeNext('/profile')).toBe('/profile')
    expect(sanitizeNext('/onboarding/step-1?from=signup')).toBe('/onboarding/step-1?from=signup')
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeNext('//evil.com')).toBe('/home')
    expect(sanitizeNext('//evil.com/path')).toBe('/home')
  })

  it('rejects absolute URLs', () => {
    expect(sanitizeNext('https://evil.com')).toBe('/home')
    expect(sanitizeNext('http://evil.com/x')).toBe('/home')
    expect(sanitizeNext('javascript:alert(1)')).toBe('/home')
  })

  it('rejects backslash variants browsers normalise to slashes', () => {
    expect(sanitizeNext('/\\evil.com')).toBe('/home')
    expect(sanitizeNext('\\/evil.com')).toBe('/home')
    expect(sanitizeNext('\\\\evil.com')).toBe('/home')
  })

  it('rejects encoded slash and control character smuggling', () => {
    expect(sanitizeNext('/%2F%2Fevil.com')).toBe('/home')
    expect(sanitizeNext('/%2f%2fevil.com')).toBe('/home')
    expect(sanitizeNext('/%5Cevil.com')).toBe('/home')
    expect(sanitizeNext('/path%0d%0aLocation:https://evil.com')).toBe('/home')
    expect(sanitizeNext('/%09/evil.com')).toBe('/home')
  })

  it('rejects paths that resolve off-origin', () => {
    expect(sanitizeNext('/..//evil.com')).toBe('/home')
  })

  it('rejects dot-dot segments, plain and encoded', () => {
    expect(sanitizeNext('/practice/../admin')).toBe('/home')
    expect(sanitizeNext('/%2e%2e//evil.com')).toBe('/home')
    expect(sanitizeNext('/%2E%2E/x')).toBe('/home')
  })
})
