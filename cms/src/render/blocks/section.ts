import { esc, bgDecl } from '../primitives'
import type { SectionBlock } from '../types'
import { renderBlock } from './renderBlock'

const PAD: Record<string, number> = { none: 0, sm: 32, md: 72, lg: 96 }

export function renderSection(b: SectionBlock): string {
  const v = PAD[b.paddingY || 'md'] ?? 72
  const style = `style="padding:${v}px 0;${bgDecl(b.bg)}"`
  const isImage = !!b.bg && /\//.test(b.bg) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(b.bg)
  const cls = ['section']
  if (isImage) cls.push('on-image')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const inner = (b.children || []).map(renderBlock).join('')
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
