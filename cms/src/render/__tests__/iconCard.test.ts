import { describe, it, expect } from 'vitest'
import { renderBlock } from '../blocks'
import type { IconCardBlock } from '../types'

describe('iconCard', () => {
  it('renders card, icon img, title and desc with line breaks', () => {
    const b: IconCardBlock = {
      type: 'iconCard',
      icon: '/m/badge.svg',
      title: '资质齐全',
      desc: '官方认可资质\n合规规范运营\n全流程受监管',
    }
    const html = renderBlock(b)
    expect(html).toContain('class="adv-card"')
    expect(html).toContain('<img src="/m/badge.svg"')
    expect(html).toContain('<h3 data-field="title">资质齐全</h3>')
    expect(html).toContain('官方认可资质<br>合规规范运营<br>全流程受监管')
  })

  it('escapes title and drops javascript link', () => {
    const b: IconCardBlock = { type: 'iconCard', icon: '/m/a.svg', title: '<b>', link: 'javascript:x' }
    const html = renderBlock(b)
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('<a ')
  })

  it('wraps the card in a link for safe urls', () => {
    const b: IconCardBlock = { type: 'iconCard', icon: '/m/a.svg', link: '/about/' }
    const html = renderBlock(b)
    expect(html).toContain('href="/about/"')
  })
})
