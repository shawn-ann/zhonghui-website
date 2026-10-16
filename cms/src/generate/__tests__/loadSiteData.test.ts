import { describe, it, expect } from 'vitest'
import { mapPageDoc, mapBlock, loadSiteData } from '../loadSiteData'

describe('mapPageDoc', () => {
  it('maps a payload page + blocks to PageDoc', () => {
    const raw = {
      title: '首页', route: '/', status: 'published',
      seo: { title: 'T', description: 'D' },
      blocks: [
        { blockType: 'text', title: 'a', body: 'b', align: 'center', bg: null, alt: false },
        { blockType: 'image', media: { url: '/media/x.jpg' }, altText: 'x', bg: null, alt: false },
      ],
    }
    const doc = mapPageDoc(raw as any, (m) => (typeof m === 'object' ? (m as any).url : m))
    expect(doc.blocks[0]).toEqual({ type: 'text', title: 'a', body: 'b', align: 'center', bg: undefined, alt: false })
    expect(doc.blocks[1]).toEqual({ type: 'image', media: '/media/x.jpg', altText: 'x', link: undefined, bg: undefined, alt: false })
  })
})

describe('loadSiteData', () => {
  it('queries published pages via payload.find', async () => {
    const payload = {
      find: async () => ({
        docs: [{ title: '首页', route: '/', status: 'published', blocks: [{ blockType: 'text', body: 'home' }] }],
      }),
    }
    const data = await loadSiteData(payload as any)
    expect(data.pages[0].route).toBe('/')
  })
})

describe('mapPageDoc robustness', () => {
  it('skips unknown block types', () => {
    const doc = mapPageDoc(
      { title: 't', route: '/', blocks: [{ blockType: 'richText', body: 'x' }, { blockType: 'text', body: 'ok' }] } as any,
      () => '',
    )
    expect(doc.blocks).toHaveLength(1)
    expect(doc.blocks[0].type).toBe('text')
  })
  it('resolves unpopulated media to empty string', () => {
    const doc = mapPageDoc({ title: 't', route: '/', blocks: [{ blockType: 'image', media: 7 }] } as any, (m) =>
      m && typeof m === 'object' && 'url' in (m as any) ? (m as any).url : '',
    )
    const img = doc.blocks[0]
    expect(img.type === 'image' && img.media).toBe('')
  })
})

const resolve = (m: unknown) => (m && typeof m === 'object' && 'url' in (m as any) ? (m as any).url : '')

describe('mapBlock', () => {
  it('maps grid recursively with inner components', () => {
    const raw = { blockType: 'grid', columns: 2, cells: [{ components: [{ blockType: 'text', body: 'hi' }] }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('grid')
    expect(b.cells[0].components[0].type).toBe('text')
  })
  it('maps gallery images to urls', () => {
    const raw = { blockType: 'gallery', columns: 2, images: [{ image: { url: '/media/1.jpg' } }, { image: { url: '/media/2.jpg' } }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('gallery')
    expect(b.images).toEqual(['/media/1.jpg', '/media/2.jpg'])
  })
  it('maps richtext content to html', () => {
    const raw = { blockType: 'richtext', content: { root: { children: [] } } }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('richtext')
    expect(typeof b.html).toBe('string')
  })
  it('returns null for unknown blockType', () => {
    expect(mapBlock({ blockType: 'nope' }, resolve)).toBeNull()
  })
})
