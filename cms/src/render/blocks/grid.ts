import { esc } from '../primitives'
import type { GridBlock } from '../types'
import { renderBlock } from './renderBlock'

export function renderGrid(b: GridBlock): string {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const gap = b.gap && /^(sm|md|lg)$/.test(b.gap) ? b.gap : 'md'
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const cells = (b.cells || [])
    .map((c) => `<div class="grid-cell">${(c.components || []).map(renderBlock).join('')}</div>`)
    .join('')
  return `<div class="container"${idAttr}><div class="grid grid-cols-${cols} grid-gap-${gap}">${cells}</div></div>`
}
