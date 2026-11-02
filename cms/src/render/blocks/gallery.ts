import { esc, safeUrl } from '../primitives'
import type { GalleryBlock } from '../types'

export function renderGallery(b: GalleryBlock): string {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const imgs = (b.images || [])
    .map((src) => safeUrl(src))
    .filter(Boolean)
    .map((src) => `<figure class="gallery-item"><img src="${esc(src)}" alt=""></figure>`)
    .join('')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const pad = b.padding && b.padding > 0 ? ` style="padding:${b.padding}px"` : ''
  return `<div class="container"${idAttr}><div class="gallery gallery-cols-${cols}"${pad}>${imgs}</div></div>`
}
