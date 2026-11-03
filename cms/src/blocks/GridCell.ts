import type { Block } from 'payload'
import { gridContent } from './gridContent'

/** 行内的显式格子；children 为空表示空格子。 */
export const GridCellBlock: Block = {
  slug: 'gridCell',
  labels: { singular: '格子', plural: '格子' },
  fields: [
    {
      name: 'children',
      type: 'blocks',
      blocks: gridContent,
      labels: { singular: '内容', plural: '内容' },
    },
  ],
}
