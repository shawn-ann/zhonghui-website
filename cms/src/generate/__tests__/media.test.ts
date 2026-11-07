import { describe, it, expect } from 'vitest'
import { collectMediaUrls } from '../media'

describe('collectMediaUrls', () => {
  it('collects media urls from richtext html', () => {
    const d = { pages: [{ title: 't', route: '/', blocks: [{ type: 'richtext', html: '<p><img src="/api/media/file/rt.jpg"></p>' }] }] } as any
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/rt.jpg')
  })
  it('collects media inside grid rows and cells', () => {
    const d = {
      pages: [{
        title: 't', route: '/', blocks: [{
          type: 'grid', columns: 6, layout: 'rows', children: [{
            type: 'gridRow', columns: 2, children: [{
              type: 'gridCell', children: [{ type: 'image', media: '/api/media/file/grid-cell.jpg' }],
            }],
          }],
        }],
      }],
    } as any
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/grid-cell.jpg')
  })

  it('collects iconList icons', () => {
    const d = {
      pages: [{
        title: 'about', route: '/about/', blocks: [{
          type: 'iconList', iconPosition: 'alternate', items: [
            { icon: '/api/media/file/layers.svg', title: '项目齐全' },
            { icon: '/api/media/file/star.svg', title: '真实案例见证' },
          ],
        }],
      }],
    } as any
    const urls = [...collectMediaUrls(d)]
    expect(urls).toEqual(expect.arrayContaining([
      '/api/media/file/layers.svg', '/api/media/file/star.svg',
    ]))
  })

  it('collects media inside hscroll and stack containers', () => {
    const d = {
      pages: [{
        title: 'about', route: '/about/', blocks: [
          { type: 'hscroll', timeline: true, children: [
            { type: 'imageText', media: '/api/media/file/timeline-1.jpg', title: '2002' },
            { type: 'grid', children: [{ type: 'image', media: '/api/media/file/timeline-2.jpg' }] },
          ] },
          { type: 'stack', gap: 'md', children: [{ type: 'image', media: '/api/media/file/stack.jpg' }] },
        ],
      }],
    } as any
    const urls = [...collectMediaUrls(d)]
    expect(urls).toEqual(expect.arrayContaining([
      '/api/media/file/timeline-1.jpg', '/api/media/file/timeline-2.jpg', '/api/media/file/stack.jpg',
    ]))
  })

  it('collects template banners, covers and body images', () => {
    const d = {
      pages: [
        { title: 'list', route: '/blog/', blocks: [], template: {
          kind: 'caseList', banner: '/api/media/file/banner.jpg', items: [{ cover: '/api/media/file/c1.jpg' }],
        } },
        { title: 'detail', route: '/blog/a/', blocks: [], template: {
          kind: 'caseDetail',
          item: {
            cover: '/api/media/file/cover.jpg',
            body: { root: { children: [{ type: 'image-row', version: 1, images: [{ src: '/api/media/file/body.jpg' }] }] } },
          },
        } },
      ],
    } as any
    const urls = [...collectMediaUrls(d)]
    expect(urls).toEqual(expect.arrayContaining([
      '/api/media/file/banner.jpg', '/api/media/file/c1.jpg',
      '/api/media/file/cover.jpg', '/api/media/file/body.jpg',
    ]))
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
