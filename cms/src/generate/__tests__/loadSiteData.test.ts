import { describe, it, expect } from 'vitest'
import { mapPageDoc, mapBlock, loadSiteData } from '../loadSiteData'

describe('mapPageDoc', () => {
  it('maps a payload page + blocks to PageDoc', () => {
    const raw = {
      title: '首页', route: '/',
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
  it('queries published pages via _status', async () => {
    let captured: any
    const payload = {
      find: async (args: any) => {
        captured = args
        return { docs: [{ title: '首页', route: '/', _status: 'published', blocks: [{ blockType: 'text', body: 'home' }] }] }
      },
    }
    const data = await loadSiteData(payload as any)
    expect(captured.where).toEqual({ _status: { equals: 'published' } })
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
    const raw = { blockType: 'grid', columns: 2, children: [{ blockType: 'text', body: 'hi' }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('grid')
    expect(b.children[0].type).toBe('text')
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
  it('drops unknown child blocks inside a grid cell', () => {
    const raw = { blockType: 'grid', columns: 2, children: [{ blockType: 'nope' }, { blockType: 'text', body: 'x' }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.children).toHaveLength(1)
    expect(b.children[0].type).toBe('text')
  })
  it('maps gridInner to a grid block', () => {
    const raw = { blockType: 'gridInner', columns: 1, children: [{ blockType: 'text', body: 'x' }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('grid')
  })
  it('coerces missing required strings to empty', () => {
    const b = mapBlock({ blockType: 'text' }, resolve) as any
    expect(b.body).toBe('')
  })
  it('maps section 4-direction padding to flat fields', () => {
    const b = mapBlock({ blockType: 'section', paddingTop: 60, paddingBottom: 120 }, resolve) as any
    expect(b).toMatchObject({
      type: 'section',
      paddingTop: 60,
      paddingRight: 0,
      paddingBottom: 120,
      paddingLeft: 0,
    })
  })
  it('maps content block padding', () => {
    const b = mapBlock({ blockType: 'text', body: 'x', padding: 16 }, resolve) as any
    expect(b.padding).toBe(16)
  })
})
