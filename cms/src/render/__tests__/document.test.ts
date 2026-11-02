import { describe, it, expect } from 'vitest'
import { renderDocument } from '../document'
import type { PageDoc } from '../types'

const page: PageDoc = {
  title: '首页',
  route: '/',
  seo: { title: '中惠文化' },
  blocks: [{ type: 'text', body: '你好' }],
}

describe('renderDocument', () => {
  it('external mode emits asset links + scripts', () => {
    const html = renderDocument(page, { mode: 'external' })
    expect(html).toContain('/assets/style.css')
    expect(html).toContain('/assets/swiper-bundle.min.js')
    expect(html).toContain('/assets/main.js')
    expect(html).toContain('<header')
    expect(html).toContain('<footer')
    expect(html).toContain('你好')
  })
  it('disableLinks injects preview link-lock script', () => {
    const html = renderDocument(page, { mode: 'external', disableLinks: true })
    expect(html).toContain("closest('a')")
    expect(html).toContain('preventDefault')
  })
  it('inline mode inlines provided css and omits asset links', () => {
    const html = renderDocument(page, { mode: 'inline', css: '.x{}', swiperJs: 'SWIPER', mainJs: 'MAIN' })
    expect(html).toContain('<style>.x{}</style>')
    expect(html).not.toContain('/assets/style.css')
    expect(html).toContain('<script>SWIPER</script>')
    expect(html).toContain('<script>MAIN</script>')
  })
})
