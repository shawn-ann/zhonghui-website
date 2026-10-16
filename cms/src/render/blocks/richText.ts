import { esc } from '../primitives'
import type { RichTextBlock } from '../types'

// b.html is trusted, pre-sanitized HTML (see src/render/richText.ts) — inject as-is.
export function renderRichText(b: RichTextBlock): string {
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  return `<div class="container"${idAttr}><div class="richtext">${b.html || ''}</div></div>`
}
