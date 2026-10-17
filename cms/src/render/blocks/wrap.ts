import { bgStyle } from '../primitives'
import type { Block } from '../types'
import { renderBlock } from './renderBlock'

const SELF_WRAPPED = new Set<string>(['section'])

/** 顶层区块：section 用自己的外壳，其余包一层 .section（沿用 bg/alt 语义）。 */
export function renderTop(block: Block): string {
  const inner = renderBlock(block)
  if (SELF_WRAPPED.has(block.type)) return inner
  const style = bgStyle(block.bg)
  const cls = ['section']
  if (!style && block.alt) cls.push('section-alt')
  return `<section class="${cls.join(' ')}" ${style}>${inner}</section>`
}
