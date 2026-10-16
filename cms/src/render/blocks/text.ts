import { esc } from '../primitives'
import type { TextBlock } from '../types'

export function renderText(b: TextBlock): string {
  const align = b.align === 'center' ? 'center' : 'left'
  return `<div class="container"><div class="text-block" style="text-align:${align}">
    ${b.title ? `<h2 data-field="title">${esc(b.title)}</h2>` : ''}
    <p data-field="body">${esc(b.body)}</p>
  </div></div>`
}
