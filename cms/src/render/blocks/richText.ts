import { shell } from '../shell'
import type { RichTextBlock } from '../types'

// b.html is trusted, pre-sanitized HTML (see src/render/richText.ts) — inject as-is.
export function renderRichText(b: RichTextBlock): string {
  const inner = `<div class="container"><div class="richtext">${b.html || ''}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
