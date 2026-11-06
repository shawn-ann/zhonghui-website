import { describe, expect, it } from 'vitest'
import { resolvePublishedAt } from '../publishedAt'

describe('resolvePublishedAt', () => {
  it('writes the Beijing calendar day on create', () => {
    expect(resolvePublishedAt({
      operation: 'create', now: new Date('2026-01-01T20:00:00.000Z'),
    })).toBe('2026-01-02T00:00:00.000Z')
  })

  it('keeps an existing value on update', () => {
    expect(resolvePublishedAt({
      operation: 'update', current: '2025-07-02T00:00:00.000Z', now: new Date('2026-01-01T00:00:00.000Z'),
    })).toBe('2025-07-02T00:00:00.000Z')
  })

  it('ignores an incoming change on update', () => {
    expect(resolvePublishedAt({
      operation: 'update', current: '2025-07-02T00:00:00.000Z', incoming: '2026-02-02T00:00:00.000Z',
    })).toBe('2025-07-02T00:00:00.000Z')
  })

  it('backfills a missing historical value from createdAt', () => {
    expect(resolvePublishedAt({
      operation: 'update', createdAt: '2025-06-30T10:00:00.000Z', now: new Date('2026-01-01T00:00:00.000Z'),
    })).toBe('2025-06-30T00:00:00.000Z')
  })

  it('keeps an explicitly provided value on create', () => {
    expect(resolvePublishedAt({
      operation: 'create', incoming: '2025-01-05T00:00:00.000Z', now: new Date('2026-01-01T00:00:00.000Z'),
    })).toBe('2025-01-05T00:00:00.000Z')
  })
})
