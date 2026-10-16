import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { SectionBlock } from '../types'

describe('section', () => {
  it('renders section with padding class + children', () => {
    const b: SectionBlock = { type: 'section', padding: 'md', children: [{ type: 'heading', title: '项目一览' }] }
    const html = renderBlock(b)
    expect(html).toContain('class="section sec-pad-md"')
    expect(html).toContain('项目一览')
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
