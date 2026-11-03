import { clampColumns, normalizeColumnRatio } from '../render/columnRatio'
import type { GridBlock, GridCellBlock, GridRowBlock } from '../render/types'
import { newId } from './state'

function emptyCell(): GridCellBlock {
  return { type: 'gridCell', _id: newId(), children: [] }
}

function newRow(columns: number, gap: string | undefined, ratio: string | undefined, cells: GridCellBlock[]): GridRowBlock {
  return {
    type: 'gridRow',
    _id: newId(),
    columns,
    gap,
    columnRatio: normalizeColumnRatio(ratio, columns),
    children: cells,
  }
}

/**
 * 在流式与按行布局之间转换。
 * flow → rows：按列数分组，每组补齐空格子。
 * rows → flow：摊平格子内容，丢弃空格子。
 */
export function convertGridLayout(grid: GridBlock, layout: 'flow' | 'rows'): GridBlock {
  if (layout === 'rows') {
    const columns = clampColumns(grid.columns)
    const content = (grid.children || []).filter((child) => child.type !== 'gridRow')
    if (content.length === 0) {
      return { ...grid, layout: 'rows', children: [newRow(columns, grid.gap, grid.columnRatio, Array.from({ length: columns }, emptyCell))] }
    }
    const rows: GridRowBlock[] = []
    for (let i = 0; i < content.length; i += columns) {
      const chunk = content.slice(i, i + columns)
      const cells: GridCellBlock[] = chunk.map((child) => ({
        type: 'gridCell',
        _id: newId(),
        children: [child],
      }))
      while (cells.length < columns) cells.push(emptyCell())
      rows.push(newRow(columns, grid.gap, grid.columnRatio, cells))
    }
    return { ...grid, layout: 'rows', children: rows }
  }

  const children = (grid.children || []).flatMap((child) => {
    if (child.type !== 'gridRow') return [child]
    return (child.children || []).flatMap((cell) => (cell.type === 'gridCell' ? cell.children || [] : []))
  })
  return { ...grid, layout: 'flow', children }
}

/** 调整行内格子数；不会缩掉末尾有内容的格子。 */
export function resizeRowCells(row: GridRowBlock, columns: number): GridRowBlock {
  const target = clampColumns(columns)
  const cells = [...(row.children || [])]
  let lastFilled = 0
  cells.forEach((cell, index) => {
    if (cell.type === 'gridCell' && cell.children?.length) lastFilled = index + 1
  })
  const count = Math.max(target, lastFilled)
  while (cells.length < count) cells.push(emptyCell())
  cells.length = count
  return {
    ...row,
    columns: count,
    columnRatio: normalizeColumnRatio(row.columnRatio, count),
    children: cells,
  }
}
