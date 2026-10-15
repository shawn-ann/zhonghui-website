import { describe, it, expect } from 'vitest'
import { mapPageDoc, loadSiteData } from '../loadSiteData'

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
