import { existsSync, mkdirSync, copyFileSync } from 'fs'
import path from 'path'
import type { Block, SiteData } from '../render/types'

const MEDIA_URL_PREFIX = '/api/media/file/'
const OUT_MEDIA_DIR = 'assets/media'

export function collectMediaUrls(data: SiteData): Set<string> {
  const set = new Set<string>()
  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      const add = (u?: string) => { if (u && u.startsWith(MEDIA_URL_PREFIX)) set.add(u) }
      switch (b.type) {
        case 'image': add(b.media); break
        case 'imageText': add(b.media); break
        case 'iconCard': add(b.icon); add(b.bgImage); break
        case 'banner': add(b.image); add(b.pattern); break
        case 'gallery': b.images.forEach(add); break
        case 'slider': b.images.forEach(add); break
        case 'grid': walk(b.children); add(b.bgImage); break
        case 'section': walk(b.children); add(b.bgImage); break
        case 'richtext': {
          const matches = b.html.match(/\/api\/media\/file\/[^"'\s)]+/g)
          if (matches) matches.forEach(add)
          break
        }
      }
      add((b as { bg?: string }).bg)
    }
  }
  data.pages.forEach((p) => walk(p.blocks))
  return set
}

export function mediaFileName(url: string): string {
  return path.basename(url.slice(MEDIA_URL_PREFIX.length))
}

export function rewriteMediaUrls(html: string): string {
  return html.split(MEDIA_URL_PREFIX).join('/' + OUT_MEDIA_DIR + '/')
}

export function copyMedia(urls: Set<string>, mediaDir: string, outDir: string): void {
  const destDir = path.join(outDir, OUT_MEDIA_DIR)
  for (const url of urls) {
    const name = mediaFileName(url)
    const from = path.join(mediaDir, name)
    if (existsSync(from)) {
      mkdirSync(destDir, { recursive: true })
      copyFileSync(from, path.join(destDir, name))
    }
  }
}
