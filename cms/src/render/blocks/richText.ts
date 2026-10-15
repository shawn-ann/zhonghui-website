import { shell } from '../shell'
import type { RichTextBlock } from '../types'

export function renderRichText(b: RichTextBlock): string {
  const inner = `<div class="container"><div class="richtext">${b.html || ''}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
