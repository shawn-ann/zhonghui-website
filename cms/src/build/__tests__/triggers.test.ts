import { describe, expect, it } from 'vitest'
import { shouldRebuildPublishedChange } from '../triggers'

describe('shouldRebuildPublishedChange', () => {
  it('ignores draft-only saves', () => {
    expect(shouldRebuildPublishedChange('create', { _status: 'draft' })).toBe(false)
    expect(shouldRebuildPublishedChange('update', { _status: 'draft' }, { _status: 'draft' })).toBe(false)
  })

  it('rebuilds on publish, published edits and unpublish', () => {
    expect(shouldRebuildPublishedChange('update', { _status: 'published' }, { _status: 'draft' })).toBe(true)
    expect(shouldRebuildPublishedChange('update', { _status: 'published' }, { _status: 'published' })).toBe(true)
    expect(shouldRebuildPublishedChange('update', { _status: 'draft' }, { _status: 'published' })).toBe(true)
  })

  it('rebuilds only when a published document is deleted', () => {
    expect(shouldRebuildPublishedChange('delete', { _status: 'published' })).toBe(true)
    expect(shouldRebuildPublishedChange('delete', { _status: 'draft' })).toBe(false)
  })
})

describe('shouldRebuildPublishedDocChange', () => {
  it('skips saving a draft when a published version still exists', async () => {
    const { shouldRebuildPublishedDocChange } = await import('../triggers')
    await expect(shouldRebuildPublishedDocChange({
      operation: 'update', doc: { _status: 'draft' }, previousDoc: { _status: 'published' },
      loadPublished: async () => ({ _status: 'published' }),
    })).resolves.toBe(false)
  })

  it('rebuilds an unpublish (no published version left)', async () => {
    const { shouldRebuildPublishedDocChange } = await import('../triggers')
    await expect(shouldRebuildPublishedDocChange({
      operation: 'update', doc: { _status: 'draft' }, previousDoc: { _status: 'published' },
      loadPublished: async () => ({ _status: 'draft' }),
    })).resolves.toBe(true)
  })

  it('rebuilds a publish and a delete of a published doc', async () => {
    const { shouldRebuildPublishedDocChange } = await import('../triggers')
    await expect(shouldRebuildPublishedDocChange({
      operation: 'update', doc: { _status: 'published' }, previousDoc: { _status: 'draft' },
      loadPublished: async () => null,
    })).resolves.toBe(true)
    await expect(shouldRebuildPublishedDocChange({
      operation: 'delete', doc: { _status: 'published' }, loadPublished: async () => null,
    })).resolves.toBe(true)
  })
})
