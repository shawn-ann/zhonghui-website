import { bgStyle } from './primitives'

export function shell(options: { bg?: string; alt?: boolean; id?: string }, inner: string): string {
  const style = bgStyle(options.bg)
  const cls = ['section']
  if (!style && options.alt) cls.push('section-alt')
  const idAttr = options.id ? ` data-bid="${options.id}"` : ''
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
