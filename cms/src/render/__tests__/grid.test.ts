import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { GridBlock } from '../types'

describe('grid', () => {
  it('renders columns and child components recursively', () => {
    const b: GridBlock = {
      type: 'grid', columns: 3,
      cells: [
        { components: [{ type: 'text', body: 'A' }] },
        { components: [{ type: 'image', media: '/m/a.jpg', altText: 'a' }] },
      ],
    }
    const html = renderBlock(b)
    expect(html).toContain('grid-cols-3')
    expect(html).toContain('A')
    expect(html).toContain('src="/m/a.jpg"')
  })
  it('ignores unknown child block types', () => {
    const b: GridBlock = { type: 'grid', columns: 2, cells: [{ components: [{ type: 'nope' } as never] }] }
    expect(renderBlock(b)).toContain('grid-cols-2')
  })
})
