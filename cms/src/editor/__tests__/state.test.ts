import { describe, it, expect } from 'vitest'
import { addBlock, moveBlock, removeBlock, updateBlockField, ensureIds } from '../state'
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
