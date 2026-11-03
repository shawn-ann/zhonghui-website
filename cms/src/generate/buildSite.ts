import { readFileSync } from 'fs'
import path from 'path'
import { renderPage } from '../render/layout'
import type { SiteData } from '../render/types'
import { routeToFile } from './route'
import { rewriteMediaUrls } from './media'
import { normalizeRedirects, renderRedirectHtml } from './redirects'

const cmsDir = process.cwd()
const read = (p: string) => readFileSync(path.resolve(cmsDir, p), 'utf-8')
const staticDir = path.resolve(cmsDir, 'src/static')
const readStatic = (rel: string): Buffer => readFileSync(path.join(staticDir, rel))

const baseCss = read('src/render/styles/base.css')
const mainJs = read('src/render/styles/main.js')

export function generateSite(data: SiteData): Map<string, string | Buffer> {
  const out = new Map<string, string | Buffer>()
  for (const page of data.pages) {
    out.set(routeToFile(page.route), rewriteMediaUrls(renderPage(page, data.site)))
  }
  const redirects = normalizeRedirects(data.redirects || [])
  for (const redirect of redirects) {
    try {
      const file = routeToFile(redirect.from)
      if (!out.has(file)) out.set(file, renderRedirectHtml(redirect.to))
    } catch {
      // 无效旧路径不阻塞整站生成
    }
  }
  if (redirects.length) out.set('redirects.json', JSON.stringify(redirects, null, 2))
  out.set('assets/style.css', baseCss)
  out.set('assets/main.js', mainJs)
  out.set('assets/swiper-bundle.min.css', readStatic('swiper-bundle.min.css'))
  out.set('assets/swiper-bundle.min.js', readStatic('swiper-bundle.min.js'))
  out.set('assets/brand/logo.jpg', readStatic('brand/logo.jpg'))
  out.set('assets/brand/footer-logo.png', readStatic('brand/footer-logo.png'))
  out.set('assets/footbg.jpg', readStatic('footbg.jpg'))
  out.set('assets/bg2.jpg', readStatic('bg2.jpg'))
  out.set('assets/yinji-bg.jpg', readStatic('yinji-bg.jpg'))
  out.set('assets/pattern-box-5.svg', readStatic('pattern-box-5.svg'))
  out.set('assets/pattern-box-5.png', readStatic('pattern-box-5.png'))
  return out
}
