import { describe, it, expect } from 'vitest'
import { renderPage } from '../layout'
import type { PageDoc } from '../types'

const page: PageDoc = {
  title: '关于',
  route: '/about/',
  seo: { title: '关于中惠', description: '简介' },
  blocks: [{ type: 'text', body: '你好' }],
}

describe('renderPage', () => {
  it('produces a full html document', () => {
    const html = renderPage(page)
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<title>关于中惠</title>')
    expect(html).toContain('assets/style.css')
    expect(html).toContain('你好')
    expect(html).toContain('</html>')
  })
  it('falls back to page title when no seo.title', () => {
    const html = renderPage({ ...page, seo: undefined })
    expect(html).toContain('<title>关于</title>')
  })
})
