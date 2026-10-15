import { describe, it, expect } from 'vitest'
import { renderBlock } from '../components'
import type { Block } from '../types'

describe('renderBlock', () => {
  it('renders text block with title and body', () => {
    const b: Block = { type: 'text', title: '标题', body: '正文', align: 'center' }
    const html = renderBlock(b)
    expect(html).toContain('<h2>标题</h2>')
    expect(html).toContain('正文')
    expect(html).toContain('text-align:center')
    expect(html).toContain('class="section"')
  })

  it('renders image block with img and link', () => {
    const b: Block = { type: 'image', media: 'img/a.jpg', altText: '图', link: '/x/' }
    const html = renderBlock(b)
    expect(html).toContain('src="img/a.jpg"')
    expect(html).toContain('alt="图"')
    expect(html).toContain('href="/x/"')
  })

  it('returns empty string for unknown type', () => {
    // @ts-expect-error 故意测试未知类型
    expect(renderBlock({ type: 'nope' })).toBe('')
  })
})
