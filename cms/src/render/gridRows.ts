import { clampColumns } from './columnRatio'

export interface RowLike {
  columns?: unknown
  children?: unknown
}

/**
 * 行的有效列数：至少覆盖最后一个有内容的格子，避免列数配置偏小时内容被截断。
 * 缺省列数按 3 处理（与区块默认值一致）。
 */
export function effectiveRowColumns(row: RowLike): number {
  const base = clampColumns(row.columns ?? 3)
  let lastFilled = 0
  const cells = Array.isArray(row.children) ? row.children : []
  cells.forEach((cell, index) => {
    const children = (cell as { children?: unknown[] } | null)?.children
    if (Array.isArray(children) && children.length) lastFilled = index + 1
  })
  return Math.min(6, Math.max(base, lastFilled))
}
