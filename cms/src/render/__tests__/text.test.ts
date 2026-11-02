import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { TextBlock } from '../types'

describe('text padding', () => {
  it('applies uniform padding when > 0', () => {
    const b: TextBlock = { type: 'text', body: 'x', padding: 16 }
    const html = renderBlock(b)
    expect(html).toContain('text-align:left;padding:16px')
  })

  it('omits padding by default', () => {
    const html = renderBlock({ type: 'text', body: 'x' })
    expect(html).not.toContain('padding:')
  })

  it('ignores non-positive padding', () => {
    const html = renderBlock({ type: 'text', body: 'x', padding: 0 })
    expect(html).not.toContain('padding:')
  })
})
