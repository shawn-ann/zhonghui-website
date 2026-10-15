import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { ImageTextBlock } from '../types'

describe('imageText', () => {
  it('renders image + title + desc', () => {
    const b: ImageTextBlock = { type: 'imageText', media: '/m/a.jpg', title: '标题', desc: '描述', link: '/x/' }
    const html = renderBlock(b)
    expect(html).toContain('class="image-text"')
    expect(html).toContain('src="/m/a.jpg"')
    expect(html).toContain('<h3>标题</h3>')
    expect(html).toContain('描述')
    expect(html).toContain('href="/x/"')
  })
  it('escapes title and drops javascript link', () => {
    const b: ImageTextBlock = { type: 'imageText', media: '/m/a.jpg', title: '<b>', link: 'javascript:x' }
    const html = renderBlock(b)
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('javascript:')
  })
})
