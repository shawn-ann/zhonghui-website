import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { GalleryBlock } from '../types'

describe('gallery', () => {
  it('renders N images with column class', () => {
    const b: GalleryBlock = { type: 'gallery', images: ['/m/1.jpg', '/m/2.jpg'], columns: 2 }
    const html = renderBlock(b)
    expect(html).toContain('gallery-cols-2')
    expect(html).toContain('src="/m/1.jpg"')
    expect(html).toContain('src="/m/2.jpg"')
  })
})
