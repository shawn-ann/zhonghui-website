import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import { renderTop } from '../blocks/wrap'

describe('editor hooks', () => {
  it('text emits data-field and its own data-bid root', () => {
    const html = renderBlock({ type: 'text', body: 'x', title: 't', _id: 'b1' } as any)
    expect(html).toContain('data-bid="b1"')
    expect(html).toContain('data-field="title"')
    expect(html).toContain('data-field="body"')
    expect(renderTop({ type: 'text', body: 'x', title: 't', _id: 'b1' } as any)).toContain('data-bid="b1"')
  })
  it('banner emits data-bid and field hooks', () => {
    const html = renderBlock({ type: 'banner', variant: 'split', title: 't', sub: 's', _id: 'b2' } as any)
    expect(html).toContain('data-bid="b2"')
    expect(html).toContain('data-field="title"')
    expect(html).toContain('data-field="sub"')
  })
  it('button label field hook', () => {
    const html = renderBlock({ type: 'button', label: 'x', link: '/a', _id: 'b3' } as any)
    expect(html).toContain('data-field="label"')
    expect(html).toContain('data-bid="b3"')
  })
  it('omits data-bid when no _id', () => {
    expect(renderBlock({ type: 'banner', variant: 'split', title: 't' } as any)).not.toContain('data-bid')
    expect(renderTop({ type: 'text', body: 'x' } as any)).not.toContain('data-bid')
  })
})
