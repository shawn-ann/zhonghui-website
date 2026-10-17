import { describe, it, expect } from 'vitest'
import {
  addBlock, moveBlock, removeBlock, updateBlockField, ensureIds,
  findPath, getAtPath, updateAtPath, removeAtPath, insertInto,
  blockChildren, withChildren, childPath, moveChild,
} from '../state'
import type { Block } from '../../render/types'

describe('editor state', () => {
  const t = (body: string, id?: string): Block => ({ type: 'text', body, _id: id })
  it('adds a block at index', () => {
    const blocks = [t('a'), t('b')]
    const out = addBlock(blocks, { type: 'text', body: 'new' }, 1)
    expect(out.map((b) => (b as any).body)).toEqual(['a', 'new', 'b'])
    expect((out[1] as any)._id).toBeTruthy()
  })
  it('moves a block', () => {
    const out = moveBlock([t('a', '1'), t('b', '2'), t('c', '3')], 0, 2)
    expect(out.map((b) => (b as any).body)).toEqual(['b', 'c', 'a'])
  })
  it('removes a block', () => {
    expect(removeBlock([t('a', '1'), t('b', '2')], 0).length).toBe(1)
  })
  it('moveBlock ignores out-of-range from', () => {
    const src = [t('a','1'), t('b','2')]
    expect(moveBlock(src, 5, 0)).toEqual(src)
    expect(moveBlock(src, -1, 0)).toEqual(src)
  })
  it('updateBlockField ignores out-of-range index', () => {
    const src = [t('a','1')]
    expect(updateBlockField(src, 9, 'body', 'x')).toEqual(src)
  })
  it('updates a top-level field', () => {
    const out = updateBlockField([t('a', '1')], 0, 'body', 'A') as any[]
    expect(out[0].body).toBe('A')
  })
  it('ensureIds assigns ids where missing', () => {
    const out = ensureIds([t('a'), t('b')]) as any[]
    expect(out[0]._id).toBeTruthy()
    expect(out[1]._id).toBeTruthy()
  })
})

describe('nested paths', () => {
  const t = (body: string, id?: string): Block => ({ type: 'text', body, _id: id })
  const heading = (id: string): Block => ({ type: 'heading', title: id, _id: id })
  const tree = (): Block[] => [
    { type: 'section', _id: 'sec', children: [heading('h1'), heading('h2')] },
    heading('top'),
    {
      type: 'grid', _id: 'grid', columns: 2,
      children: [heading('g0'), heading('g1')],
    },
  ]

  it('findPath locates top-level, section children and grid components', () => {
    expect(findPath(tree(), 'top')).toEqual([1])
    expect(findPath(tree(), 'h1')).toEqual([0, 0])
    expect(findPath(tree(), 'h2')).toEqual([0, 1])
    expect(findPath(tree(), 'g0')).toEqual([2, 0])
    expect(findPath(tree(), 'g1')).toEqual([2, 1])
  })

  it('findPath returns null when missing', () => {
    expect(findPath(tree(), 'nope')).toBeNull()
  })

  it('getAtPath resolves nested blocks', () => {
    expect((getAtPath(tree(), [0, 1]) as any).title).toBe('h2')
    expect((getAtPath(tree(), [2, 1]) as any).title).toBe('g1')
    expect(getAtPath(tree(), [9])).toBeUndefined()
    expect(getAtPath(tree(), [0, 9])).toBeUndefined()
  })

  it('updateAtPath updates immutably at a nested path', () => {
    const src = tree()
    const out = updateAtPath(src, [0, 1], { type: 'heading', title: 'X', _id: 'h2' })
    expect((getAtPath(out, [0, 1]) as any).title).toBe('X')
    expect((getAtPath(src, [0, 1]) as any).title).toBe('h2')
    expect(out).not.toBe(src)
    expect(out[0]).not.toBe(src[0])
  })

  it('updateAtPath updates a grid component immutably', () => {
    const src = tree()
    const out = updateAtPath(src, [2, 1], { type: 'heading', title: 'Y', _id: 'g1' })
    expect((getAtPath(out, [2, 1]) as any).title).toBe('Y')
    expect((getAtPath(src, [2, 1]) as any).title).toBe('g1')
    expect(out[2]).not.toBe(src[2])
    expect((out[2] as any).children[1]).not.toBe((src[2] as any).children[1])
  })

  it('updateAtPath leaves tree untouched for bad paths', () => {
    const src = tree()
    expect(updateAtPath(src, [9], heading('z'))).toEqual(src)
    expect(updateAtPath(src, [0, 9], heading('z'))).toEqual(src)
  })

  it('removeAtPath removes nested blocks immutably', () => {
    const src = tree()
    const out = removeAtPath(src, [0, 0])
    expect((out[0] as any).children.map((b: any) => b._id)).toEqual(['h2'])
    expect((src[0] as any).children.length).toBe(2)
  })

  it('removeAtPath removes a grid component', () => {
    const src = tree()
    const out = removeAtPath(src, [2, 1])
    expect((out[2] as any).children.length).toBe(1)
    expect((src[2] as any).children.length).toBe(2)
  })

  it('insertInto adds section and grid children', () => {
    const sec = insertInto(tree(), [0], t('new') as any)
    const secKids = (sec[0] as any).children
    expect(secKids.length).toBe(3)
    expect(secKids[2].body).toBe('new')
    expect(secKids[2]._id).toBeTruthy()
    const grid = insertInto(tree(), [2], t('gx') as any)
    expect((grid[2] as any).children.length).toBe(3)
  })

  it('insertInto at root appends with a fresh id', () => {
    const out = insertInto(tree(), [], t('r') as any)
    expect(out.length).toBe(4)
    expect(out[3]._id).toBeTruthy()
  })

  it('blockChildren / withChildren round-trip', () => {
    const src = tree()
    const kids = blockChildren(src[2])
    expect(kids.map((b) => b._id)).toEqual(['g0', 'g1'])
    const next = withChildren(src[2], [...kids, heading('g2')])
    expect(blockChildren(next).length).toBe(3)
    expect(src[2].type === 'grid' && src[2].children.length).toBe(2)
  })

  it('childPath and moveChild work for section and grid parents', () => {
    expect(childPath([2], tree()[2], 0)).toEqual([2, 0])
    expect(childPath([0], tree()[0], 1)).toEqual([0, 1])
    expect(moveChild([heading('a'), heading('b')], 0, 1).map((b) => b._id)).toEqual(['b', 'a'])
    expect(moveChild([heading('a'), heading('b')], 0, -1).map((b) => b._id)).toEqual(['a', 'b'])
  })
})
