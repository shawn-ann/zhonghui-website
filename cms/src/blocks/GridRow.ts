import type { Block } from 'payload'
import { GridCellBlock } from './GridCell'

/** 按行布局中的一行；cells 由 columns 控制显示数量。 */
export const GridRowBlock: Block = {
  slug: 'gridRow',
  labels: { singular: '行', plural: '行' },
  fields: [
    { name: 'columns', type: 'number', defaultValue: 3, min: 1, max: 6 },
    {
      name: 'gap',
      type: 'select',
      defaultValue: 'md',
      options: [
        { label: '紧凑', value: 'sm' },
        { label: '标准', value: 'md' },
        { label: '宽松', value: 'lg' },
      ],
    },
    {
      name: 'columnRatio',
      type: 'text',
      defaultValue: '1:1:1',
      admin: { description: '正整数比例，段数需等于列数，如 2:3 或 1:2:1' },
    },
    {
      name: 'children',
      type: 'blocks',
      blocks: [GridCellBlock],
      labels: { singular: '格子', plural: '格子' },
    },
  ],
}
