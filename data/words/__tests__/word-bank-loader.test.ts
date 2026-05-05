// ─────────────────────────────────────────────
// File: data/words/__tests__/word-bank-loader.test.ts
// Purpose: Tests for the word bank loader APIs: preloadAllWordBanks,
//          getAllWordBanksSync, preloadPracticeDataForLevel, and
//          deduplication behavior.
// Depends on: data/words/word-bank-loader.ts
// ─────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest'

describe('word-bank-loader', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  it('preloadAllWordBanks loads all 5 levels', async () => {
    const { preloadAllWordBanks, getWordBankSync } = await import('@/data/words/word-bank-loader')

    const results = await preloadAllWordBanks()

    expect(results).toHaveLength(5)
    expect(getWordBankSync('N5')).not.toBeNull()
    expect(getWordBankSync('N4')).not.toBeNull()
    expect(getWordBankSync('N3')).not.toBeNull()
    expect(getWordBankSync('N2')).not.toBeNull()
    expect(getWordBankSync('N1')).not.toBeNull()
  })

  it('preloadAllWordBanks dedupes repeated calls', async () => {
    const { preloadAllWordBanks } = await import('@/data/words/word-bank-loader')

    const [first, second] = await Promise.all([preloadAllWordBanks(), preloadAllWordBanks()])

    expect(first).toEqual(second)
  })

  it('getAllWordBanksSync returns null when not all levels are cached', async () => {
    const { loadWordBank, getAllWordBanksSync } = await import('@/data/words/word-bank-loader')

    await loadWordBank('N5')
    expect(getAllWordBanksSync()).toBeNull()
  })

  it('getAllWordBanksSync returns combined bank when all cached', async () => {
    const { preloadAllWordBanks, getAllWordBanksSync, getWordBankSync } =
      await import('@/data/words/word-bank-loader')

    await preloadAllWordBanks()
    const combined = getAllWordBanksSync()

    expect(combined).not.toBeNull()

    const n5 = getWordBankSync('N5')!
    const n4 = getWordBankSync('N4')!
    expect(combined!.length).toBeGreaterThanOrEqual(n5.length + n4.length)
  })

  it('preloadPracticeDataForLevel loads all word banks plus only the specified kotoba level', async () => {
    const { preloadPracticeDataForLevel, getWordBankSync, getKotobaLevelsSync } =
      await import('@/data/words/word-bank-loader')

    await preloadPracticeDataForLevel('N3')

    expect(getWordBankSync('N5')).not.toBeNull()
    expect(getWordBankSync('N4')).not.toBeNull()
    expect(getWordBankSync('N3')).not.toBeNull()
    expect(getWordBankSync('N2')).not.toBeNull()
    expect(getWordBankSync('N1')).not.toBeNull()
    expect(getKotobaLevelsSync('N3')).not.toBeNull()
    expect(getKotobaLevelsSync('N1')).toBeNull()
    expect(getKotobaLevelsSync('N5')).toBeNull()
  })

  it('loadWordBank dedupes concurrent requests for the same level', async () => {
    const { loadWordBank } = await import('@/data/words/word-bank-loader')

    const [a, b] = await Promise.all([loadWordBank('N5'), loadWordBank('N5')])

    expect(a).toBe(b)
  })
})
