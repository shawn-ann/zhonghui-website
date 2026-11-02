import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { SectionBlock } from '../types'

describe('section', () => {
  it('defaults to md vertical padding (72px)', () => {
    const b: SectionBlock = {
      type: 'section',
      children: [{ type: 'heading', title: '项目一览' }],
    }
    const html = renderBlock(b)
    expect(html).toContain('padding:72px 0')
    expect(html).toContain('class="section"')
    expect(html).toContain('项目一览')
  })
  it('renders zero vertical padding when paddingY is none', () => {
    const html = renderBlock({ type: 'section', paddingY: 'none', children: [] })
    expect(html).toContain('class="section"')
    expect(html).toContain('padding:0px 0')
  })
  it('computes each padding preset', () => {
    expect(renderBlock({ type: 'section', paddingY: 'sm', children: [] })).toContain('padding:32px 0')
    expect(renderBlock({ type: 'section', paddingY: 'md', children: [] })).toContain('padding:72px 0')
    expect(renderBlock({ type: 'section', paddingY: 'lg', children: [] })).toContain('padding:96px 0')
  })
  it('marks image-bg sections as on-image', () => {
    const b: SectionBlock = { type: 'section', bg: '/assets/bg2.jpg', children: [] }
    expect(renderBlock(b)).toContain('on-image')
  })
  it('does not add on-image for color bg', () => {
    const b: SectionBlock = { type: 'section', bg: '#FFF1F6', children: [] }
    expect(renderBlock(b)).not.toContain('on-image')
  })
})
