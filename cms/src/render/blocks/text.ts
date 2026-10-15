import { esc } from '../primitives'
import { shell } from '../shell'
import type { TextBlock } from '../types'

export function renderText(b: TextBlock): string {
  const align = b.align === 'center' ? 'center' : 'left'
  const inner = `<div class="container"><div class="text-block" style="text-align:${align}">
    ${b.title ? `<h2>${esc(b.title)}</h2>` : ''}
    <p>${esc(b.body)}</p>
  </div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
