import { describe, it, expect } from 'vitest'
import { renderTop } from '../blocks/wrap'
import type { Block } from '../types'

describe('renderTop', () => {
  it('wraps a content block in a section (bg/alt honored)', () => {
    const b: Block = { type: 'text', body: 'hi', _id: 'b1', alt: true }
    const html = renderTop(b)
    expect(html).toContain('class="section section-alt"')
    expect(html).toContain('data-bid="b1"')
    expect(html).toContain('hi')
  })
  it('applies bg style and skips alt', () => {
    const html = renderTop({ type: 'text', body: 'x', bg: '#FFF1F6', alt: true })
    expect(html).toContain('style="background:#FFF1F6;"')
    expect(html).not.toContain('section-alt')
  })
  it('does not double-wrap banner', () => {
    const html = renderTop({ type: 'banner', variant: 'split', title: 'T' })
    expect(html.startsWith('<section class="banner')).toBe(true)
    // exactly one section
    expect(html.match(/<section/g)?.length).toBe(1)
  })
})
