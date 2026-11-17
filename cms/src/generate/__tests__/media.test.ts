import { describe, it, expect } from 'vitest'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectMediaUrls, copyMedia, mediaFileName } from '../media'

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

  it('collects zigzag icons', () => {
    const d = {
      pages: [{ title: 't', route: '/', blocks: [{
        type: 'zigzag', items: [{ icon: '/api/media/file/zig.svg', text: 'A' }],
      }] }],
    } as any
    expect([...collectMediaUrls(d)]).toContain('/api/media/file/zig.svg')
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

  it('decodes percent-encoded media file names', () => {
    expect(mediaFileName('/api/media/file/%E9%92%A2%E9%93%81%E4%BE%A0.jpeg'))
      .toBe('钢铁侠.jpeg')
  })

  it('copies a media file whose URL is percent-encoded', () => {
    const mediaDir = mkdtempSync(path.join(tmpdir(), 'zhonghui-media-'))
    const outDir = mkdtempSync(path.join(tmpdir(), 'zhonghui-out-'))
    try {
      writeFileSync(path.join(mediaDir, '钢铁侠.jpeg'), 'image')
      copyMedia(
        new Set(['/api/media/file/%E9%92%A2%E9%93%81%E4%BE%A0.jpeg']),
        mediaDir,
        outDir,
      )
      expect(existsSync(path.join(outDir, 'assets/media/钢铁侠.jpeg'))).toBe(true)
    } finally {
      rmSync(mediaDir, { recursive: true, force: true })
      rmSync(outDir, { recursive: true, force: true })
    }
  })
})
