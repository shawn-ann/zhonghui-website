import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { HeadingBlock } from '../types'

describe('heading', () => {
  it('renders title + optional subtitle + align', () => {
    const html = renderBlock({ type: 'heading', title: '项目一览', subtitle: '副标题', align: 'center' } as HeadingBlock)
    expect(html).toContain('class="section-heading"')
    expect(html).toContain('<h2>项目一览</h2>')
    expect(html).toContain('副标题')
    expect(html).toContain('text-align:center')
  })
  it('omits subtitle when empty', () => {
    expect(renderBlock({ type: 'heading', title: 'T' } as HeadingBlock)).not.toContain('subtitle')
  })
  it('applies padding only when positive', () => {
    expect(renderBlock({ type: 'heading', title: 'T', padding: 20 })).toContain('padding:20px')
    expect(renderBlock({ type: 'heading', title: 'T' })).not.toContain('padding:')
  })
})
