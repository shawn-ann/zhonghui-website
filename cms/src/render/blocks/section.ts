import { bgStyle, esc } from '../primitives'
import type { SectionBlock } from '../types'
import { renderBlock } from './renderBlock'

const PADDINGS = ['none', 'sm', 'md', 'lg'] as const

export function renderSection(b: SectionBlock): string {
  const pad = (PADDINGS as readonly string[]).includes(b.padding || '') ? (b.padding as string) : 'md'
  const style = bgStyle(b.bg)
  const isImage = !!b.bg && /\//.test(b.bg) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(b.bg)
  const cls = ['section', `sec-pad-${pad}`]
  if (isImage) cls.push('on-image')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const inner = (b.children || []).map(renderBlock).join('')
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
