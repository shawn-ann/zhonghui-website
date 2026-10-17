import { esc, bgStyle } from '../primitives'
import type { SectionBlock } from '../types'
import { renderBlock } from './renderBlock'

export function renderSection(b: SectionBlock): string {
  const style = bgStyle(b.bg)
  const isImage = !!b.bg && /\//.test(b.bg) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(b.bg)
  const cls = ['section']
  if (isImage) cls.push('on-image')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const inner = (b.children || []).map(renderBlock).join('')
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
