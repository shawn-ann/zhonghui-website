import { esc, safeUrl, bgStyle } from '../primitives'
import type { BannerBlock } from '../types'

function bannerShell(cls: string, style: string, inner: string): string {
  return `<div class="${cls}" ${style}>${inner}</div>`
}

export function renderBanner(b: BannerBlock): string {
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  if (b.variant === 'centered') {
    const style = bgStyle(b.image) || bgStyle(b.bg)
    const inner = `<div class="container cover"${idAttr}>
      ${b.title ? `<h1 data-field="title">${esc(b.title)}</h1>` : ''}
      ${b.sub ? `<div class="sub" data-field="sub">${esc(b.sub)}</div>` : ''}
    </div>`
    return bannerShell(`banner banner--centered ${b.alt ? 'section-alt' : ''}`, style, inner)
  }
  const img = safeUrl(b.image)
  const pattern = b.pattern ? safeUrl(b.pattern) : ''
  const inner = `<div class="container banner-grid"${idAttr}>
    <div class="banner-text">
      ${b.title ? `<h1 data-field="title">${esc(b.title)}</h1>` : ''}
      ${b.sub ? `<p class="sub" data-field="sub">${esc(b.sub)}</p>` : ''}
    </div>
    ${img ? `<div class="banner-media">
      ${pattern ? `<img class="banner-pattern" src="${esc(pattern)}" alt="">` : ''}
      <img class="banner-photo" src="${esc(img)}" alt="${esc(b.title || '中惠文化')}">
    </div>` : ''}
  </div>`
  return bannerShell(`banner banner--split ${b.alt ? 'section-alt' : ''}`, bgStyle(b.bg), inner)
}
