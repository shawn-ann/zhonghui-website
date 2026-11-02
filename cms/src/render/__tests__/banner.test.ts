import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { BannerBlock } from '../types'

describe('banner', () => {
  it('renders split layout with photo + pattern', () => {
    const b: BannerBlock = { type: 'banner', variant: 'split', title: 'T', sub: 'S', image: '/m/hero.jpg', pattern: '/m/p.svg' }
    const html = renderBlock(b)
    expect(html.startsWith('<div class="banner')).toBe(true)
    expect(html).toContain('banner--split')
    expect(html).toContain('class="container banner-grid"')
    expect(html).toContain('banner-photo')
    expect(html).toContain('src="/m/hero.jpg"')
    expect(html).toContain('banner-pattern')
    expect(html).toContain('T')
    expect(html).toContain('S')
  })
  it('renders centered layout with bg image', () => {
    const b: BannerBlock = { type: 'banner', variant: 'centered', title: 'T', image: '/m/bg.jpg' }
    const html = renderBlock(b)
    expect(html.startsWith('<div class="banner')).toBe(true)
    expect(html).toContain('banner--centered')
    expect(html).toContain('/m/bg.jpg')
    expect(html).toContain('class="container cover"')
  })
})
