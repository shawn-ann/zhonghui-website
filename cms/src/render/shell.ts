import { bgStyle } from './primitives'

export function shell(options: { bg?: string; alt?: boolean }, inner: string): string {
  const style = bgStyle(options.bg)
  const cls = ['section']
  if (!style && options.alt) cls.push('section-alt')
  return `<section class="${cls.join(' ')}" ${style}>${inner}</section>`
}
