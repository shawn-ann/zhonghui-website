import { describe, expect, it } from 'vitest'
import { Cases } from '../Cases'
import { beijingDayStart } from '../../lib/datetime'

type BeforeChangeHook = (args: any) => any
const hook = Cases.hooks?.beforeChange?.[0] as unknown as BeforeChangeHook

describe('Cases publishedAt hook', () => {
  it('writes the Beijing calendar day on create', () => {
    const out = hook({ data: { title: 'x' }, originalDoc: undefined, operation: 'create' })
    expect(out.publishedAt).toBe(beijingDayStart(new Date()))
  })

  it('keeps the original published date on update', () => {
    const out = hook({
      data: { publishedAt: '2026-02-02T00:00:00.000Z' },
      originalDoc: { publishedAt: '2025-07-02T00:00:00.000Z' },
      operation: 'update',
    })
    expect(out.publishedAt).toBe('2025-07-02T00:00:00.000Z')
  })

  it('backfills a missing date from createdAt on update', () => {
    const out = hook({
      data: {},
      originalDoc: { createdAt: '2025-06-30T10:00:00.000Z' },
      operation: 'update',
    })
    expect(out.publishedAt).toBe('2025-06-30T00:00:00.000Z')
  })
})
