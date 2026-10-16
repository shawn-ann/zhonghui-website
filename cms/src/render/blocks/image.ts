import { esc, safeUrl } from '../primitives'
import type { ImageBlock } from '../types'

export function renderImage(b: ImageBlock): string {
  const src = safeUrl(b.media)
  const img = `<img src="${esc(src)}" alt="${esc(b.altText || '')}">`
  const href = b.link ? safeUrl(b.link) : ''
  const wrapped = href ? `<a href="${esc(href)}">${img}</a>` : img
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  return `<div class="container"${idAttr}><div class="image-block">${wrapped}</div></div>`
}
