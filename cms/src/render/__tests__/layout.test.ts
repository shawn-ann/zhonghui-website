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
  it('produces a full html document with nav + footer', () => {
    const html = renderPage(page)
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('<title>关于中惠</title>')
    expect(html).toContain('assets/style.css')
    expect(html).toContain('<header')
    expect(html).toContain('<footer')
    expect(html).toContain('你好')
    expect(html).toContain('/assets/main.js')
    expect(html).toContain('</html>')
  })
  it('marks active nav item', () => {
    expect(renderPage(page)).toContain('class="active"')
  })
})
