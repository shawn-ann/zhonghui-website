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
