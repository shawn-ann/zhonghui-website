import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { GalleryBlock } from '../types'

export function renderGallery(b: GalleryBlock): string {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const imgs = (b.images || [])
    .map((src) => safeUrl(src))
    .filter(Boolean)
    .map((src) => `<figure class="gallery-item"><img src="${esc(src)}" alt=""></figure>`)
    .join('')
  const inner = `<div class="container"><div class="gallery gallery-cols-${cols}">${imgs}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
