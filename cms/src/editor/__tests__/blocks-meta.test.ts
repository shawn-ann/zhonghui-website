import { describe, it, expect } from 'vitest'
import { BLOCKS, isLayout, allowedChildTypes, blockSummary } from '../blocks'

describe('component categories', () => {
  it('classifies layout vs content', () => {
    expect(isLayout('section')).toBe(true)
    expect(isLayout('grid')).toBe(true)
    expect(isLayout('image')).toBe(false)
  })
  it('allowed children: section = content + grid; grid = content', () => {
    expect(allowedChildTypes('section')).toContain('grid')
    expect(allowedChildTypes('section')).toContain('heading')
    expect(allowedChildTypes('grid')).not.toContain('section')
    expect(allowedChildTypes('grid')).not.toContain('grid')
    expect(allowedChildTypes('image')).toEqual([])
  })
  it('summary for text/heading', () => {
    expect(blockSummary({ type: 'heading', title: '项目一览' } as any)).toBe('项目一览')
    expect(blockSummary({ type: 'grid', columns: 3 } as any)).toContain('3')
  })
  it('content blocks no longer expose background settings', () => {
    for (const t of ['text', 'image', 'imageText', 'button', 'richtext', 'gallery', 'slider'] as const) {
      const keys = BLOCKS[t].fields.map((f) => f.key)
      expect(keys).not.toContain('bg')
      expect(keys).not.toContain('alt')
    }
  })
})
