import { describe, it, expect } from 'vitest'
import type { GridBlock, GridCellBlock, GridRowBlock } from '../../render/types'
import { convertGridLayout, resizeRowCells } from '../gridLayout'

const text = (body: string) => ({ type: 'text' as const, _id: body, body })
const cell = (children: any[] = []): GridCellBlock => ({ type: 'gridCell', _id: `c-${Math.random()}`, children })

describe('gridLayout', () => {
  it('converts flow content into explicit rows with empty cells', () => {
    const flow: GridBlock = {
      type: 'grid', _id: 'g', columns: 3, columnRatio: '1:1:1',
      children: [text('a'), text('b'), text('c'), text('d'), text('e')],
    }
    const rows = convertGridLayout(flow, 'rows')
    expect(rows.layout).toBe('rows')
    expect(rows.children).toHaveLength(2)
    const [first, second] = rows.children as GridRowBlock[]
    expect(first.children).toHaveLength(3)
    expect(second.children).toHaveLength(3)
    expect((second.children[1] as GridCellBlock).children.map((c) => c._id)).toEqual(['e'])
    expect((second.children[2] as GridCellBlock).children).toEqual([])
  })

  it('flattens rows back to flow content without empty cells', () => {
    const rows: GridBlock = {
      type: 'grid', _id: 'g', layout: 'rows', columns: 3,
      children: [{
        type: 'gridRow', _id: 'r', columns: 3,
        children: [cell([text('a')]), cell(), cell([text('b')])],
      }],
    }
    const flow = convertGridLayout(rows, 'flow')
    expect(flow.layout).toBe('flow')
    expect(flow.children.map((c) => c._id)).toEqual(['a', 'b'])
  })

  it('keeps a full empty row when converting an empty grid', () => {
    const rows = convertGridLayout({ type: 'grid', _id: 'g', columns: 6, children: [] }, 'rows')
    expect(rows.children).toHaveLength(1)
    expect((rows.children[0] as GridRowBlock).children).toHaveLength(6)
  })

  it('flattens existing rows when switching to rows again', () => {
    const grid: GridBlock = {
      type: 'grid', _id: 'g', layout: 'rows', columns: 3,
      children: [{
        type: 'gridRow', _id: 'r', columns: 3,
        children: [cell([text('a')]), cell(), cell([text('b')])],
      }],
    }
    const rows = convertGridLayout(grid, 'rows')
    expect(rows.children).toHaveLength(1)
    const cells = (rows.children[0] as GridRowBlock).children
    expect((cells[0] as GridCellBlock).children.map((c) => c._id)).toEqual(['a'])
    expect((cells[1] as GridCellBlock).children.map((c) => c._id)).toEqual(['b'])
  })

  it('does not shrink a row past cells that contain content', () => {
    const row: GridRowBlock = {
      type: 'gridRow', _id: 'r', columns: 6,
      children: [cell(), cell(), cell(), cell(), cell([text('x')]), cell([text('y')])],
    }
    expect(resizeRowCells(row, 4).children).toHaveLength(6)
    expect(resizeRowCells(row, 4).columns).toBe(6)
  })

  it('grows a row and normalizes the ratio', () => {
    const row: GridRowBlock = {
      type: 'gridRow', _id: 'r', columns: 3, columnRatio: '1:1:1',
      children: [cell(), cell(), cell()],
    }
    const grown = resizeRowCells(row, 8)
    expect(grown.columns).toBe(6)
    expect(grown.children).toHaveLength(6)
    expect(grown.columnRatio).toBe('1:1:1:1:1:1')
  })
})
