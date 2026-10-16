import { esc } from './primitives'
import { renderTop } from './blocks/wrap'
import { renderNav } from './nav'
import { renderFooter } from './footer'
import type { PageDoc } from './types'

export interface DocumentAssets {
  mode: 'external' | 'inline'
  css?: string
  swiperCss?: string
  swiperJs?: string
  mainJs?: string
}

function head(page: PageDoc, a: DocumentAssets): string {
  const title = page.seo?.title || page.title
  const desc = page.seo?.description || ''
  const styleTags =
    a.mode === 'inline'
      ? `${a.swiperCss ? `<style>${a.swiperCss}</style>` : ''}${a.css ? `<style>${a.css}</style>` : ''}`
      : '<link rel="stylesheet" href="/assets/swiper-bundle.min.css"><link rel="stylesheet" href="/assets/style.css">'
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
  ${styleTags}
</head>`
}

function scripts(a: DocumentAssets): string {
  if (a.mode === 'inline') {
    return `${a.swiperJs ? `<script>${a.swiperJs}</script>` : ''}${a.mainJs ? `<script>${a.mainJs}</script>` : ''}`
  }
  return '<script src="/assets/swiper-bundle.min.js"></script><script src="/assets/main.js"></script>'
}

export function renderDocument(page: PageDoc, assets: DocumentAssets): string {
  const body = page.blocks.map(renderTop).join('')
  return `${head(page, assets)}
<body>
  ${renderNav(page.route)}
  <main id="page">${body}</main>
  ${renderFooter()}
  ${scripts(assets)}
</body>
</html>`
}
