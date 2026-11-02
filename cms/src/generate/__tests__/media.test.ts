import { describe, it, expect } from 'vitest'
import { collectMediaUrls } from '../media'

describe('collectMediaUrls', () => {
  it('collects media urls from richtext html', () => {
    const d = { pages: [{ title: 't', route: '/', blocks: [{ type: 'richtext', html: '<p><img src="/api/media/file/rt.jpg"></p>' }] }] } as any
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/rt.jpg')
  })
  it('collects media urls from banner and gallery', () => {
    const d = { pages: [{ title: 't', route: '/', blocks: [
      { type: 'banner', variant: 'split', image: '/api/media/file/b.jpg', pattern: '/api/media/file/p.svg' },
      { type: 'gallery', images: ['/api/media/file/g.jpg'] },
    ] }] } as any
    const urls = [...collectMediaUrls(d)]
    expect(urls).toEqual(expect.arrayContaining(['/api/media/file/b.jpg', '/api/media/file/p.svg', '/api/media/file/g.jpg']))
  })
})
