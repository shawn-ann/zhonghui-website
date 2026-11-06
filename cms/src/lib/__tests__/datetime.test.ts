import { describe, expect, it } from 'vitest'
import { beijingDateKey, beijingDayStart, formatBeijingTime } from '../datetime'

describe('Beijing time helpers', () => {
  it('formats an instant as Beijing YYYY/MM/DD HH:mm:ss', () => {
    expect(formatBeijingTime('2026-01-01T04:12:30.000Z')).toBe('2026/01/01 12:12:30')
  })

  it('rolls over to the next Beijing day', () => {
    expect(formatBeijingTime('2025-12-31T16:30:00.000Z')).toBe('2026/01/01 00:30:00')
    expect(beijingDateKey('2025-12-31T16:30:00.000Z')).toBe('2026-01-01')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(formatBeijingTime(null)).toBe('')
    expect(formatBeijingTime(undefined)).toBe('')
    expect(formatBeijingTime('not-a-date')).toBe('')
    expect(beijingDateKey('not-a-date')).toBe('')
  })

  it('anchors a Beijing calendar day at UTC midnight', () => {
    expect(beijingDayStart('2026-01-01T20:00:00.000Z')).toBe('2026-01-02T00:00:00.000Z')
    expect(beijingDayStart('2026-01-01T04:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z')
  })
})
