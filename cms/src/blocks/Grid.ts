import type { Block } from 'payload'
import { TextBlock } from './Text'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { ButtonBlock } from './Button'
import { RichTextBlock } from './RichText'
import { GalleryBlock } from './Gallery'
import { HeadingBlock } from './Heading'
import { IconCardBlock } from './IconCard'

export const contentBlocks: Block[] = [HeadingBlock, TextBlock, ImageBlock, ImageTextBlock, ButtonBlock, RichTextBlock, GalleryBlock, IconCardBlock]

export function makeGrid(slug: string, label: string, cellComponents: Block[]): Block {
  return {
    slug,
    labels: { singular: label, plural: label },
    fields: [
      { name: 'columns', type: 'number', defaultValue: 3, min: 1, max: 4 },
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
      { name: 'children', type: 'blocks', blocks: cellComponents },
      { name: 'bgImage', type: 'text', admin: { description: '背景图片 URL' } },
      { name: 'bgColor', type: 'text', admin: { description: '背景颜色，如 #FFF1F6' } },
      // 旧字段：迁移后不再使用，保留以避免触发删列迁移。
      { name: 'bg', type: 'text', admin: { hidden: true } },
      { name: 'alt', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    ],
  }
}

export const GridInner = makeGrid('gridInner', '网格(内层)', contentBlocks)
export const Grid = makeGrid('grid', '网格', [...contentBlocks, GridInner])
