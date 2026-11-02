import { renderDocument } from './document'
import type { PageDoc } from './types'

/**
 * 静态生成使用的整页渲染（外部引用 /assets/*）。
 * 委托给同构入口 renderDocument，避免模板重复。
 */
export function renderPage(page: PageDoc): string {
  return renderDocument(page, { mode: 'external' })
}
