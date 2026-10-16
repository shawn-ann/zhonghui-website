import { esc, safeUrl } from '../primitives'
import type { ButtonBlock } from '../types'

export function renderButton(b: ButtonBlock): string {
  const href = safeUrl(b.link)
  const style = b.style === 'outline' ? 'outline' : 'primary'
  const btn = href
    ? `<a class="btn btn--${style}" href="${esc(href)}" data-field="label">${esc(b.label)}</a>`
    : `<span class="btn btn--${style}" data-field="label">${esc(b.label)}</span>`
  return `<div class="container"><div class="button-block">${btn}</div></div>`
}
