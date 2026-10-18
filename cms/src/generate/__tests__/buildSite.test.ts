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
          { type: 'grid', columns: 1, children: [{ type: 'image', media: '/api/media/file/a.jpg' }] },
        ],
      }],
    }
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/a.jpg')
  })
  it('collects media from section/block bg', () => {
    const d = { pages: [{ title: 't', route: '/', blocks: [
      { type: 'section', padding: 'md', bgImage: '/api/media/file/bg.jpg', children: [] },
      { type: 'grid', columns: 2, bg: '/api/media/file/g.jpg', children: [] },
    ] }] } as any
    const urls = [...collectMediaUrls(d)]
    expect(urls).toContain('/api/media/file/bg.jpg')
    expect(urls).toContain('/api/media/file/g.jpg')
  })
  it('collects media urls from section children (incl. nested grid/slider)', () => {
    const d: SiteData = {
      pages: [{
        title: 't', route: '/', blocks: [
          { type: 'section', children: [
            { type: 'heading', title: 'T' },
            { type: 'grid', columns: 1, children: [{ type: 'imageText', media: '/api/media/file/b.jpg' }] },
            { type: 'slider', images: ['/api/media/file/c.jpg'] },
          ] },
        ],
      }],
    }
    const urls = [...collectMediaUrls(d)]
    expect(urls).toContain('/api/media/file/b.jpg')
    expect(urls).toContain('/api/media/file/c.jpg')
  })
})
