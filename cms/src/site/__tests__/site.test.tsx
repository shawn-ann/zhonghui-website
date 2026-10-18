import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Block, PageDoc } from '../../render/types'
import { blockNode, TopBlock } from '../blocks'
import { SiteNav } from '../nav'
import { SiteFooter } from '../footer'
import { SiteDocument } from '../SiteDocument'

const render = (node: React.ReactNode) => renderToStaticMarkup(node)

describe('site blocks', () => {
  it('renders text with data hooks and alignment', () => {
    const html = render(blockNode({ type: 'text', _id: 'b1', title: 'T', body: 'B', align: 'center' })!)
    expect(html).toContain('data-bid="b1"')
    expect(html).toContain('data-field="title"')
    expect(html).toContain('data-field="body"')
    expect(html).toContain('text-align:center')
  })

  it('renders heading and section padding/background', () => {
    const heading = render(blockNode({ type: 'heading', _id: 'h1', title: 'H', subtitle: 'S' })!)
    expect(heading).toContain('<h2>H</h2>')
    expect(heading).toContain('class="subtitle"')

    const section = render(blockNode({
      type: 'section', _id: 's1', paddingY: 'lg', bgImage: '/assets/bg.jpg', bgColor: '#FFF1F6', children: [],
    })!)
    expect(section).toContain('class="section on-image"')
    expect(section).toContain('padding:96px 0')
    expect(section).toContain('background-image:url(')
    expect(section).toContain('/assets/bg.jpg')
    expect(section).toContain('background-color:#FFF1F6')
  })

  it('renders banner variants', () => {
    const split = render(blockNode({
      type: 'banner', _id: 'b1', variant: 'split', title: '标题', sub: '副标题',
      image: '/a.jpg', pattern: '/p.png',
    })!)
    expect(split).toContain('banner banner--split')
    expect(split).toContain('class="banner-pattern"')
    expect(split).toContain('class="banner-photo"')

    const centered = render(blockNode({
      type: 'banner', _id: 'b2', variant: 'centered', title: '标题', image: '/a.jpg',
    })!)
    expect(centered).toContain('banner banner--centered')
    expect(centered).toContain('background-image:url(')
    expect(centered).toContain('/a.jpg')
  })

  it('renders grid cells, nested blocks and background', () => {
    const html = render(blockNode({
      type: 'grid', _id: 'g1', columns: 5, gap: 'lg', bgColor: '#FFF1F6', bgImage: '/g.jpg',
      children: [{ type: 'text', _id: 't1', body: 'x' }],
    })!)
    expect(html).toContain('grid grid-cols-4 grid-gap-lg')
    expect(html).toContain('class="grid-cell"')
    expect(html).toContain('data-bid="t1"')
    expect(html).toContain('background-color:#FFF1F6')
    expect(html).toContain('/g.jpg')
  })

  it('renders grid empty placeholders only in editor mode', () => {
    const empty: Block = { type: 'grid', _id: 'g1', columns: 3, gap: 'md', children: [] }
    const editorHtml = render(blockNode(empty, true))
    expect((editorHtml.match(/ed-grid-empty-cell/g) || []).length).toBe(3)
    expect(editorHtml).toContain('暂无组件')
    expect(editorHtml).toContain('从右侧添加组件')
    expect(editorHtml).not.toContain('ed-grid-add')

    const staticHtml = render(blockNode(empty))
    expect(staticHtml).not.toContain('ed-grid-empty-cell')
    expect(staticHtml).not.toContain('ed-grid-hint')
  })

  it('pads the last row with placeholders', () => {
    const one = render(blockNode({
      type: 'grid', _id: 'g1', columns: 3, children: [{ type: 'text', _id: 't1', body: 'x' }],
    }, true))
    expect((one.match(/ed-grid-empty-cell/g) || []).length).toBe(2)
    expect(one).toContain('ed-grid-hint')

    const full = render(blockNode({
      type: 'grid', _id: 'g2', columns: 2, children: [
        { type: 'text', _id: 't1', body: 'x' },
        { type: 'text', _id: 't2', body: 'y' },
      ],
    }, true))
    expect(full).not.toContain('ed-grid-empty-cell')
  })

  it('renders empty component placeholders only in editor mode', () => {
    const cases: [Block, string][] = [
      [{ type: 'text', _id: 't', body: '' }, '文本'],
      [{ type: 'image', _id: 'i', media: '' }, '图片'],
      [{ type: 'imageText', _id: 'it', media: '' }, '图文卡片'],
      [{ type: 'iconCard', _id: 'ic', icon: '' }, '图标卡片'],
      [{ type: 'button', _id: 'b', label: '', link: '' }, '按钮'],
      [{ type: 'heading', _id: 'h', title: '' }, '标题'],
      [{ type: 'gallery', _id: 'g', images: [] }, '图集'],
      [{ type: 'slider', _id: 's', images: [] }, '轮播'],
      [{ type: 'banner', _id: 'bn', variant: 'split' }, '横幅'],
      [{ type: 'richtext', _id: 'r', html: '' }, '富文本'],
    ]
    for (const [b, label] of cases) {
      const editorHtml = render(blockNode(b, true))
      expect(editorHtml).toContain('ed-empty-block')
      expect(editorHtml).toContain(`>${label}<`)
      const staticHtml = render(blockNode(b))
      expect(staticHtml).not.toContain('ed-empty-block')
    }
  })

  it('renders icon card line breaks, link wrapper and background', () => {
    const html = render(blockNode({
      type: 'iconCard', _id: 'i1', icon: '/i.svg', title: 'T', desc: 'a\nb', link: '/go/',
      bgColor: '#FFF1F6', bgImage: '/bg.jpg', iconColor: '#FF0000',
    })!)
    expect(html).toContain('class="adv-card"')
    expect(html).toContain('a<br/>b')
    expect(html).toContain('href="/go/"')
    expect(html).toContain('background-color:#FFF1F6')
    expect(html).toContain('/bg.jpg')
    expect(html).toContain('icon-glyph')
    expect(html).toContain('-webkit-mask-image:url(')
    expect(html).toContain('border-color:#FF0000')
  })

  it('renders button, gallery and slider', () => {
    const btn = render(blockNode({ type: 'button', _id: 'b1', label: 'Go', link: '/x/', style: 'outline' })!)
    expect(btn).toContain('class="btn btn--outline"')
    expect(btn).toContain('href="/x/"')

    const gallery = render(blockNode({ type: 'gallery', _id: 'ga1', columns: 2, images: ['/1.jpg', '/2.jpg'] })!)
    expect(gallery).toContain('gallery gallery-cols-2')
    expect((gallery.match(/gallery-item/g) || []).length).toBe(2)

    const slider = render(blockNode({ type: 'slider', _id: 'sl1', images: ['/1.jpg'] })!)
    expect(slider).toContain('swiper memory-swiper')
    expect(slider).toContain('memory-arrow prev')
  })

  it('wraps legacy top-level blocks in a section', () => {
    const html = render(<TopBlock b={{ type: 'text', body: 'x', alt: true } as Block} />)
    expect(html).toContain('class="section section-alt"')
  })
})

