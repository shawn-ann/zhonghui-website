import { esc, safeUrl } from './primitives'
import { shell } from './shell'
import type { Block, TextBlockData, ImageBlockData } from './types'

function renderText(b: TextBlockData): string {
  const align = b.align === 'center' ? 'center' : 'left'
  const inner = `<div class="container"><div class="text-block" style="text-align:${align}">
    ${b.title ? `<h2>${esc(b.title)}</h2>` : ''}
    <p>${esc(b.body)}</p>
  </div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}

function renderImage(b: ImageBlockData): string {
  const src = safeUrl(b.media)
  const img = `<img src="${esc(src)}" alt="${esc(b.altText || '')}">`
  const href = b.link ? safeUrl(b.link) : ''
  const wrapped = href ? `<a href="${esc(href)}">${img}</a>` : img
  const inner = `<div class="container"><div class="image-block">${wrapped}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}

const registry: Record<string, (b: Block) => string> = {
  text: (b) => renderText(b as TextBlockData),
  image: (b) => renderImage(b as ImageBlockData),
}

export function renderBlock(block: Block): string {
  const fn = registry[block.type]
  return fn ? fn(block) : ''
}
