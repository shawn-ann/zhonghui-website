import { esc } from './primitives'
import { renderBlock } from './blocks'
import { renderNav } from './nav'
import { renderFooter } from './footer'
import type { PageDoc } from './types'

function renderHead(page: PageDoc): string {
  const title = page.seo?.title || page.title
  const desc = page.seo?.description || ''
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  ${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
  <link rel="stylesheet" href="/assets/swiper-bundle.min.css">
  <link rel="stylesheet" href="/assets/style.css">
</head>`
}

export function renderPage(page: PageDoc): string {
  const body = page.blocks.map(renderBlock).join('')
  return `${renderHead(page)}
<body>
  ${renderNav(page.route)}
  <main id="page">${body}</main>
  ${renderFooter()}
  <script src="/assets/swiper-bundle.min.js"></script>
  <script src="/assets/main.js"></script>
</body>
</html>`
}
