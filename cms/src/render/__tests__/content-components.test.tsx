import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { blockNode } from '../../site/blocks'
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

  it('renders text line breaks', () => {
    const html = render({ type: 'text', _id: 'tb', body: '第一行\n第二行' })
    expect(html).toContain('第一行<br/>第二行')
  })

  it('renders grid column ratio for two columns', () => {
    const b: GridBlock = {
      type: 'grid',
      _id: 'g',
      columns: 2,
      columnRatio: 'leftNarrow',
      children: [],
    }
    expect(render(b)).toContain('grid-template-columns:0.9fr 1.4fr')
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

  it('renders image text subtitle', () => {
    const b: ImageTextBlock = {
      type: 'imageText',
      _id: 'it',
      media: '/a.jpg',
      title: 'Lucy',
      subtitle: '创始人',
    }
    const html = render(b)
    expect(html).toContain('it-subtitle')
    expect(html).toContain('创始人')
  })

  it('renders info list with and without dots', () => {
    const b: InfoListBlock = {
      type: 'infoList',
      _id: 'i',
      showDots: false,
      items: [{ label: '', desc: '说明一' }, { label: '食宿', desc: '免费' }],
    }
    const html = render(b)
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
