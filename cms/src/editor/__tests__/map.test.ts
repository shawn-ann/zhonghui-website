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

  it('serializes nested grid cells', () => {
    const ed: any = [{ type: 'grid', columns: 2, gap: 'md', _id: 'g1', cells: [{ components: [{ type: 'text', body: 'x', _id: 't2' }] }] }]
    const back = editorToPayloadBlocks(ed, new Map())
    expect(back[0].blockType).toBe('grid')
    expect(back[0].cells[0].components[0]).toMatchObject({ blockType: 'text', body: 'x', id: 't2' })
  })
})
