// ─────────────────────────────────────────────
// File: services/__tests__/bug-report.service.test.ts
// Purpose: Tests for the bug report client service. Validates
//          form data construction, response parsing, and error
//          handling. Does not test the route handler (server-side).
// Depends on: services/bug-report.service.ts
// ─────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitBugReport } from '../bug-report.service'
import type { BugReportInput, BugReportAppState } from '@/types/bug-report.types'

// ── Mocks ─────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Fixtures ──────────────────────────────────

const APP_STATE: BugReportAppState = { page: '/practice', input_mode: 'tap' }

const VALID_INPUT: BugReportInput = {
  type: 'bug',
  description: 'Something is broken',
}

// ── Tests ─────────────────────────────────────

describe('bug-report.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends form data with correct fields', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    await submitBugReport(VALID_INPUT, APP_STATE)

    expect(mockFetch).toHaveBeenCalledWith('/api/bug-report', {
      method: 'POST',
      body: expect.any(FormData),
    })

    const formData = mockFetch.mock.calls[0][1].body as FormData
    expect(formData.get('type')).toBe('bug')
    expect(formData.get('description')).toBe('Something is broken')
    expect(formData.get('app_state')).toBe(JSON.stringify(APP_STATE))
  })

  it('includes screenshot when provided', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    const file = new File(['pixels'], 'screenshot.png', { type: 'image/png' })
    const input: BugReportInput = { ...VALID_INPUT, screenshot: file }

    await submitBugReport(input, APP_STATE)

    const formData = mockFetch.mock.calls[0][1].body as FormData
    expect(formData.get('screenshot')).toBe(file)
  })

  it('returns ok true on success', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    const result = await submitBugReport(VALID_INPUT, APP_STATE)
    expect(result).toEqual({ ok: true })
  })

  it('returns error on 400 response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Description is required' }),
    })

    const result = await submitBugReport(VALID_INPUT, APP_STATE)
    expect(result).toEqual({
      ok: false,
      error: 'Description is required',
      status: 400,
    })
  })

  it('returns error on 429 rate limit', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Please wait before submitting another report' }),
    })

    const result = await submitBugReport(VALID_INPUT, APP_STATE)
    expect(result).toEqual({
      ok: false,
      error: 'Please wait before submitting another report',
      status: 429,
    })
  })

  it('handles fetch failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('JSON parse error')
      },
    })

    const result = await submitBugReport(VALID_INPUT, APP_STATE)
    expect(result).toEqual({
      ok: false,
      error: 'Unknown error',
      status: 500,
    })
  })

  it('returns network error when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await submitBugReport(VALID_INPUT, APP_STATE)
    expect(result).toEqual({
      ok: false,
      error: 'Network error. Please try again.',
      status: 0,
    })
  })

  it('omits screenshot field when not provided', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    await submitBugReport(VALID_INPUT, APP_STATE)

    const formData = mockFetch.mock.calls[0][1].body as FormData
    expect(formData.get('screenshot')).toBeNull()
  })
})
