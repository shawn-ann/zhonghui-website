import { esc, bgStyle } from '../primitives'
import type { SectionBlock } from '../types'
import { renderBlock } from './renderBlock'

function bgDecl(bg?: string): string {
  const s = bgStyle(bg)
  return s ? s.slice(7, -1) : ''
}

export function renderSection(b: SectionBlock): string {
  const t = b.paddingTop ?? 72
  const r = b.paddingRight ?? 0
  const btm = b.paddingBottom ?? 72
  const l = b.paddingLeft ?? 0
  const style = `style="padding:${t}px ${r}px ${btm}px ${l}px;${bgDecl(b.bg)}"`
  const isImage = !!b.bg && /\//.test(b.bg) && !/^(#|var\(|rgb|hsl|linear-gradient|radial-gradient)/i.test(b.bg)
  const cls = ['section']
  if (isImage) cls.push('on-image')
  const idAttr = b._id ? ` data-bid="${esc(b._id)}"` : ''
  const inner = (b.children || []).map(renderBlock).join('')
  return `<section class="${cls.join(' ')}"${idAttr} ${style}>${inner}</section>`
}
