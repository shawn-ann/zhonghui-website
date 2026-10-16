import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { ImageTextBlock } from '../types'

export function renderImageText(b: ImageTextBlock): string {
  const src = safeUrl(b.media)
  const href = b.link ? safeUrl(b.link) : ''
  const card = `<div class="image-text">
    ${src ? `<div class="it-img"><img src="${esc(src)}" alt="${esc(b.title || '')}"></div>` : ''}
    <div class="it-body">
      ${b.title ? `<h3>${esc(b.title)}</h3>` : ''}
      ${b.desc ? `<p>${esc(b.desc)}</p>` : ''}
    </div>
  </div>`
  const wrapped = href ? `<a class="it-link" href="${esc(href)}">${card}</a>` : card
  return shell({ bg: b.bg, alt: b.alt }, `<div class="container">${wrapped}</div>`)
}
