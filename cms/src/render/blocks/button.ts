import { esc, safeUrl } from '../primitives'
import { shell } from '../shell'
import type { ButtonBlock } from '../types'

export function renderButton(b: ButtonBlock): string {
  const href = safeUrl(b.link)
  const style = b.style === 'outline' ? 'outline' : 'primary'
  const btn = href
    ? `<a class="btn btn--${style}" href="${esc(href)}">${esc(b.label)}</a>`
    : `<span class="btn btn--${style}">${esc(b.label)}</span>`
  const inner = `<div class="container"><div class="button-block">${btn}</div></div>`
  return shell({ bg: b.bg, alt: b.alt }, inner)
}
