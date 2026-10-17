import { esc } from '../primitives'
import type { TextBlock } from '../types'

export function renderText(b: TextBlock): string {
  const align = b.align === 'center' ? 'center' : 'left'
  const pad = b.padding && b.padding > 0 ? `;padding:${b.padding}px` : ''
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  return `<div class="container"${idAttr}><div class="text-block" style="text-align:${align}${pad}">
    ${b.title ? `<h2 data-field="title">${esc(b.title)}</h2>` : ''}
    <p data-field="body">${esc(b.body)}</p>
  </div></div>`
}
