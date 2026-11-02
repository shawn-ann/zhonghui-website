import { esc, safeUrl } from '../primitives'
import type { ImageTextBlock } from '../types'

export function renderImageText(b: ImageTextBlock): string {
  const src = safeUrl(b.media)
  const href = b.link ? safeUrl(b.link) : ''
  const pad = b.padding && b.padding > 0 ? ` style="padding:${b.padding}px"` : ''
  const card = `<div class="image-text"${pad}>
    ${src ? `<div class="it-img"><img src="${esc(src)}" alt="${esc(b.title || '')}"></div>` : ''}
    <div class="it-body">
      ${b.title ? `<h3 data-field="title">${esc(b.title)}</h3>` : ''}
      ${b.desc ? `<p data-field="desc">${esc(b.desc)}</p>` : ''}
    </div>
  </div>`
  const wrapped = href ? `<a class="it-link" href="${esc(href)}">${card}</a>` : card
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  return `<div class="container"${idAttr}>${wrapped}</div>`
}
