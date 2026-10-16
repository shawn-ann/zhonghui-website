import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderPage } from '../render/layout'
import type { SiteData } from '../render/types'
import { routeToFile } from './route'
import { collectMediaUrls, rewriteMediaUrls } from './media'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p: string) => readFileSync(path.resolve(dirname, p), 'utf-8')
const staticDir = path.resolve(dirname, '../static')
const readStatic = (rel: string): Buffer => readFileSync(path.join(staticDir, rel))

const baseCss = read('../render/styles/base.css')
const mainJs = read('../render/styles/main.js')

export interface BuildOptions {
  mediaDir?: string
}

export function generateSite(data: SiteData, _opts?: BuildOptions): Map<string, string | Buffer> {
  const out = new Map<string, string | Buffer>()
  for (const page of data.pages) {
    out.set(routeToFile(page.route), rewriteMediaUrls(renderPage(page)))
  }
  out.set('assets/style.css', baseCss)
  out.set('assets/main.js', mainJs)
  out.set('assets/swiper-bundle.min.css', readStatic('swiper-bundle.min.css'))
  out.set('assets/swiper-bundle.min.js', readStatic('swiper-bundle.min.js'))
  out.set('assets/brand/logo.jpg', readStatic('brand/logo.jpg'))
  out.set('assets/brand/footer-logo.png', readStatic('brand/footer-logo.png'))
  out.set('assets/footbg.jpg', readStatic('footbg.jpg'))
  out.set('assets/pattern-box-5.svg', readStatic('pattern-box-5.svg'))
  return out
}

export { collectMediaUrls, staticDir }
