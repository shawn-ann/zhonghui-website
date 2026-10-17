import { describe, it, expect } from 'vitest'
import { resolveDropContainer, resolveDropTarget } from '../dropTarget'
import type { Block } from '../types'

const blocks: Block[] = [
  {
    type: 'section',
    _id: 's1',
    children: [
      { type: 'heading', _id: 'h1', title: 'A' },
      {
        type: 'grid',
        _id: 'g1',
        columns: 3,
        children: [{ type: 'text', _id: 't1', body: 'x' }],
      },
    ],
  },
]

describe('resolveDropTarget', () => {
  it('appends into a container', () => {
    expect(resolveDropTarget(blocks, 's1', 'text')).toEqual({ parentId: 's1', index: 2 })
    expect(resolveDropTarget(blocks, 'g1', 'text')).toEqual({ parentId: 'g1', index: 1 })
  })

  it('inserts after a content block in its parent', () => {
    expect(resolveDropTarget(blocks, 'h1', 'text')).toEqual({ parentId: 's1', index: 1 })
    expect(resolveDropTarget(blocks, 't1', 'image')).toEqual({ parentId: 'g1', index: 1 })
  })

  it('rejects top-level non-container and disallowed types', () => {
    const legacy: Block[] = [{ type: 'text', _id: 'top', body: 'x' }]
    expect(resolveDropTarget(legacy, 'top', 'text')).toBeNull()
    expect(resolveDropTarget(blocks, 'g1', 'section')).toBeNull()
  })

  it('finds the nearest container for highlighting', () => {
    expect(resolveDropContainer(blocks, 's1')).toBe('s1')
    expect(resolveDropContainer(blocks, 'h1')).toBe('s1')
    expect(resolveDropContainer(blocks, 't1')).toBe('g1')
    const legacy: Block[] = [{ type: 'text', _id: 'top', body: 'x' }]
    expect(resolveDropContainer(legacy, 'top')).toBeNull()
  })
})
