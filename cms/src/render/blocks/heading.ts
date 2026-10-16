import { esc } from '../primitives'
import type { HeadingBlock } from '../types'

export function renderHeading(b: HeadingBlock): string {
  const align = b.align === 'left' ? 'left' : 'center'
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  return `<div class="container"${idAttr}><div class="section-heading" style="text-align:${align}">
    ${b.title ? `<h2>${esc(b.title)}</h2>` : ''}
    ${b.subtitle ? `<p class="subtitle">${esc(b.subtitle)}</p>` : ''}
  </div></div>`
}