describe('site chrome', () => {
  it('marks the active nav route and renders dropdowns', () => {
    const html = render(<SiteNav activeRoute="/about/" />)
    expect(html).toContain('class="active">关于中惠')
    expect(html).toContain('SWT 赴美带薪实习')
  })

  it('renders footer info', () => {
    const html = render(<SiteFooter />)
    expect(html).toContain('010-64159286')
    expect(html).toContain('info@zhonghui.com')
  })
})

describe('SiteDocument', () => {
  const page: PageDoc = {
    title: '首页',
    route: '/',
    seo: { title: '中惠文化' },
    blocks: [{ type: 'text', body: 'hi' }],
  }

  it('external mode links assets and scripts', () => {
    const html = render(<SiteDocument page={page} assets={{ mode: 'external' }} />)
    expect(html).toContain('/assets/style.css')
    expect(html).toContain('/assets/swiper-bundle.min.js')
    expect(html).toContain('/assets/main.js')
    expect(html).toContain('<header')
    expect(html).toContain('<footer')
    expect(html).toContain('hi')
  })

  it('inline mode inlines css/scripts and appends link lock', () => {
    const html = render(
      <SiteDocument page={page} assets={{ mode: 'inline', css: '.x{}', swiperJs: 'SWIPER', mainJs: 'MAIN', disableLinks: true }} />,
    )
    expect(html).toContain('<style>.x{}</style>')
    expect(html).toContain('<script>SWIPER</script>')
    expect(html).toContain("closest('a')")
  })
})
