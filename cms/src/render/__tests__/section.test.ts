import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { SectionBlock } from '../types'

describe('section', () => {
  it('renders flat 4-direction padding + children', () => {
    const b: SectionBlock = {
      type: 'section',
      paddingTop: 60,
      paddingBottom: 120,
      children: [{ type: 'heading', title: '项目一览' }],
    }
    const html = renderBlock(b)
    expect(html).toContain('style="padding:60px 0px 120px 0px;')
    expect(html).toContain('class="section"')
    expect(html).toContain('项目一览')
  })
  it('defaults to 72px top/bottom and 0 left/right', () => {
    const html = renderBlock({ type: 'section', children: [] })
    expect(html).toContain('style="padding:72px 0px 72px 0px;')
  })
  it('renders all four directions', () => {
    const b: SectionBlock = {
      type: 'section',
      paddingTop: 10,
      paddingRight: 20,
      paddingBottom: 30,
      paddingLeft: 40,
      children: [],
    }
    expect(renderBlock(b)).toContain('style="padding:10px 20px 30px 40px;')
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
