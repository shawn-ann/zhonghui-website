import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Block, PageDoc } from '../../render/types'
import { blockNode, TopBlock } from '../blocks'
import { SiteNav } from '../nav'
import { SiteFooter } from '../footer'
import { SiteDocument } from '../SiteDocument'
import { DEFAULT_SETTINGS } from '../config'

const render = (node: React.ReactNode) => renderToStaticMarkup(node)

describe('site blocks', () => {
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

  it('applies custom text colors through CSS variables', () => {
    const heading = render(blockNode({
      type: 'heading', _id: 'h', title: 'T', subtitle: 'S',
      titleColor: '#FFFFFF', subtitleColor: '#8A0E4B',
    })!)
    expect(heading).toContain('--title-color:#FFFFFF')
    expect(heading).toContain('--sub-color:#8A0E4B')

    const banner = render(blockNode({
      type: 'banner', _id: 'b', variant: 'split', title: 'T', sub: 'S',
      titleColor: '#FFFFFF', subColor: '#FAFAFA',
    })!)
    expect(banner).toContain('--title-color:#FFFFFF')
    expect(banner).toContain('--sub-color:#FAFAFA')

    const card = render(blockNode({
      type: 'imageText', _id: 'it', media: '/a.jpg', title: 'T', desc: 'D',
      titleColor: '#FFFFFF', descColor: '#EEEEEE',
    })!)
    expect(card).toContain('--title-color:#FFFFFF')
    expect(card).toContain('--sub-color:#EEEEEE')

    const icon = render(blockNode({
      type: 'iconCard', _id: 'ic', icon: '/i.svg', title: 'T', desc: 'D',
      titleColor: '#FFFFFF', descColor: '#DDDDDD',
    })!)
    expect(icon).toContain('--title-color:#FFFFFF')
    expect(icon).toContain('--sub-color:#DDDDDD')
  })

  it('renders five-column grids and compact icon cards', () => {
    const grid = render(blockNode({ type: 'grid', _id: 'g5', columns: 5, children: [] })!)
    expect(grid).toContain('grid-cols-5')

    const six = render(blockNode({ type: 'grid', _id: 'g6', columns: 6, children: [] })!)
    expect(six).toContain('grid-cols-6')

    const card = render(blockNode({
      type: 'iconCard', _id: 'ic', icon: '/icon.svg', title: '知乎', desc: '中惠互惠生', variant: 'compact',
    })!)
    expect(card).toContain('adv-card is-compact')
  })

  it('renders image text with the configured image fit', () => {
    const contain = render(blockNode({
      type: 'imageText', _id: 'it1', media: '/qr.png', imageRatio: '1:1', imageFit: 'contain',
    })!)
    expect(contain).toContain('object-fit:contain')

    const cover = render(blockNode({ type: 'imageText', _id: 'it2', media: '/a.jpg' })!)
    expect(cover).toContain('object-fit:cover')
  })

  it('renders icon cards without a frame and with a custom icon size', () => {
    const html = render(blockNode({
      type: 'iconCard', _id: 'ic', icon: '/icon.png', title: '知乎',
      variant: 'compact', iconFrame: 'none', iconSize: 44,
    })!)
    expect(html).toContain('is-icon-plain')
    expect(html).toContain('--icon-size:44px')
  })

  it('renders SEO title and description from the page template', () => {
    const html = render(<SiteDocument
      page={{ title: '原题', route: '/blog/x/', blocks: [], seo: { title: 'SEO 标题', description: 'SEO 描述' } }}
      assets={{ mode: 'external' }}
    />)
    expect(html).toContain('<title>SEO 标题</title>')
    expect(html).toContain('<meta name="description" content="SEO 描述"/>')
  })

  it('keeps a category menu item active on case detail routes', () => {
    const nav = render(<SiteNav
      activeRoute="/blog/study-case/xiaocao/"
      menu={[{ label: '案例分享', link: '/blog/study-case/' }]}
      settings={{ ...DEFAULT_SETTINGS, footerQr: [] }}
    />)
    expect(nav).toContain('class="active"')
  })

  it('renders the qr variant without the white card background', () => {
    const html = render(blockNode({
      type: 'imageText', _id: 'qr', media: '/test.png', title: '公众号', variant: 'qr', imageFit: 'contain',
    })!)
    expect(html).toContain('image-text is-qr')
    expect(html).not.toContain('<p data-field="desc">')
  })

  it('renders row-layout grids with explicit empty cells', () => {
    const cell = (children: any[] = []): any => ({ type: 'gridCell', children })
    const row = (cells: any[]): any => ({ type: 'gridRow', _id: 'r1', columns: 6, columnRatio: '1:1:1:1:1:1', children: cells })
    const html = render(blockNode({
      type: 'grid', _id: 'g1', layout: 'rows', columns: 6, children: [
        row([
          cell(), cell(),
          cell([{ type: 'heading', _id: 't1', title: '二维码 A' }]),
          cell([{ type: 'heading', _id: 't2', title: '二维码 B' }]),
          cell(), cell(),
        ]),
      ],
    })!)
    expect(html).toContain('grid-rows')
    expect((html.match(/class="grid-cell/g) || []).length).toBe(6)
    expect(html).toContain('二维码 A')
    expect(html).toContain('二维码 B')
  })

  it('renders every populated row cell even when columns is understated', () => {
    const cells: any[] = Array.from({ length: 5 }, (_, i) => ({
      type: 'gridCell', _id: `c${i}`, children: [{ type: 'heading', _id: `t${i}`, title: String(i) }],
    }))
    const html = render(blockNode({
      type: 'grid', _id: 'g', layout: 'rows', columns: 3,
      children: [{ type: 'gridRow', _id: 'r', columns: 3, children: cells }],
    })!)
    expect((html.match(/class="grid-cell/g) || []).length).toBe(5)
    expect(html).toContain('>4<')
  })

  it('falls back to flow when rows mode has no rows', () => {
    const html = render(blockNode({
      type: 'grid', _id: 'g', layout: 'rows', columns: 3,
      children: [{ type: 'heading', _id: 't', title: 'direct' }],
    })!)
    expect(html).not.toContain('grid-rows')
    expect(html).toContain('direct')
  })

  it('keeps mixed row and direct children visible', () => {
    const html = render(blockNode({
      type: 'grid', _id: 'g', layout: 'rows', columns: 3,
      children: [
        { type: 'gridRow', _id: 'r', columns: 3, children: [] },
        { type: 'heading', _id: 't', title: 'mixed' },
      ],
    })!)
    expect(html).toContain('mixed')
    expect(html).not.toContain('grid-rows')
  })

  it('marks empty cells as selectable in the editor', () => {
    const html = render(blockNode({ type: 'gridCell', _id: 'c1', children: [] }, true)!)
    expect(html).toContain('data-bid="c1"')
    expect(html).toContain('ed-grid-empty-cell')
  })

  it('keeps legacy flow grids when layout is absent', () => {
    const legacy = render(blockNode({
      type: 'grid', _id: 'g0', columns: 3, children: [{ type: 'heading', _id: 't0', title: 'x' }],
    })!)
    expect(legacy).not.toContain('grid-rows')
    expect(legacy).toContain('grid-cols-3')
  })

  it('wraps flow grids into multiple rows by column count', () => {
    const grid = (columns: number, count: number) => render(blockNode({
      type: 'grid', _id: `g${columns}-${count}`, columns,
      children: Array.from({ length: count }, (_, i) => ({ type: 'heading' as const, _id: `t${i}`, title: String(i) })),
    })!)
    expect((grid(3, 6).match(/class="grid-cell/g) || []).length).toBe(6)
    expect((grid(3, 9).match(/class="grid-cell/g) || []).length).toBe(9)
    expect((grid(4, 8).match(/class="grid-cell/g) || []).length).toBe(8)
  })

  it('renders editor rich text from live content instead of stale html', () => {
    const content = {
      root: {
        type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [{
          type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
          children: [{ type: 'text', text: 'NEW', format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
        }],
      },
    }
    const html = render(blockNode({ type: 'richtext', _id: 'r', html: '<p>OLD</p>', content }, true)!)
    expect(html).toContain('NEW')
    expect(html).not.toContain('OLD')

    const staticHtml = render(blockNode({ type: 'richtext', _id: 'r', html: '<p>OLD</p>', content })!)
    expect(staticHtml).toContain('OLD')
    expect(staticHtml).not.toContain('NEW')
  })

  it('renders a gradient background band with fixed height', () => {
    const html = render(blockNode({
      type: 'section', _id: 's1', paddingY: 'md', bgHeight: 304,
      bgGradient: 'linear-gradient(90deg, #FC0401 0%, #FC1972 100%)', children: [],
    })!)
    expect(html).toContain('linear-gradient(90deg, #FC0401 0%, #FC1972 100%)')
    expect(html).toContain('background-size:100% 304px')
    expect(html).toContain('background-repeat:no-repeat')
    expect(html).toContain('background-position:top center')
    expect(html).toContain('background-color:#fff')
    expect(html).not.toContain('on-image')
  })

  it('renders a full gradient without height', () => {
    const html = render(blockNode({
      type: 'section', _id: 's2', bgGradient: 'linear-gradient(90deg,#f00,#00f)', children: [],
    })!)
    expect(html).toContain('linear-gradient(90deg,#f00,#00f)')
    expect(html).not.toContain('background-size:100%')
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
      children: [{ type: 'heading', _id: 't1', title: 'x' }],
    })!)
    expect(html).toContain('grid grid-cols-5 grid-gap-lg')
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
      type: 'grid', _id: 'g1', columns: 3, children: [{ type: 'heading', _id: 't1', title: 'x' }],
    }, true))
    expect((one.match(/ed-grid-empty-cell/g) || []).length).toBe(2)
    expect(one).toContain('ed-grid-hint')

    const full = render(blockNode({
      type: 'grid', _id: 'g2', columns: 2, children: [
        { type: 'heading', _id: 't1', title: 'x' },
        { type: 'heading', _id: 't2', title: 'y' },
      ],
    }, true))
    expect(full).not.toContain('ed-grid-empty-cell')
  })

  it('renders empty component placeholders only in editor mode', () => {
    const cases: [Block, string][] = [
      [{ type: 'image', _id: 'i', media: '' }, '图片'],
      [{ type: 'imageText', _id: 'it', media: '' }, '图文卡片'],
      [{ type: 'iconCard', _id: 'ic', icon: '' }, '图标卡片'],
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

  it('renders gallery and slider', () => {
    const gallery = render(blockNode({ type: 'gallery', _id: 'ga1', columns: 2, images: ['/1.jpg', '/2.jpg'] })!)
    expect(gallery).toContain('gallery gallery-cols-2')
    expect((gallery.match(/gallery-item/g) || []).length).toBe(2)

    const slider = render(blockNode({ type: 'slider', _id: 'sl1', images: ['/1.jpg'] })!)
    expect(slider).toContain('swiper memory-swiper')
    expect(slider).toContain('memory-arrow prev')
  })

  it('wraps legacy top-level blocks in a section', () => {
    const html = render(<TopBlock b={{ type: 'heading', title: 'x', alt: true } as Block} />)
    expect(html).toContain('class="section section-alt"')
  })
})

describe('site chrome', () => {
  it('marks the active nav route and renders dropdowns', () => {
    const menu = [
      { label: '首页', link: '/' },
      { label: '关于中惠', link: '/about/' },
      { label: '赴美J1交流项目', link: '/project-iccp/', children: [{ label: 'SWT 赴美带薪实习', link: '/project-swt/' }] },
    ]
    const html = render(<SiteNav activeRoute="/about/" menu={menu} settings={DEFAULT_SETTINGS} />)
    expect(html).toContain('<li class="active"><a href="/about/">关于中惠</a></li>')
    expect(html).toContain('SWT 赴美带薪实习')
  })

  it('hides the other language link when no URL is configured', () => {
    const html = render(<SiteNav activeRoute="/" menu={[]} settings={{ ...DEFAULT_SETTINGS, langOtherUrl: '' }} />)
    expect(html).not.toContain('>EN</a>')
  })

  it('renders a linkless parent as a non-navigating label', () => {
    const menu = [
      { label: '赴美J1交流项目', link: '', children: [{ label: 'ICCP赴美营地辅导员', link: '/project-iccp/' }] },
    ]
    const html = render(<SiteNav activeRoute="/project-iccp/" menu={menu} settings={DEFAULT_SETTINGS} />)
    expect(html).toContain('class="nav-no-link"')
    expect(html).toContain('<li class="active">')
    expect(html).toContain('ICCP赴美营地辅导员')
    expect(html).not.toContain('href=""')
  })

  it('renders footer info', () => {
    const html = render(<SiteFooter settings={DEFAULT_SETTINGS} />)
    expect(html).toContain('010-64159286')
    expect(html).toContain('info@zhonghui.com')
  })

  it('renders any number of QR codes', () => {
    const html = render(<SiteFooter settings={{
      ...DEFAULT_SETTINGS,
      footerQr: [{ label: '公众号' }, { label: '咨询微信' }, { label: '视频号' }, { label: '小红书' }],
    }} />)
    expect(html.match(/class="qr-item"/g)).toHaveLength(4)
  })

  it('hides the copyright text and QR box when empty', () => {
    const html = render(<SiteFooter settings={{ ...DEFAULT_SETTINGS, copyright: '', footerQr: [] }} />)
    expect(html).not.toContain('footer-copy')
    expect(html).not.toContain('qr-box')
  })
})

describe('SiteDocument', () => {
  const page: PageDoc = {
    title: '首页',
    route: '/',
      blocks: [{ type: 'heading', title: 'hi' }],
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
