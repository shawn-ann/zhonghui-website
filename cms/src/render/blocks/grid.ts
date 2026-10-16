import { shell } from '../shell'
import type { GridBlock } from '../types'
import { renderBlock } from './renderBlock'

export function renderGrid(b: GridBlock): string {
  const cols = Math.min(4, Math.max(1, b.columns || 3))
  const gap = b.gap && /^(sm|md|lg)$/.test(b.gap) ? b.gap : 'md'
  const cells = (b.cells || [])
    .map((c) => `<div class="grid-cell">${(c.components || []).map(renderBlock).join('')}</div>`)
    .join('')
  const inner = `<div class="container"><div class="grid grid-cols-${cols} grid-gap-${gap}">${cells}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
