import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { SliderBlock } from '../types'

describe('slider', () => {
  it('renders swiper structure with slides', () => {
    const b: SliderBlock = { type: 'slider', images: ['/m/1.jpg', '/m/2.jpg'] }
    const html = renderBlock(b)
    expect(html).toContain('class="container container--full"')
    expect(html).toContain('swiper memory-swiper')
    expect(html).toContain('swiper-slide')
    expect(html).toContain('src="/m/1.jpg"')
    expect(html).toContain('memory-arrow')
  })
})
