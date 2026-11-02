import { describe, it, expect } from 'vitest'
import { defaultColumnRatio, normalizeColumnRatio, parseColumnRatio, ratioToGridTemplate } from '../columnRatio'

describe('columnRatio', () => {
  it('builds equal defaults for 1-4 columns', () => {
    expect(defaultColumnRatio(1)).toBe('1')
    expect(defaultColumnRatio(2)).toBe('1:1')
    expect(defaultColumnRatio(3)).toBe('1:1:1')
    expect(defaultColumnRatio(4)).toBe('1:1:1:1')
    expect(defaultColumnRatio(5)).toBe('1:1:1:1:1')
  })

  it('parses integer ratios with the right segment count', () => {
    expect(parseColumnRatio('2:3', 2)).toEqual([2, 3])
    expect(parseColumnRatio('1:2:1', 3)).toEqual([1, 2, 1])
    expect(parseColumnRatio(' 2 : 3 ', 2)).toEqual([2, 3])
    expect(parseColumnRatio('2:3', 3)).toBeNull()
    expect(parseColumnRatio('0:3', 2)).toBeNull()
    expect(parseColumnRatio('1.5:2', 2)).toBeNull()
    expect(parseColumnRatio('foo:2', 2)).toBeNull()
  })

  it('normalizes legacy values and invalid input', () => {
    expect(normalizeColumnRatio('equal', 2)).toBe('1:1')
    expect(normalizeColumnRatio('leftNarrow', 2)).toBe('2:3')
    expect(normalizeColumnRatio('leftWide', 2)).toBe('3:2')
    expect(normalizeColumnRatio('leftNarrow', 3)).toBe('1:1:1')
    expect(normalizeColumnRatio('bogus', 2)).toBe('1:1')
  })

  it('renders fr values from a valid ratio', () => {
    expect(ratioToGridTemplate('2:3', 2)).toBe('2fr 3fr')
    expect(ratioToGridTemplate('1:2:1', 3)).toBe('1fr 2fr 1fr')
    expect(ratioToGridTemplate('2:3', 3)).toBeUndefined()
  })
})
