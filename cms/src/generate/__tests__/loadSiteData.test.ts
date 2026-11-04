import { describe, it, expect } from 'vitest'
import { mapPageDoc, mapBlock, loadSiteData } from '../loadSiteData'

describe('mapPageDoc', () => {
  it('maps a payload page + blocks to PageDoc', () => {
    const raw = {
      title: '首页', route: '/',
      blocks: [
        { blockType: 'text', title: 'a', body: 'b', align: 'center', bg: null, alt: false },
        { blockType: 'image', media: { url: '/media/x.jpg' }, altText: 'x', bg: null, alt: false },
      ],
    }
    const doc = mapPageDoc(raw as any, (m) => (typeof m === 'object' ? (m as any).url : m))
    expect(doc.blocks[0]).toEqual({ type: 'text', title: 'a', body: 'b', align: 'center', bg: undefined, alt: false })
    expect(doc.blocks[1]).toEqual({
      type: 'image', media: '/media/x.jpg', altText: 'x', link: undefined,
      linkType: 'none', internalPageId: undefined, internalRoute: undefined, externalUrl: undefined,
      aspectRatio: 'auto', fit: 'cover', padding: undefined, bg: undefined, alt: false,
    })
  })
})

describe('loadSiteData', () => {
  it('queries published pages via _status', async () => {
    let captured: any
    const payload = {
      find: async (args: any) => {
        if (args.collection !== 'pages') return { docs: [] }
        captured = args
        return { docs: [{ title: '首页', route: '/', _status: 'published', blocks: [{ blockType: 'text', body: 'home' }] }] }
      },
    }
    const data = await loadSiteData(payload as any)
    expect(captured.where).toEqual({ _status: { equals: 'published' } })
    expect(data.pages[0].route).toBe('/')
  })

  it('builds case pages and redirects from collections', async () => {
    const payload = {
      find: async (args: any) => {
        if (args.collection === 'pages') return { docs: [] }
        if (args.collection === 'case-categories') {
          return { docs: [{ id: 1, title: '案例分享', slug: 'study-case', pageSize: 12, order: 0 }] }
        }
        if (args.collection === 'cases') {
          expect(args.where).toEqual({ _status: { equals: 'published' } })
          return { docs: [
            {
              id: 2, title: '小曹', slug: 'xiaocao', category: 1, _status: 'published',
              cover: { url: '/media/cover.jpg' }, publishedAt: '2025-07-02', body: { root: { children: [] } },
            },
            {
              id: 3, title: '草稿', slug: 'draft', category: 1, _status: 'draft',
              cover: { url: '/media/draft.jpg' }, publishedAt: '2025-07-03', body: { root: { children: [] } },
            },
          ] }
        }
        if (args.collection === 'case-redirects') {
          return { docs: [{ from: '/blog/old/xiaocao/', to: '/blog/study-case/xiaocao/' }] }
        }
        return { docs: [] }
      },
      findGlobal: async () => ({}),
    }
    const data = await loadSiteData(payload as any)
    expect(data.pages.map((p) => p.route)).toEqual(expect.arrayContaining([
      '/blog/study-case/', '/blog/study-case/xiaocao/',
    ]))
    expect(data.pages.find((p) => p.route === '/blog/')).toBeUndefined()
    expect(data.pages.find((p) => p.route.includes('/draft/'))).toBeUndefined()
    expect(data.redirects).toEqual([{ from: '/blog/old/xiaocao/', to: '/blog/study-case/xiaocao/' }])
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
  it('maps row-layout grid blocks and their cells', () => {
    const row = mapBlock({
      blockType: 'gridRow',
      columns: 6,
      gap: 'md',
      columnRatio: '1:1:1:1:1:1',
      children: [{ blockType: 'gridCell', children: [{ blockType: 'text', body: 'x' }] }],
    }, resolve) as any
    expect(row).toMatchObject({
      type: 'gridRow', columns: 6, gap: 'md', columnRatio: '1:1:1:1:1:1',
    })
    expect(row.children[0]).toMatchObject({ type: 'gridCell' })
    expect(row.children[0].children[0]).toMatchObject({ type: 'text', body: 'x' })

    const grid = mapBlock({
      blockType: 'grid', layout: 'rows', columns: 6, children: [{
        blockType: 'gridRow', columns: 6, children: [],
      }],
    }, resolve) as any
    expect(grid).toMatchObject({ type: 'grid', layout: 'rows' })
    expect(grid.children[0]).toMatchObject({ type: 'gridRow' })
  })

  it('expands row columns to cover populated cells', () => {
    const row = mapBlock({
      blockType: 'gridRow',
      columns: 3,
      children: Array.from({ length: 5 }, (_, i) => ({
        blockType: 'gridCell',
        children: [{ blockType: 'text', body: String(i) }],
      })),
    }, resolve) as any
    expect(row.columns).toBe(5)
  })

  it('resolves external, internal and legacy links', () => {
    const external = mapBlock({
      blockType: 'imageText', media: { url: '/a.jpg' },
      linkType: 'external', externalUrl: 'https://example.com/x',
    }, resolve) as any
    expect(external).toMatchObject({ link: 'https://example.com/x', linkType: 'external' })

    const internal = mapBlock({
      blockType: 'iconCard', icon: { url: '/i.svg' },
      linkType: 'internal', internalPage: { id: 3, route: '/about/' },
    }, resolve) as any
    expect(internal).toMatchObject({ link: '/about/', internalPageId: 3, internalRoute: '/about/' })

    const byId = mapPageDoc({
      title: 't', route: '/',
      blocks: [{ blockType: 'imageText', media: { url: '/a.jpg' }, linkType: 'internal', internalPage: 9 }],
    } as any, resolve, new Map([['9', '/cases/']]))
    expect((byId.blocks[0] as any).link).toBe('/cases/')

    const legacy = mapBlock({ blockType: 'imageText', media: { url: '/a.jpg' }, link: '/legacy/' }, resolve) as any
    expect(legacy).toMatchObject({ link: '/legacy/', linkType: 'external', externalUrl: '/legacy/' })
  })

  it('maps grid recursively with inner components', () => {
    const raw = { blockType: 'grid', columns: 2, children: [{ blockType: 'text', body: 'hi' }] }
    const b = mapBlock(raw, resolve) as any
    expect(b.type).toBe('grid')
    expect(b.children[0].type).toBe('text')
  })
  it('resolves page links for image and button', () => {
    const image = mapBlock({
      blockType: 'image', media: { url: '/a.jpg' },
      linkType: 'internal', internalPage: { id: 7, route: '/contact/' },
    }, resolve) as any
    expect(image).toMatchObject({ link: '/contact/', linkType: 'internal', internalPageId: 7, internalRoute: '/contact/' })

    const button = mapBlock({
      blockType: 'button', label: '去', linkType: 'external', externalUrl: 'https://example.com',
    }, resolve) as any
    expect(button).toMatchObject({ link: 'https://example.com', linkType: 'external' })
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
  it('maps info list, icon list and hscroll recursively', () => {
    const info = mapBlock({
      blockType: 'infoList', showDots: false, title: '标题', titleAlign: 'center',
      items: [{ label: '食宿', desc: '免费' }, { desc: '无标签' }],
    }, resolve) as any
    expect(info).toMatchObject({ type: 'infoList', showDots: false, title: '标题', titleAlign: 'center' })
    expect(info.items).toEqual([{ label: '食宿', desc: '免费' }, { label: undefined, desc: '无标签' }])

    const icons = mapBlock({
      blockType: 'iconList', iconPosition: 'alternate',
      items: [{ icon: { url: '/i.svg' }, title: '步骤', desc: '说明' }],
    }, resolve) as any
    expect(icons.items[0].icon).toBe('/i.svg')

    const image = mapBlock({ blockType: 'image', media: { url: '/a.jpg' }, aspectRatio: '4:3', fit: 'contain' }, resolve) as any
    expect(image).toMatchObject({ type: 'image', aspectRatio: '4:3', fit: 'contain' })

    const imageText = mapBlock({ blockType: 'imageText', media: { url: '/a.jpg' }, imageRatio: '16:9' }, resolve) as any
    expect(imageText).toMatchObject({ type: 'imageText', imageRatio: '16:9' })

    const stack = mapBlock({
      blockType: 'stack', gap: 'lg', bgColor: '#FFF1F6', padding: 20,
      children: [{ blockType: 'text', body: 'A' }, { blockType: 'text', body: 'B' }],
    }, resolve) as any
    expect(stack).toMatchObject({ type: 'stack', gap: 'lg', bgColor: '#FFF1F6', padding: 20 })
    expect(stack.children).toHaveLength(2)

    const rail = mapBlock({
      blockType: 'hscroll', timeline: true,
      children: [{ blockType: 'imageText', media: { url: '/a.jpg' }, title: '2002' }],
    }, resolve) as any
    expect(rail).toMatchObject({ type: 'hscroll', timeline: true })
    expect(rail.children[0]).toMatchObject({ type: 'imageText', media: '/a.jpg', title: '2002' })
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
  it('maps section paddingY and defaults to md', () => {
    const b = mapBlock({ blockType: 'section', paddingY: 'none' }, resolve) as any
    expect(b).toMatchObject({ type: 'section', paddingY: 'none' })
    const d = mapBlock({ blockType: 'section' }, resolve) as any
    expect(d.paddingY).toBe('md')
    const gapped = mapBlock({ blockType: 'section', contentGap: 32 }, resolve) as any
    expect(gapped.contentGap).toBe(32)
  })
  it('ignores legacy per-side section padding fields', () => {
    const b = mapBlock({ blockType: 'section', paddingTop: 60, paddingBottom: 120 }, resolve) as any
    expect(b).toMatchObject({ type: 'section' })
    expect(b).not.toHaveProperty('paddingTop')
    expect(b).not.toHaveProperty('paddingBottom')
    expect(b).not.toHaveProperty('paddingLeft')
    expect(b).not.toHaveProperty('paddingRight')
  })
  it('maps content block padding', () => {
    const b = mapBlock({ blockType: 'text', body: 'x', padding: 16 }, resolve) as any
    expect(b.padding).toBe(16)
  })
})
