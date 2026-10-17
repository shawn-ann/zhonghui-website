import { describe, it, expect } from 'vitest'
import { docToEditorDoc, editorToPayloadBlocks } from '../map'

describe('editorToPayloadBlocks', () => {
  it('round-trips a text block', () => {
    const raw = { id: 2, title: '首页', route: '/', _status: 'published', blocks: [{ id: 't1', blockType: 'text', body: 'hi', align: 'center' }] }
    const ed = docToEditorDoc(raw)
    expect(ed.blocks[0]).toMatchObject({ type: 'text', body: 'hi', _id: 't1' })
    const back = editorToPayloadBlocks(ed.blocks, new Map())
    expect(back[0]).toMatchObject({ blockType: 'text', body: 'hi', align: 'center', id: 't1' })
  })

  it('maps media url to id and preserves richtext content', () => {
    const raw = { id: 1, title: 't', route: '/', blocks: [
      { id: 'i1', blockType: 'image', media: 7 },
      { id: 'r1', blockType: 'richtext', content: { root: { children: [] } } },
    ] }
    const ed = docToEditorDoc(raw)
    const urlToId = new Map<string, number>([['/api/media/file/a.jpg', 7]])
    ;(ed.blocks[0] as any).media = '/api/media/file/a.jpg'
    const back = editorToPayloadBlocks(ed.blocks, urlToId)
    expect(back[0].media).toBe(7)                 // url -> id
    expect(back[1].content).toEqual({ root: { children: [] } }) // richtext preserved via _raw
  })

  it('maps a registered upload url to its media id', () => {
    const ed: any = [{ type: 'image', media: '/assets/media/a.jpg', _id: 'i1' }]
    const urlToId = new Map<string, number>([['/assets/media/a.jpg', 42]])
    const back = editorToPayloadBlocks(ed, urlToId)
    expect(back[0].media).toBe(42)
  })

  it('falls back to the _raw media id when the new url is unresolved (not dropped)', () => {
    const raw = { id: 1, title: 't', route: '/', blocks: [{ id: 'i1', blockType: 'image', media: 7 }] }
    const ed = docToEditorDoc(raw)
    ;(ed.blocks[0] as any).media = '/assets/media/unmapped.jpg'
    const back = editorToPayloadBlocks(ed.blocks, new Map())
    expect(back[0].media).toBe(7)
  })

  it('falls back to _raw gallery images when urls are unresolved', () => {
    const raw = { id: 1, title: 't', route: '/', blocks: [{ id: 'g1', blockType: 'gallery', images: [{ image: 5 }, { image: 6 }] }] }
    const ed = docToEditorDoc(raw)
    ;(ed.blocks[0] as any).images = ['/assets/media/x.jpg', '/assets/media/y.jpg']
    const back = editorToPayloadBlocks(ed.blocks, new Map())
    expect(back[0].images).toEqual([{ image: 5 }, { image: 6 }])
  })

  it('keeps unknown block types as passthrough and round-trips them unchanged', () => {
    const raw = { id: 1, title: 't', route: '/', blocks: [{ id: 'u1', blockType: 'futureBlock', foo: 'bar' }] }
    const ed = docToEditorDoc(raw)
    expect(ed.blocks).toHaveLength(1)
    const back = editorToPayloadBlocks(ed.blocks, new Map())
    expect(back[0]).toEqual({ id: 'u1', blockType: 'futureBlock', foo: 'bar' })
  })

  it('serializes nested grid children', () => {
    const ed: any = [{ type: 'grid', columns: 2, gap: 'md', _id: 'g1', children: [{ type: 'text', body: 'x', _id: 't2' }] }]
    const back = editorToPayloadBlocks(ed, new Map())
    expect(back[0].blockType).toBe('grid')
    expect(back[0].children[0]).toMatchObject({ blockType: 'text', body: 'x', id: 't2' })
  })

  it('round-trips grid children through the editor document', () => {
    const raw = { id: 1, title: 't', route: '/', blocks: [
      { id: 'g1', blockType: 'grid', columns: 2, children: [{ id: 't1', blockType: 'text', body: 'x' }] },
    ] }
    const ed = docToEditorDoc(raw)
    expect((ed.blocks[0] as any).children[0]).toMatchObject({ type: 'text', body: 'x', _id: 't1' })
    const back = editorToPayloadBlocks(ed.blocks, new Map())
    expect(back[0].children[0]).toMatchObject({ blockType: 'text', body: 'x', id: 't1' })
  })
})
