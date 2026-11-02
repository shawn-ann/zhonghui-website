import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { blockNode } from '../../site/blocks'
import { lexicalToHtml } from '../richText'
import type { GridBlock, HscrollBlock, IconListBlock, ImageBlock, ImageTextBlock, InfoListBlock, StackBlock, TextBlock } from '../types'

const render = (b: any) => renderToStaticMarkup(blockNode(b)!)

describe('content component extensions', () => {
  it('applies text font size, weight and max width', () => {
    const b: TextBlock = {
      type: 'text',
      _id: 't',
      body: '正文',
      fontSize: 16,
      fontWeight: '600',
      maxWidth: 760,
      marginTop: 14,
      align: 'center',
    }
    const html = render(b)
    expect(html).toContain('font-size:16px')
    expect(html).toContain('font-weight:600')
    expect(html).toContain('max-width:760px')
    expect(html).toContain('margin-top:14px')
  })

  it('applies section child gap', () => {
    const html = render({ type: 'section', _id: 'sg', contentGap: 32, children: [{ type: 'text', body: 'A' }] })
    expect(html).toContain('class="section-content"')
    expect(html).toContain('gap:32px')
  })

  it('supports large and custom section padding', () => {
    const large = render({ type: 'section', _id: 's1', paddingY: '2xl', children: [] })
    expect(large).toContain('padding:160px 0')
    const custom = render({ type: 'section', _id: 's2', paddingY: 'md', paddingCustom: 120, children: [] })
    expect(custom).toContain('padding:120px 0')
  })

  it('converts rich text image rows to a gallery', () => {
    const html = lexicalToHtml({
      root: {
        type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [{ type: 'image-row', version: 1, columns: 2, images: [{ src: '/api/media/file/a.jpg', alt: 'A' }] }],
      },
    })
    expect(html).toContain('richtext-gallery-cols-2')
    expect(html).toContain('/api/media/file/a.jpg')
  })

  it('converts a single rich text image', () => {
    const html = lexicalToHtml({
      root: {
        type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [{ type: 'rich-image', version: 1, src: '/api/media/file/b.jpg', alt: 'B' }],
      },
    })
    expect(html).toContain('richtext-image')
    expect(html).toContain('/api/media/file/b.jpg')
  })

  it('renders text line breaks', () => {
    const html = render({ type: 'text', _id: 'tb', body: '第一行\n第二行' })
    expect(html).toContain('第一行<br/>第二行')
  })

  it('renders grid column ratio for two columns', () => {
    const b: GridBlock = {
      type: 'grid',
      _id: 'g',
      columns: 2,
      columnRatio: '2:3',
      children: [],
    }
    expect(render(b)).toContain('grid-template-columns:2fr 3fr')
  })

  it('applies grid vertical alignment and image aspect ratio', () => {
    const grid: GridBlock = {
      type: 'grid', _id: 'g2', columns: 2, alignItems: 'start',
      children: [{ type: 'image', media: '/a.jpg', aspectRatio: '4:3', fit: 'cover' }],
    }
    const html = render(grid)
    expect(html).toContain('align-items:start')
    expect(html).toContain('aspect-ratio:4 / 3')
    expect(html).toContain('object-fit:cover')
  })

  it('renders image text subtitle and ratio', () => {
    const b: ImageTextBlock = {
      type: 'imageText',
      _id: 'it',
      media: '/a.jpg',
      title: 'Lucy',
      subtitle: '创始人',
      imageRatio: '16:9',
    }
    const html = render(b)
    expect(html).toContain('it-subtitle')
    expect(html).toContain('创始人')
    expect(html).toContain('aspect-ratio:16 / 9')
  })

  it('renders info list with and without dots', () => {
    const b: InfoListBlock = {
      type: 'infoList',
      _id: 'i',
      showDots: false,
      title: '专业师资团队',
      titleAlign: 'center',
      items: [{ label: '', desc: '说明一' }, { label: '食宿', desc: '免费' }],
    }
    const html = render(b)
    expect(html).toContain('info-list-title is-center')
    expect(html).toContain('info-item')
    expect(html).not.toContain('info-dot')
    expect(html).toContain('食宿')
  })

  it('renders icon list alternate and hscroll children', () => {
    const icon: IconListBlock = {
      type: 'iconList',
      _id: 'il',
      iconPosition: 'alternate',
      items: [{ icon: '/i.svg', title: '步骤', desc: '说明' }],
    }
    expect(render(icon)).toContain('icon-position-alternate')

    const rail: HscrollBlock = {
      type: 'hscroll',
      _id: 'h',
      timeline: true,
      children: [{ type: 'imageText', media: '/a.jpg', title: '2002', desc: '事件' }],
    }
    const html = render(rail)
    expect(html).toContain('hscroll-inner')
    expect(html).toContain('timeline')
  })

  it('renders a vertical stack inside a grid cell', () => {
    const stack: StackBlock = {
      type: 'stack', _id: 's', gap: 'md', bgColor: '#FFF1F6', padding: 20,
      children: [{ type: 'text', body: 'A' }, { type: 'text', body: 'B' }],
    }
    const html = render(stack)
    expect(html).toContain('stack-gap-md')
    expect(html).toContain('background-color:#FFF1F6')
    expect(html).toContain('padding:20px')
    expect(html.match(/stack-item/g)).toHaveLength(2)
  })
})
