import { describe, it, expect } from 'vitest'
import { generateSite } from '../buildSite'
import type { SiteData } from '../../render/types'

const data: SiteData = {
  pages: [
    { title: '首页', route: '/', blocks: [{ type: 'text', body: 'home' }] },
    { title: '关于', route: '/about/', blocks: [{ type: 'text', body: 'about' }] },
  ],
}

describe('generateSite', () => {
  it('maps each page to its html file', () => {
    const out = generateSite(data)
    expect([...out.keys()]).toContain('index.html')
    expect([...out.keys()]).toContain('about/index.html')
    expect(out.get('about/index.html')).toContain('about')
  })
  it('includes the stylesheet asset', () => {
    const out = generateSite(data)
    expect(out.get('assets/style.css')).toContain('.section')
  })
})
