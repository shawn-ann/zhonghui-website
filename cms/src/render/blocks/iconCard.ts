import { esc, safeUrl } from '../primitives'
import type { IconCardBlock } from '../types'

export function renderIconCard(b: IconCardBlock): string {
  const icon = safeUrl(b.icon)
  const href = b.link ? safeUrl(b.link) : ''
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const card = `<div class="adv-card"${idAttr}>
    ${icon ? `<div class="icon"><img src="${esc(icon)}" alt="${esc(b.title || '')}"></div>` : ''}
    ${b.title ? `<h3 data-field="title">${esc(b.title)}</h3>` : ''}
    ${b.desc ? `<p data-field="desc">${esc(b.desc).replace(/\n/g, '<br>')}</p>` : ''}
  </div>`
  const wrapped = href ? `<a href="${esc(href)}" style="color:inherit">${card}</a>` : card
  return `<div class="container">${wrapped}</div>`
}
