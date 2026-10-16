import { esc, safeUrl, bgStyle } from '../primitives'
import type { BannerBlock } from '../types'

function bannerShell(cls: string, style: string, inner: string, id?: string): string {
  return `<section class="${cls}" data-bid="${id || ''}" ${style}>${inner}</section>`
}

export function renderBanner(b: BannerBlock): string {
  if (b.variant === 'centered') {
    const style = bgStyle(b.image) || bgStyle(b.bg)
    const inner = `<div class="container cover">
      ${b.title ? `<h1 data-field="title">${esc(b.title)}</h1>` : ''}
      ${b.sub ? `<div class="sub" data-field="sub">${esc(b.sub)}</div>` : ''}
    </div>`
    return bannerShell(`banner banner--centered ${b.alt ? 'section-alt' : ''}`, style, inner, b._id)
  }
  const img = safeUrl(b.image)
  const pattern = b.pattern ? safeUrl(b.pattern) : ''
  const inner = `<div class="container banner-grid">
    <div class="banner-text">
      ${b.title ? `<h1 data-field="title">${esc(b.title)}</h1>` : ''}
      ${b.sub ? `<p class="sub" data-field="sub">${esc(b.sub)}</p>` : ''}
    </div>
    ${img ? `<div class="banner-media">
      ${pattern ? `<img class="banner-pattern" src="${esc(pattern)}" alt="">` : ''}
      <img class="banner-photo" src="${esc(img)}" alt="${esc(b.title || '中惠文化')}">
    </div>` : ''}
  </div>`
  return bannerShell(`banner banner--split ${b.alt ? 'section-alt' : ''}`, bgStyle(b.bg), inner, b._id)
}
