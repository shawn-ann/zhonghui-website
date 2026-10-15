import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { ButtonBlock } from '../types'

describe('button', () => {
  it('renders a link button', () => {
    const b: ButtonBlock = { type: 'button', label: '报名', link: '/join/', style: 'primary' }
    const html = renderBlock(b)
    expect(html).toContain('href="/join/"')
    expect(html).toContain('报名')
    expect(html).toContain('btn--primary')
  })
  it('drops javascript scheme', () => {
    const b: ButtonBlock = { type: 'button', label: 'x', link: 'javascript:alert(1)' }
    expect(renderBlock(b)).not.toContain('href=')
  })
})
