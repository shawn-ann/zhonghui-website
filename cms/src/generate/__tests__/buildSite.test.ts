import { describe, it, expect } from 'vitest'
import { generateSite } from '../buildSite'
import { collectMediaUrls, rewriteMediaUrls } from '../media'
import type { SiteData } from '../../render/types'

const data: SiteData = {
  pages: [
    { title: '首页', route: '/', blocks: [{ type: 'text', body: 'home' }] },
    { title: '关于', route: '/about/', blocks: [{ type: 'text', body: 'about' }] },
  ],
}

describe('generateSite', () => {
  it('maps each page + emits assets', () => {
    const out = generateSite(data)
    expect([...out.keys()]).toContain('index.html')
    expect(out.get('about/index.html')).toContain('about')
    expect(out.get('assets/style.css')).toContain('.section')
    expect(out.get('assets/main.js')).toContain('swiper')
    expect((out.get('assets/swiper-bundle.min.js') as Buffer).toString('utf-8')).toContain('Swiper')
  })
  it('rewrites media urls', () => {
    expect(rewriteMediaUrls('<img src="/api/media/file/a.jpg">')).toContain('/assets/media/a.jpg')
  })
  it('collects media urls from nested blocks', () => {
    const d: SiteData = {
      pages: [{
        title: 't', route: '/', blocks: [
          { type: 'grid', columns: 1, cells: [{ components: [{ type: 'image', media: '/api/media/file/a.jpg' }] }] },
        ],
      }],
    }
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/a.jpg')
  })
})
